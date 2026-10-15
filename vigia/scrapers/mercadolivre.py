"""Scraper especializado para o Mercado Livre Brasil."""
import json
import logging
import re
from typing import Optional
from bs4 import BeautifulSoup

from vigia.scrapers.base import BaseScraper, ScrapeResult

logger = logging.getLogger("vigia.scrapers.mercadolivre")


class MercadoLivreScraper(BaseScraper):
    store_name: str = "Mercado Livre"

    def _parse_html(self, html: str, url: str) -> Optional[ScrapeResult]:
        soup = BeautifulSoup(html, "html.parser")

        title = None
        title_el = (
            soup.find("h1", class_=re.compile(r"ui-pdp-title", re.I))
            or soup.find("h1")
        )
        if title_el:
            title = title_el.get_text(strip=True)

        price_cash = None
        price_installment = None
        installments_text = None
        in_stock = True

        # Tentativa 1: Schema JSON-LD
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

        # Tentativa 2: Seletores do PDP do Mercado Livre
        # .ui-pdp-price__second-line .andes-money-amount__fraction
        if not price_cash:
            price_container = soup.find(class_=re.compile(r"ui-pdp-price__second-line|price-tag", re.I))
            if price_container:
                fraction = price_container.find(class_=re.compile(r"andes-money-amount__fraction|price-tag-fraction", re.I))
                cents = price_container.find(class_=re.compile(r"andes-money-amount__cents|price-tag-cents", re.I))
                if fraction:
                    val_str = fraction.get_text().replace(".", "")
                    if cents:
                        val_str += f".{cents.get_text()}"
                    try:
                        price_cash = float(val_str)
                    except ValueError:
                        pass

        # Tentativa 3: Seletor genérico caso a estrutura mude
        if not price_cash:
            andes_el = soup.find(class_=re.compile(r"andes-money-amount", re.I))
            if andes_el:
                price_cash = self.parse_brl(andes_el.get_text())

        # Parcelamento no Mercado Livre
        inst_el = soup.find(class_=re.compile(r"ui-pdp-price__subtitles|installments", re.I))
        if inst_el:
            inst_val, inst_txt = self.extract_installments(inst_el.get_text())
            if inst_txt:
                installments_text = inst_txt
            if inst_val:
                price_installment = inst_val

        if price_cash and not price_installment:
            price_installment = price_cash
            times = 10 if price_cash > 300 else 6
            installments_text = f"{times}x de R$ {price_cash/times:.2f}".replace(".", ",") + " sem juros"

        # Estoque
        if "último disponível" in html.lower():
            in_stock = True
        elif "estoque esgotado" in html.lower() or "anúncio pausado" in html.lower():
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
