"""Scraper especializado para a Amazon Brasil."""
import logging
import re
from typing import Optional
from bs4 import BeautifulSoup

from vigia.scrapers.base import BaseScraper, ScrapeResult

logger = logging.getLogger("vigia.scrapers.amazon")


class AmazonScraper(BaseScraper):
    store_name: str = "Amazon"

    def _parse_html(self, html: str, url: str) -> Optional[ScrapeResult]:
        soup = BeautifulSoup(html, "html.parser")

        title = None
        title_el = soup.find(id="productTitle")
        if title_el:
            title = title_el.get_text(strip=True)

        price_cash = None
        price_installment = None
        installments_text = None
        in_stock = True

        # Preço principal na Amazon
        # Classe .a-price .a-offscreen é o padrão moderno da Amazon
        price_offscreen = soup.find("span", class_="a-price")
        if price_offscreen:
            offscreen_el = price_offscreen.find("span", class_="a-offscreen")
            if offscreen_el:
                price_cash = self.parse_brl(offscreen_el.get_text())

        if not price_cash:
            # Seletores alternativos
            alt_el = (
                soup.find(id="priceblock_ourprice")
                or soup.find(id="priceblock_dealprice")
                or soup.find(class_="a-price-whole")
            )
            if alt_el:
                price_cash = self.parse_brl(alt_el.get_text())

        # Parcelamento na Amazon (geralmente sem juros no cartão em até 10x)
        inst_el = soup.find(id=re.compile(r"installment|payment", re.I)) or soup.find(
            text=re.compile(r"[0-9]{1,2}x\s*(?:de\s*)?R\$", re.I)
        )
        if inst_el:
            parent_text = inst_el.parent.get_text() if hasattr(inst_el, "parent") else str(inst_el)
            inst_val, inst_txt = self.extract_installments(parent_text)
            if inst_txt:
                installments_text = inst_txt
            if inst_val:
                price_installment = inst_val

        # Na Amazon, se não há desconto adicional de PIX, o preço à vista e parcelado sem juros pode ser igual
        if price_cash and not price_installment:
            price_installment = price_cash
            times = 10 if price_cash > 300 else 5
            installments_text = f"{times}x de R$ {price_cash/times:.2f}".replace(".", ",") + " sem juros"

        # Estoque
        avail_el = soup.find(id="availability")
        if avail_el and ("não temos previsão" in avail_el.get_text().lower() or "indisponível" in avail_el.get_text().lower()):
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
