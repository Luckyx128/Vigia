"""Modelos de dados e schemas Pydantic para o Vigia."""
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# --- Schemas de Entrada (Requests) ---

class ProductCreate(BaseModel):
    name: str = Field(..., description="Nome do produto")
    category: Optional[str] = Field(None, description="Categoria do produto (ex: Processador, SSD)")
    specs: Optional[str] = Field(None, description="Especificações resumidas")
    target_price: Optional[float] = Field(None, description="Preço alvo para notificação")


class LinkCreate(BaseModel):
    store_name: str = Field(..., description="Nome da loja (Kabum, Terabyte, Pichau, Amazon, Mercado Livre)")
    url: str = Field(..., description="URL do anúncio do produto")


class NotifyTestRequest(BaseModel):
    message: Optional[str] = Field(None, description="Mensagem de teste customizada")
    kind: Optional[str] = Field("alert", description="Tipo de notificação: success, alert, error")


# --- Schemas de Saída (Responses) ---

class StoreLinkOut(BaseModel):
    id: int
    product_id: int
    store_name: str
    url: str
    is_active: int
    created_at: str


class PriceRecordOut(BaseModel):
    id: Optional[int] = None
    store_link_id: int
    product_id: int
    store_name: str
    price_cash: Optional[float] = None
    price_installment: Optional[float] = None
    installments_text: Optional[str] = None
    in_stock: bool = True
    scraped_at: str


class StoreLinkWithLatestPrice(BaseModel):
    id: int
    product_id: int
    store_name: str
    url: str
    is_active: int
    created_at: str
    latest_price: Optional[Dict[str, Any]] = None


class ProductWithStats(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    specs: Optional[str] = None
    target_price: Optional[float] = None
    lowest_price_now: Optional[float] = None
    lowest_store_now: Optional[str] = None
    all_time_low: Optional[float] = None
    all_time_low_store: Optional[str] = None
    avg_price_30d: Optional[float] = None
    discount_vs_avg: Optional[float] = None
    is_real_discount: bool = False
    links_count: int = 0


class ProductDetailResponse(BaseModel):
    id: int
    name: str
    category: Optional[str] = None
    specs: Optional[str] = None
    target_price: Optional[float] = None
    created_at: str
    links: List[StoreLinkWithLatestPrice] = []


class HistoryRecord(BaseModel):
    id: Optional[int] = None
    scraped_at: str
    store_name: str
    price_cash: Optional[float] = None
    price_installment: Optional[float] = None
    in_stock: bool = True


class ProductHistoryResponse(BaseModel):
    product_id: int
    product_name: str
    stores: List[str]
    records: List[HistoryRecord]


class StatsOverviewResponse(BaseModel):
    total_products: int
    total_links: int
    total_records: int
    all_time_low_deals_count: int
    active_offers_count: int
    last_updated: Optional[str] = None


class SearchCandidateOut(BaseModel):
    store_name: str
    title: str
    url: str
    image: Optional[str] = None
    price_cash: Optional[float] = None
    price_installment: Optional[float] = None
    installments_text: Optional[str] = None
    in_stock: bool = True
    seller: Optional[str] = None
    is_marketplace: bool = False
    offer_name: Optional[str] = None
    score: int = Field(..., description="Semelhança com a busca, de 0 a 100")
    differences: List[str] = Field(default_factory=list, description="Diferenças relevantes (ex: XT, Kit, PC completo)")
    already_added: bool = False


class SearchResponse(BaseModel):
    store: str
    query: str
    results: List[SearchCandidateOut]


class ScrapeSummaryResponse(BaseModel):
    total_scraped: int
    success_count: int
    failed_count: int
    alerts_sent: int
    results: List[Dict[str, Any]] = []
