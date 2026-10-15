"""Scraper especializado para a Kabum."""
import json
import logging
import re
from typing import Optional
from bs4 import BeautifulSoup

from vigia.scrapers.base import BaseScraper, ScrapeResult

logger = logging.getLogger("vigia.scrapers.kabum")


class KabumScraper(BaseScraper):
    store_name: str = "Kabum"

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

        # Tentativa 1: Extração via __NEXT_DATA__ (Next.js JSON)
        next_data_el = soup.find("script", id="__NEXT_DATA__")
        if next_data_el and next_data_el.string:
            try:
                data = json.loads(next_data_el.string)
                props = data.get("props", {}).get("pageProps", {})
                prod_data = props.get("productData", {})
                if prod_data:
                    title = title or prod_data.get("name")
                    price_cash = prod_data.get("priceWithDiscount") or prod_data.get("price")
                    price_installment = prod_data.get("price") or prod_data.get("regularPrice")
                    in_stock = prod_data.get("available", True)
                    if price_cash:
                        price_cash = float(price_cash)
                    if price_installment:
                        price_installment = float(price_installment)
            except Exception as e:
                logger.debug(f"Erro ao ler __NEXT_DATA__ da Kabum: {e}")

        # Tentativa 2: Extração via seletores CSS específicos da Kabum
        if not price_cash:
            # Classes comuns da Kabum: finalPrice, regularPrice
            cash_el = (
                soup.find("h4", class_=re.compile(r"finalPrice", re.I))
                or soup.find("span", class_=re.compile(r"finalPrice", re.I))
                or soup.find(class_=re.compile(r"priceCard", re.I))
            )
            if cash_el:
                price_cash = self.parse_brl(cash_el.get_text())

            inst_el = (
                soup.find("span", class_=re.compile(r"regularPrice", re.I))
                or soup.find("b", class_=re.compile(r"regularPrice", re.I))
            )
            if inst_el:
                price_installment = self.parse_brl(inst_el.get_text())

        # Tentativa 3: Parsing de texto de parcelamento
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
            times = 10
            installments_text = f"{times}x de R$ {price_installment/times:.2f}".replace(".", ",")

        # Verificação de estoque
        if "indisponível" in html.lower() or "avise-me" in html.lower():
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
