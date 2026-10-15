"""Despachante e roteador de scrapers do Vigia."""
import logging
from typing import Optional

from vigia.scrapers.amazon import AmazonScraper
from vigia.scrapers.base import BaseScraper, ScrapeResult
from vigia.scrapers.kabum import KabumScraper
from vigia.scrapers.mercadolivre import MercadoLivreScraper
from vigia.scrapers.pichau import PichauScraper
from vigia.scrapers.terabyte import TerabyteScraper

logger = logging.getLogger("vigia.scrapers.dispatcher")


def get_scraper(store_name: Optional[str] = None, url: Optional[str] = None) -> BaseScraper:
    """Identifica e instancia o scraper adequado para a loja ou URL."""
    store_lower = (store_name or "").lower().strip()
    url_lower = (url or "").lower().strip()

    if "kabum" in store_lower or "kabum.com.br" in url_lower:
        return KabumScraper()

    if "terabyte" in store_lower or "terabyteshop.com.br" in url_lower:
        return TerabyteScraper()

    if "pichau" in store_lower or "pichau.com.br" in url_lower:
        return PichauScraper()

    if "amazon" in store_lower or "amazon.com" in url_lower or "amzn.to" in url_lower:
        return AmazonScraper()

    if (
        "mercado livre" in store_lower
        or "mercadolivre" in store_lower
        or "mercadolivre.com.br" in url_lower
        or "mercadolivre.com" in url_lower
    ):
        return MercadoLivreScraper()

    # Fallback genérico
    generic = BaseScraper()
    if store_name:
        generic.store_name = store_name
    return generic


def scrape_url(url: str, store_name: Optional[str] = None) -> ScrapeResult:
    """Executa a raspagem de um link específico utilizando o scraper apropriado."""
    scraper = get_scraper(store_name=store_name, url=url)
    return scraper.scrape(url)
