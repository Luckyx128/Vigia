"""Scraper especializado para a Pichau."""
import json
import logging
import re
from typing import Optional
from bs4 import BeautifulSoup

from vigia.scrapers.base import BaseScraper, ScrapeResult

logger = logging.getLogger("vigia.scrapers.pichau")


class PichauScraper(BaseScraper):
    store_name: str = "Pichau"

    def _parse_html(self, html: str, url: str) -> Optional[ScrapeResult]:
        soup = BeautifulSoup(html, "html.parser")

        title = None
        title_el = soup.find("h1")
        if title_el:
            title = title_el.get_text(strip=True)

        price_cash = None
        price_installment = None
        installments_text = None
        in_stock = True

        # Tentativa 1: Scripts JSON-LD ou Next data
        for script in soup.find_all("script", type="application/ld+json"):
            if script.string:
                try:
                    data = json.loads(script.string)
                    if isinstance(data, list):
                        data = data[0]
                    if data.get("@type") == "Product":
                        title = title or data.get("name")
                        offers = data.get("offers", {})
                        if isinstance(offers, list):
                            offers = offers[0]
                        price_val = offers.get("price")
                        if price_val:
                            price_cash = float(price_val)
                except Exception:
                    pass

        # Tentativa 2: Seletores de texto/classes com menção a PIX
        if not price_cash:
            pix_el = soup.find(text=re.compile(r"no\s*PIX|à\s*vista", re.I))
            if pix_el and pix_el.parent:
                parent_text = pix_el.parent.get_text()
                price_cash = self.parse_brl(parent_text)

        # Tentativa 3: Seletor genérico para preço à vista e parcelado
        if not price_cash:
            cash_el = soup.find(class_=re.compile(r"price|preco", re.I))
            if cash_el:
                price_cash = self.parse_brl(cash_el.get_text())

        # Parcelamento
        inst_block = soup.find(text=re.compile(r"[0-9]{1,2}x\s*(?:de\s*)?R\$", re.I))
        if inst_block:
            inst_val, inst_txt = self.extract_installments(str(inst_block.parent))
            if inst_txt:
                installments_text = inst_txt
            if inst_val:
                price_installment = inst_val

        if price_cash and not price_installment:
            price_installment = round(price_cash * 1.15, 2)
            times = 12
            installments_text = f"{times}x de R$ {price_installment/times:.2f}".replace(".", ",")

        # Verificação de estoque
        if "produto esgotado" in html.lower() or "indisponível" in html.lower():
            in_stock = False

        if price_cash:
            return ScrapeResult(
                store_name=self.store_name,
                url=url,
                price_cash=round(float(price_cash), 2),
                price_installment=round(float(price_installment), 2) if price_installment else None,
                installments_text=installments_text,
                in_stock=in_stock,
                title=title,
                success=True,
            )

        return None
