"""Scraper especializado para a TerabyteShop."""
import logging
import re
from typing import Optional
from bs4 import BeautifulSoup

from vigia.scrapers.base import BaseScraper, ScrapeResult

logger = logging.getLogger("vigia.scrapers.terabyte")


class TerabyteScraper(BaseScraper):
    store_name: str = "Terabyte"

    def _parse_html(self, html: str, url: str) -> Optional[ScrapeResult]:
        soup = BeautifulSoup(html, "html.parser")

        title = None
        title_el = (
            soup.find("h1", class_=re.compile(r"tit-prod", re.I))
            or soup.find("h1")
        )
        if title_el:
            title = title_el.get_text(strip=True)

        price_cash = None
        price_installment = None
        installments_text = None
        in_stock = True

        # Preço à vista (PIX / Boleto) - IDs/Classes típicos da Terabyte
        cash_el = (
            soup.find(id="valFinal")
            or soup.find(class_=re.compile(r"val-prod", re.I))
            or soup.find(class_=re.compile(r"p-price", re.I))
            or soup.find(class_=re.compile(r"highlight", re.I))
        )
        if cash_el:
            price_cash = self.parse_brl(cash_el.get_text())

        # Preço a prazo
        inst_el = (
            soup.find(id="valParc")
            or soup.find(class_=re.compile(r"val-parc", re.I))
            or soup.find(class_=re.compile(r"p-parc", re.I))
        )
        if inst_el:
            price_installment = self.parse_brl(inst_el.get_text())

        # Texto do parcelamento (ex: '12x de R$ ...')
        inst_block = soup.find(text=re.compile(r"[0-9]{1,2}x\s*(?:de\s*)?R\$", re.I))
        if inst_block:
            inst_val, inst_txt = self.extract_installments(str(inst_block.parent))
            if inst_txt:
                installments_text = inst_txt
            if not price_installment and inst_val:
                price_installment = inst_val

        # Se não encontrou installment mas tem cash
        if price_cash and not price_installment:
            price_installment = round(price_cash * 1.15, 2)
            times = 12
            installments_text = f"{times}x de R$ {price_installment/times:.2f}".replace(".", ",")

        # Verificação de estoque
        if "produto indisponível" in html.lower() or "avise-me quando chegar" in html.lower():
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
