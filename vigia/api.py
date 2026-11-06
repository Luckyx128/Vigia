"""API FastAPI para o Vigia."""
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from vigia.config import NOTCH_URL, STATIC_DIR
from vigia.database import (
    create_product,
    create_store_link,
    delete_product as db_delete_product,
    delete_store_link as db_delete_store_link,
    get_link_by_id,
    get_product,
    init_db,
)
from vigia.models import (
    LinkCreate,
    NotifyTestRequest,
    ProductCreate,
    ProductDetailResponse,
    ProductHistoryResponse,
    ProductWithStats,
    ScrapeSummaryResponse,
    SearchResponse,
    StatsOverviewResponse,
    StoreLinkOut,
)
from vigia.link_search import UnsupportedStoreError, search_store_links
from vigia.notifier import notify_notch
from vigia.scrapers.base import SearchError
from vigia.service import (
    calculate_stats_for_product,
    get_overview_stats,
    get_product_details,
    get_product_history_data,
    list_products_with_stats,
    scrape_all_products,
    scrape_single_product,
    seed_initial_data,
)

logger = logging.getLogger("vigia.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializa banco e semeia dados se vazio
    init_db()
    seed_initial_data()
    yield


app = FastAPI(
    title="Vigia - Monitor de Preços Black Friday",
    description="API de monitoramento contínuo de preços e alertas de Black Friday",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS para desenvolvimento e dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Endpoints de Produtos ---

@app.get("/api/products", response_model=List[ProductWithStats], summary="Lista produtos com métricas")
def get_products():
    """Retorna lista de todos os produtos monitorados com métricas e cálculo de desconto real."""
    return list_products_with_stats()


@app.post("/api/products", response_model=ProductWithStats, status_code=status.HTTP_201_CREATED, summary="Cadastra produto")
def create_new_product(payload: ProductCreate):
    """Cadastra um novo produto para monitoramento."""
    prod_id = create_product(
        name=payload.name,
        category=payload.category,
        specs=payload.specs,
        target_price=payload.target_price,
    )
    product = get_product(prod_id)
    return calculate_stats_for_product(product)


@app.get("/api/products/{product_id}", response_model=ProductDetailResponse, summary="Detalhes do produto")
def get_single_product(product_id: int):
    """Retorna o produto, todos os links cadastrados e o último preço registrado para cada link."""
    details = get_product_details(product_id)
    if not details:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return details


@app.delete("/api/products/{product_id}", summary="Remove produto")
def remove_product(product_id: int):
    """Remove um produto e todos os links e registros de preços associados."""
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    success = db_delete_product(product_id)
    return {"success": success, "message": f"Produto #{product_id} removido com sucesso"}


# --- Endpoints de Links de Lojas ---

@app.post("/api/products/{product_id}/links", response_model=StoreLinkOut, status_code=status.HTTP_201_CREATED, summary="Adiciona link de loja")
def add_product_link(product_id: int, payload: LinkCreate):
    """Adiciona um link de uma loja específica para monitoramento de um produto."""
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    link_id = create_store_link(
        product_id=product_id,
        store_name=payload.store_name,
        url=payload.url,
    )
    link = get_link_by_id(link_id)
    return link


@app.delete("/api/links/{link_id}", summary="Remove link de loja")
def remove_store_link(link_id: int):
    """Remove um link de loja e seus registros de preços associados."""
    link = get_link_by_id(link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")
    success = db_delete_store_link(link_id)
    return {"success": success, "message": f"Link #{link_id} removido com sucesso"}


# --- Busca de Links nas Lojas ---

@app.get("/api/search", response_model=SearchResponse, summary="Busca anúncios de um produto numa loja")
def search_links(
    q: str = Query(..., min_length=2, description="O que buscar (ex: RX 7600 8GB)"),
    store: str = Query("Kabum", description="Loja onde buscar"),
    product_id: Optional[int] = Query(None, description="Marca como já adicionados os links que este produto já monitora"),
):
    """Busca anúncios na loja, ordenados pela semelhança com o termo buscado. Nada é salvo."""
    try:
        results = search_store_links(store=store, query=q, product_id=product_id)
    except UnsupportedStoreError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except SearchError as exc:
        raise HTTPException(status_code=502, detail=str(exc))
    return {"store": store, "query": q, "results": results}


# --- Endpoints de Histórico e Gráficos ---

@app.get("/api/products/{product_id}/history", response_model=ProductHistoryResponse, summary="Histórico para Chart.js")
def get_product_history(product_id: int):
    """Retorna a série temporal cronológica de preços por loja para renderização em gráficos."""
    data = get_product_history_data(product_id)
    if not data:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    return data


@app.delete("/api/records/{record_id}", summary="Remove um registro específico de preço")
def remove_price_record(record_id: int):
    """Remove uma leitura espúria ou incorreta de preço do histórico."""
    from vigia.database import delete_price_record
    success = delete_price_record(record_id)
    if not success:
        raise HTTPException(status_code=404, detail="Registro não encontrado")
    return {"success": True, "message": f"Registro #{record_id} removido do histórico"}


@app.post("/api/products/{product_id}/reset-history", summary="Limpa todo o histórico de um produto")
def reset_product_history(product_id: int):
    """Apaga todas as leituras antigas de um produto para reiniciar a contagem limpa."""
    from vigia.database import clear_product_history
    count = clear_product_history(product_id)
    return {"success": True, "deleted_count": count, "message": f"{count} registros removidos"}


# --- Endpoints de Varredura / Scraping ---

@app.post("/api/scrape/all", response_model=ScrapeSummaryResponse, summary="Varre todos os produtos")
def trigger_scrape_all():
    """Varre todos os links ativos do catálogo, grava os novos preços e dispara alertas se meta atingida."""
    summary = scrape_all_products()
    return summary


@app.post("/api/scrape/{product_id}", response_model=ScrapeSummaryResponse, summary="Varre um produto específico")
def trigger_scrape_product(product_id: int):
    """Varre todos os links ativos de um produto específico e envia alertas se meta atingida."""
    product = get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Produto não encontrado")
    summary = scrape_single_product(product_id)
    return summary


# --- Endpoints de Estatísticas Gerais e Notificação ---

@app.get("/api/stats/overview", response_model=StatsOverviewResponse, summary="Visão geral do sistema")
def get_stats_overview():
    """Retorna estatísticas consolidadas do sistema (total de produtos, recordes e ofertas ativas)."""
    return get_overview_stats()


@app.post("/api/notify/test", summary="Teste de notificação na Notch")
def test_notch_notification(payload: Optional[NotifyTestRequest] = None):
    """Dispara uma notificação de teste diretamente para o servidor da Notch (Cortinho)."""
    msg = (payload and payload.message) or "🔔 Vigia: Teste de integração de alerta disparado com sucesso!"
    knd = (payload and payload.kind) or "alert"
    sent = notify_notch(message=msg, kind=knd)
    return {
        "success": sent,
        "message": msg,
        "kind": knd,
        "target_url": NOTCH_URL,
    }


# --- Servir arquivos estáticos do Frontend (Visor) ---
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
