"""Scraper especializado para a Pichau com suporte a GraphQL hydration data e Schema.org."""
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
        price_cash = None
        price_installment = None
        installments_text = None
        in_stock = True

        # ==========================================
        # 1. Extração via dados internos da Pichau (pichau_prices)
        # ==========================================
        try:
            avista_m = re.search(r'pichau_prices.*?avista[^\d]*([0-9]+\.[0-9]+)', html)
            final_m = re.search(r'pichau_prices.*?final_price[^\d]*([0-9]+\.[0-9]+)', html)
            max_inst_m = re.search(r'pichau_prices.*?max_installments[^\d]*([0-9]+)', html)
            min_inst_m = re.search(r'pichau_prices.*?min_installment_price[^\d]*([0-9]+\.[0-9]+)', html)

            if avista_m:
                price_cash = float(avista_m.group(1))
            if final_m:
                price_installment = float(final_m.group(1))
            if max_inst_m and min_inst_m:
                t = int(max_inst_m.group(1))
                val = float(min_inst_m.group(1))
                installments_text = f"{t}x de R$ {val:,.2f} sem juros".replace(",", "X").replace(".", ",").replace("X", ".")
        except Exception as e:
            logger.debug(f"Erro ao ler regex pichau_prices: {e}")

        # ==========================================
        # 2. Scripts JSON-LD (Schema.org)
        # ==========================================
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
                        if not price_cash and price_val:
                            price_cash = self.parse_brl(str(price_val))
                        avail = offers.get("availability", "")
                        if "OutOfStock" in avail:
                            in_stock = False
                        elif "InStock" in avail:
                            in_stock = True
                except Exception as e:
                    pass

        # ==========================================
        # 3. Título e Seletores de Texto
        # ==========================================
        if not title:
            title_el = soup.find("h1")
            if title_el:
                title = title_el.get_text(strip=True)

        if not price_cash:
            pix_el = soup.find(string=re.compile(r"no\s*PIX|à\s*vista", re.I))
            if pix_el and pix_el.parent:
                parent_text = pix_el.parent.get_text()
                price_cash = self.parse_brl(parent_text)

        # Seletor genérico para preço à vista e parcelado
        if not price_cash:
            cash_el = soup.find(class_=re.compile(r"price|preco", re.I))
            if cash_el:
                price_cash = self.parse_brl(cash_el.get_text())

        # Parcelamento
        if not installments_text:
            inst_block = soup.find(string=re.compile(r"[0-9]{1,2}x\s*(?:de\s*)?R\$", re.I))
            if inst_block:
                inst_val, inst_txt = self.extract_installments(str(inst_block.parent))
                if inst_txt:
                    installments_text = inst_txt
                if not price_installment and inst_val:
                    price_installment = inst_val

        if price_cash and not price_installment:
            price_installment = round(price_cash * 1.15, 2)
        if price_installment and not installments_text:
            times = 12
            installments_text = f"{times}x de R$ {price_installment/times:.2f} sem juros".replace(".", ",")

        # Verificação textual de estoque
        if "produto esgotado" in html.lower() or "indisponível" in html.lower() or "avise-me" in html.lower() or "avise me" in html.lower() or "OutOfStock" in html:
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
