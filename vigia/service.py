"""Camada de serviços e regras de negócio do Vigia."""
import logging
import math
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from vigia.database import (
    add_price_record,
    create_product,
    create_store_link,
    delete_product as db_delete_product,
    delete_store_link as db_delete_store_link,
    get_30d_avg,
    get_all_active_links,
    get_all_products,
    get_all_time_low,
    get_latest_prices_by_product,
    get_links_by_product,
    get_price_history_for_product,
    get_product,
    init_db,
)
from vigia.notifier import notify_notch
from vigia.scrapers.dispatcher import scrape_url

logger = logging.getLogger("vigia.service")


def calculate_stats_for_product(product: Dict[str, Any], db_path: Optional[Path] = None) -> Dict[str, Any]:
    """Calcula estatísticas agregadas de preço para um produto."""
    product_id = product["id"]
    latest_prices = get_latest_prices_by_product(product_id, db_path=db_path)
    links = get_links_by_product(product_id, db_path=db_path)

    # Menor preço atual entre as lojas em estoque
    in_stock_prices = [p for p in latest_prices if p.get("in_stock", 1) and p.get("price_cash")]
    lowest_now = None
    lowest_store_now = None
    if in_stock_prices:
        best = min(in_stock_prices, key=lambda x: x["price_cash"])
        lowest_now = round(float(best["price_cash"]), 2)
        lowest_store_now = best["store_name"]

    # Menor preço histórico de todos os tempos
    atl_record = get_all_time_low(product_id, db_path=db_path)
    all_time_low = round(float(atl_record["price_cash"]), 2) if atl_record else None
    all_time_low_store = atl_record["store_name"] if atl_record else None

    # Média dos últimos 30 dias
    avg_30d = get_30d_avg(product_id, db_path=db_path)

    # Desconto vs média
    discount_vs_avg = None
    is_real_discount = False
    if lowest_now and avg_30d and avg_30d > 0:
        discount_vs_avg = round(((lowest_now - avg_30d) / avg_30d) * 100, 1)
        # Desconto real: pelo menos 2% abaixo da média ou atingiu a meta
        target = product.get("target_price")
        if discount_vs_avg <= -2.0 or (target and lowest_now <= target):
            is_real_discount = True

    return {
        "id": product["id"],
        "name": product["name"],
        "category": product.get("category"),
        "specs": product.get("specs"),
        "target_price": product.get("target_price"),
        "lowest_price_now": lowest_now,
        "lowest_store_now": lowest_store_now,
        "all_time_low": all_time_low,
        "all_time_low_store": all_time_low_store,
        "avg_price_30d": avg_30d,
        "discount_vs_avg": discount_vs_avg,
        "is_real_discount": is_real_discount,
        "links_count": len(links),
    }


