"""Scraper especializado para a Kabum com suporte a Next.js __NEXT_DATA__, Schema.org e seletores HTML."""
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
        price_cash = None
        price_installment = None
        installments_text = None
        in_stock = True

        # ==========================================
        # 1. Extração via __NEXT_DATA__ (Next.js JSON)
        # ==========================================
        next_data_el = soup.find("script", id="__NEXT_DATA__")
        if next_data_el and next_data_el.string:
            try:
                data = json.loads(next_data_el.string)
                props = data.get("props", {}).get("pageProps", {})
                prod = props.get("product") or props.get("productData") or {}

                if prod:
                    title = prod.get("title") or prod.get("name") or prod.get("friendlyName")
                    in_stock = prod.get("available", True)

                    # Objeto de preços moderno da Kabum
                    prices_obj = prod.get("prices") or {}
                    if prices_obj:
                        price_cash = (
                            prices_obj.get("priceWithDiscount")
                            or prices_obj.get("price")
                        )
                        price_installment = (
                            prices_obj.get("price")
                            or prices_obj.get("oldPrice")
                        )
                    
                    # Fallback dentro do próprio prod
                    if not price_cash:
                        price_cash = prod.get("priceWithDiscount") or prod.get("price")
                    if not price_installment:
                        price_installment = prod.get("price") or prod.get("regularPrice") or prod.get("oldPrice")

                    # Informação de parcelamento
                    inst_obj = prod.get("installment") or {}
                    if isinstance(inst_obj, dict):
                        times = inst_obj.get("installment")
                        amount = inst_obj.get("amount")
                        has_fee = inst_obj.get("hasFee", False)
                        if times and amount:
                            fee_text = "com juros" if has_fee else "sem juros"
                            installments_text = f"{times}x de R$ {amount:,.2f} {fee_text}".replace(",", "X").replace(".", ",").replace("X", ".")
                            if not price_installment:
                                price_installment = round(times * amount, 2)

                    if price_cash:
                        price_cash = float(price_cash)
                    if price_installment:
                        price_installment = float(price_installment)

            except Exception as e:
                logger.debug(f"Erro ao ler __NEXT_DATA__ da Kabum: {e}")

        # ==========================================
        # 2. Extração via Schema.org JSON-LD (Product)
        # ==========================================
        if not price_cash:
            for script in soup.find_all("script", type="application/ld+json"):
                if script.string:
                    try:
                        sd = json.loads(script.string)
                        if isinstance(sd, list):
                            sd = sd[0]
                        if sd.get("@type") == "Product":
                            title = title or sd.get("name")
                            offers = sd.get("offers", {})
                            if isinstance(offers, list):
                                offers = offers[0]
                            if offers:
                                p_val = offers.get("price")
                                if p_val:
                                    price_cash = float(p_val)
                                avail = offers.get("availability", "")
                                if "OutOfStock" in avail:
                                    in_stock = False
                                elif "InStock" in avail:
                                    in_stock = True
                    except Exception as e:
                        logger.debug(f"Erro ao ler ld+json da Kabum: {e}")

        # ==========================================
        # 3. Extração via seletores CSS específicos da Kabum
        # ==========================================
        if not title:
            title_el = soup.find("h1")
            if title_el:
                title = title_el.get_text(strip=True)

        if not price_cash:
            cash_el = (
                soup.find("h4", class_=re.compile(r"finalPrice", re.I))
                or soup.find("span", class_=re.compile(r"finalPrice", re.I))
                or soup.find(class_=re.compile(r"priceCard", re.I))
                or soup.find(text=re.compile(r"à\s*vista\s*no\s*pix", re.I))
            )
            if cash_el:
                parent_text = cash_el.parent.get_text() if hasattr(cash_el, "parent") else str(cash_el)
                price_cash = self.parse_brl(parent_text)

        if not price_installment:
            inst_el = (
                soup.find("span", class_=re.compile(r"regularPrice", re.I))
                or soup.find("b", class_=re.compile(r"regularPrice", re.I))
                or soup.find(class_=re.compile(r"oldPrice", re.I))
            )
            if inst_el:
                price_installment = self.parse_brl(inst_el.get_text())

        # ==========================================
        # 4. Parsing de texto de parcelamento no HTML
        # ==========================================
        if not installments_text:
            inst_block = soup.find(string=re.compile(r"[0-9]{1,2}x\s*(?:de\s*)?R\$", re.I))
            if inst_block:
                inst_val, inst_txt = self.extract_installments(str(inst_block.parent))
                if inst_txt:
                    installments_text = inst_txt
                if not price_installment and inst_val:
                    price_installment = inst_val

        # Se temos cash mas não installment, estima padrão de 10x
        if price_cash and not price_installment:
            price_installment = round(price_cash * 1.15, 2)
        if price_installment and not installments_text:
            times = 10
            installments_text = f"{times}x de R$ {price_installment/times:.2f} sem juros".replace(".", ",")

        # Verificação textual de estoque
        if "indisponível" in html.lower() or "avise-me quando chegar" in html.lower():
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