def list_products_with_stats(db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retorna lista de todos os produtos com suas métricas de mercado."""
    products = get_all_products(db_path=db_path)
    return [calculate_stats_for_product(p, db_path=db_path) for p in products]


def get_product_details(product_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retorna o produto com todos os links associados e o último preço de cada um."""
    product = get_product(product_id, db_path=db_path)
    if not product:
        return None

    links = get_links_by_product(product_id, db_path=db_path)
    links_with_price = []
    for link in links:
        latest_prices = get_latest_prices_by_product(product_id, db_path=db_path)
        matching = next((p for p in latest_prices if p["store_link_id"] == link["id"]), None)
        link_dict = dict(link)
        link_dict["latest_price"] = matching
        links_with_price.append(link_dict)

    product["links"] = links_with_price
    return product


def get_product_history_data(product_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Gera a estrutura temporal formatada para renderização no Chart.js."""
    product = get_product(product_id, db_path=db_path)
    if not product:
        return None

    records = get_price_history_for_product(product_id, db_path=db_path)
    links = get_links_by_product(product_id, db_path=db_path)
    stores = sorted(list({l["store_name"] for l in links} | {r["store_name"] for r in records}))

    formatted_records = []
    for r in records:
        formatted_records.append({
            "id": r.get("id"),
            "scraped_at": r["scraped_at"],
            "store_name": r["store_name"],
            "price_cash": r["price_cash"],
            "price_installment": r["price_installment"],
            "in_stock": bool(r["in_stock"]),
        })

    return {
        "product_id": product["id"],
        "product_name": product["name"],
        "stores": stores,
        "records": formatted_records,
    }


def get_overview_stats(db_path: Optional[Path] = None) -> Dict[str, Any]:
    """Retorna visão geral do sistema para o dashboard."""
    products = list_products_with_stats(db_path=db_path)
    total_products = len(products)
    
    total_links = sum(p["links_count"] for p in products)
    all_time_low_deals = sum(
        1 for p in products
        if p["lowest_price_now"] and p["all_time_low"] and p["lowest_price_now"] <= p["all_time_low"]
    )
    active_offers = sum(1 for p in products if p["lowest_price_now"] is not None)

    # Total de registros e data do último update
    from vigia.database import get_db
    with get_db(db_path) as conn:
        total_records = conn.execute("SELECT COUNT(*) FROM price_records").fetchone()[0]
        last_rec = conn.execute(
            "SELECT MAX(scraped_at) FROM price_records"
        ).fetchone()[0]

    return {
        "total_products": total_products,
        "total_links": total_links,
        "total_records": total_records,
        "all_time_low_deals_count": all_time_low_deals,
        "active_offers_count": active_offers,
        "last_updated": last_rec,
    }


def scrape_store_link(link: Dict[str, Any], db_path: Optional[Path] = None) -> Dict[str, Any]:
    """Executa a raspagem de um link específico e verifica gatilhos de alerta."""
    product_id = link["product_id"]
    product = get_product(product_id, db_path=db_path)
    store_name = link["store_name"]
    url = link["url"]
    link_id = link["id"]

    # Consulta menor preço histórico anterior
    previous_atl = get_all_time_low(product_id, db_path=db_path)

    # Executa scraping com proteção e fallback
    scrape_res = scrape_url(url=url, store_name=store_name)

    scraped_iso = datetime.now(timezone.utc).isoformat()
    record_id = None
    alert_sent = False
    alert_message = None

    if scrape_res.success and scrape_res.price_cash:
        record_id = add_price_record(
            store_link_id=link_id,
            product_id=product_id,
            store_name=store_name,
            price_cash=scrape_res.price_cash,
            price_installment=scrape_res.price_installment,
            installments_text=scrape_res.installments_text,
            in_stock=1 if scrape_res.in_stock else 0,
            scraped_at=scraped_iso,
            db_path=db_path,
        )

        price = scrape_res.price_cash
        target = product.get("target_price") if product else None
        prod_name = product["name"] if product else f"Produto #{product_id}"

        # Verifica se bateu menor preço histórico
        is_new_atl = False
        if previous_atl and previous_atl.get("price_cash"):
            if price < float(previous_atl["price_cash"]):
                is_new_atl = True

        # Verifica se bateu a meta
        hit_target = target and price <= target

        if is_new_atl or hit_target:
            if is_new_atl and hit_target:
                alert_message = (
                    f"🔥 Vigia: {prod_name} bateu RECORDE HISTÓRICO e meta de preço! "
                    f"R$ {price:.2f} na {store_name} (Meta: R$ {target:.2f})"
                )
            elif is_new_atl:
                alert_message = (
                    f"🔥 Vigia: {prod_name} atingiu o menor preço histórico! "
                    f"R$ {price:.2f} na {store_name}"
                )
            else:
                alert_message = (
                    f"🎯 Vigia: {prod_name} atingiu sua meta de preço! "
                    f"R$ {price:.2f} na {store_name} (Meta: R$ {target:.2f})"
                )

            alert_sent = notify_notch(alert_message, kind="success")

    return {
        "link_id": link_id,
        "product_id": product_id,
        "store_name": store_name,
        "price_cash": scrape_res.price_cash,
        "price_installment": scrape_res.price_installment,
        "in_stock": scrape_res.in_stock,
        "success": scrape_res.success and (scrape_res.price_cash is not None),
        "record_id": record_id,
        "alert_sent": alert_sent,
        "alert_message": alert_message,
    }


def scrape_single_product(product_id: int, db_path: Optional[Path] = None) -> Dict[str, Any]:
    """Varre todos os links ativos pertencentes a um produto específico."""
    links = get_links_by_product(product_id, db_path=db_path)
    active_links = [l for l in links if l.get("is_active", 1)]

    results = []
    success_count = 0
    failed_count = 0
    alerts_count = 0

    for link in active_links:
        res = scrape_store_link(link, db_path=db_path)
        results.append(res)
        if res["success"]:
            success_count += 1
        else:
            failed_count += 1
        if res["alert_sent"]:
            alerts_count += 1

    return {
        "total_scraped": len(active_links),
        "success_count": success_count,
        "failed_count": failed_count,
        "alerts_sent": alerts_count,
        "results": results,
    }


def scrape_all_products(db_path: Optional[Path] = None) -> Dict[str, Any]:
    """Varre todos os links ativos cadastrados no banco."""
    links = get_all_active_links(db_path=db_path)
    results = []
    success_count = 0
    failed_count = 0
    alerts_count = 0

    for link in links:
        res = scrape_store_link(link, db_path=db_path)
        results.append(res)
        if res["success"]:
            success_count += 1
        else:
            failed_count += 1
        if res["alert_sent"]:
            alerts_count += 1

    return {
        "total_scraped": len(links),
        "success_count": success_count,
        "failed_count": failed_count,
        "alerts_sent": alerts_count,
        "results": results,
    }


def seed_initial_data(db_path: Optional[Path] = None, force_reseed: bool = False) -> None:
    """
    Popula o banco com os 3 produtos de referência e histórico realista de 15 dias:
    1. AMD Ryzen 5 5600 (Meta: R$ 800,00)
    2. AMD Ryzen 7 5700X3D (Meta: R$ 1.350,00)
    3. SSD Kingston NV2 1TB (Meta: R$ 350,00)
    """
    init_db(db_path=db_path)
    existing = get_all_products(db_path=db_path)
    if existing and not force_reseed:
        logger.info("Banco já contém produtos semeados. Pulando seed.")
        return

    now = datetime.now(timezone.utc)
    base_iso = (now - timedelta(days=15)).isoformat()

    # 1. Ryzen 5 5600
    p1_id = create_product(
        name="AMD Ryzen 5 5600",
        category="Processador",
        specs="32MB Cache L3, 6C/12T, AM4",
        target_price=800.0,
        created_at=base_iso,
        db_path=db_path,
    )
    p1_links = [
        (
            "Kabum",
            "https://www.kabum.com.br/produto/320797/processador-amd-ryzen-5-5600-3-5ghz-4-4ghz-max-turbo-cache-35mb-am4-sem-video-100-100000927box",
            849.90,
            -1.5,
        ),
        (
            "Terabyte",
            "https://www.terabyteshop.com.br/produto/20788/processador-amd-ryzen-5-5600-35ghz-44ghz-turbo-6-cores-12-threads-am4-sem-cooler-100-100000927box",
            839.00,
            -2.0,
        ),
        (
            "Pichau",
            "https://www.pichau.com.br/processador-amd-ryzen-5-5600-6-core-12-threads-3-5ghz-4-4ghz-turbo-cache-35mb-am4-100-100000927box",
            869.90,
            -1.0,
        ),
    ]

    # 2. Ryzen 7 5700X3D
    p2_id = create_product(
        name="AMD Ryzen 7 5700X3D",
        category="Processador",
        specs="AM4, 3D V-Cache 96MB L3, 8C/16T",
        target_price=1350.0,
        created_at=base_iso,
        db_path=db_path,
    )
    p2_links = [
        (
            "Kabum",
            "https://www.kabum.com.br/produto/520369/processador-amd-ryzen-7-5700x3d-3-0ghz-4-1ghz-max-turbo-cache-100mb-am4-sem-video-100-100001503wof",
            1459.90,
            -4.5,
        ),
        (
            "Terabyte",
            "https://www.terabyteshop.com.br/produto/27170/processador-amd-ryzen-7-5700x3d-30ghz-41ghz-turbo-8-cores-16-threads-am4-cooler-wraith-stealth",
            1429.00,
            -5.2,
        ),
        (
            "Amazon",
            "https://www.amazon.com.br/dp/B0CQ4H4H7X",
            1499.00,
            -3.0,
        ),
    ]

    # 3. SSD Kingston NV2 1TB
    p3_id = create_product(
        name="SSD Kingston NV2 1TB",
        category="SSD",
        specs="M.2 2280 NVMe, PCIe 4.0 x4, Leitura 3500MB/s, Gravacao 2100MB/s",
        target_price=350.0,
        created_at=base_iso,
        db_path=db_path,
    )
    p3_links = [
        (
            "Kabum",
            "https://www.kabum.com.br/produto/384959/ssd-1-tb-kingston-nv2-m-2-2280-pcie-nvme-leitura-3500mb-s-e-gravacao-2100mb-s-snv2s-1000g",
            389.90,
            -1.8,
        ),
        (
            "Amazon",
            "https://www.amazon.com.br/dp/B0BBWH1R8H",
            379.00,
            -2.2,
        ),
        (
            "Mercado Livre",
            "https://www.mercadolivre.com.br/disco-solido-interno-kingston-snv2s1000g-1tb-azul/p/MLB19827668",
            369.90,
            -1.5,
        ),
    ]

    catalog = [
        (p1_id, p1_links),
        (p2_id, p2_links),
        (p3_id, p3_links),
    ]

    for prod_id, links_info in catalog:
        for store_name, url, start_price, drift in links_info:
            link_id = create_store_link(
                product_id=prod_id,
                store_name=store_name,
                url=url,
                created_at=base_iso,
                db_path=db_path,
            )

            # Gera 15 dias de histórico prévio para gráficos perfeitos
            for day_offset in range(15, -1, -1):
                record_time = (now - timedelta(days=day_offset)).replace(
                    hour=9, minute=0, second=0, microsecond=0
                ).isoformat()
                
                # Curva orgânica com leve onda senoidal e drift
                wave = math.sin((15 - day_offset) * 0.5) * 12.0
                step = (15 - day_offset) * drift
                price_cash = round(start_price + step + wave, 2)
                if price_cash < 100:
                    price_cash = 100.0

                price_inst = round(price_cash * 1.12, 2)
                times = 10 if price_inst > 500 else 6
                inst_text = f"{times}x de R$ {price_inst/times:.2f}".replace(".", ",") + " sem juros"

                add_price_record(
                    store_link_id=link_id,
                    product_id=prod_id,
                    store_name=store_name,
                    price_cash=price_cash,
                    price_installment=price_inst,
                    installments_text=inst_text,
                    in_stock=1,
                    scraped_at=record_time,
                    db_path=db_path,
                )

    logger.info("Seed inicial executado com sucesso: 3 produtos, 9 links, 144 registros de histórico.")
