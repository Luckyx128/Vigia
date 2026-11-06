"""Busca de links nas lojas e nota de semelhança com o que o usuário pediu."""
import re
import unicodedata
from dataclasses import asdict
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from vigia.database import get_links_by_product
from vigia.scrapers.dispatcher import get_scraper

MAX_RESULTS = 20

STOPWORDS = {"de", "da", "do", "das", "dos", "e", "com", "para", "em", "a", "o"}

# Sufixos que mudam o modelo (RX 7600 x RX 7600 XT, Ryzen 5600 x 5600X3D...)
VARIANT_TOKENS = {"xt", "xtx", "ti", "super", "x3d", "gre"}

# Anúncios que trazem o produto dentro de outra coisa
BUNDLE_PHRASES = {
    "pc gamer": "PC completo",
    "computador": "PC completo",
    "notebook": "Notebook",
    "kit": "Kit",
    "combo": "Combo",
}

# A Kabum redireciona certas palavras para uma categoria e descarta o resto
# do termo ("amd ryzen 7 5700x3d" vira a categoria de placas de vídeo AMD).
# Se a primeira busca não achar nada parecido, tentamos de novo sem elas.
GENERIC_WORDS = {"amd", "intel", "nvidia", "processador", "placa", "video", "de"}

# Nota a partir da qual consideramos que achamos o produto
GOOD_MATCH = 70

UNIT_JOIN = re.compile(r"\b(\d+)\s+(gb|tb|mb|ghz|mhz|hz|w)\b")


class UnsupportedStoreError(Exception):
    pass


def normalize(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"[^a-z0-9]+", " ", text.lower())
    return UNIT_JOIN.sub(r"\1\2", text).strip()


def tokenize(text: str) -> List[str]:
    return [t for t in normalize(text).split() if t not in STOPWORDS]


def score_candidate(query: str, title: str) -> Tuple[int, List[str]]:
    """Nota de 0 a 100 e lista de diferenças relevantes entre o título e a busca.

    Números (modelo, capacidade) pesam 3x mais que palavras, porque são eles
    que separam um Ryzen 5 5600 de um 5500.
    """
    query_tokens = tokenize(query)
    if not query_tokens:
        return 0, []
    title_norm = normalize(title)
    title_tokens = set(title_norm.split())
    query_set = set(query_tokens)

    def weight(tok: str) -> int:
        return 3 if any(c.isdigit() for c in tok) else 1

    total = sum(weight(t) for t in query_tokens)
    matched = sum(weight(t) for t in query_tokens if t in title_tokens)
    score = 100 * matched / total

    differences: List[str] = []
    for tok in sorted(VARIANT_TOKENS & title_tokens - query_set):
        differences.append(tok.upper())
    # "5600" pedido, mas o título só tem "5600x"/"5600g"
    for q in query_set:
        if any(c.isdigit() for c in q) and q not in title_tokens:
            for t in sorted(title_tokens):
                if t != q and t.startswith(q) and len(t) - len(q) <= 3:
                    differences.append(t.upper())
    query_norm = " ".join(query_tokens)
    for phrase, label in BUNDLE_PHRASES.items():
        if re.search(rf"\b{phrase}\b", title_norm) and phrase not in query_norm and label not in differences:
            differences.append(label)
    # "Processador X + Placa Mãe Y"
    if re.search(r"\s\+\s", title) and "Combo" not in differences:
        differences.append("Combo")

    score -= 25 * len(differences)
    return max(0, min(100, round(score))), differences


def link_key(url: str) -> str:
    """Identidade de um anúncio, para saber se já está sendo monitorado."""
    m = re.search(r"kabum\.com\.br/produto/(\d+)", url)
    if m:
        return f"kabum:{m.group(1)}"
    return url.split("#")[0].split("?")[0].rstrip("/").lower()


def search_store_links(
    store: str,
    query: str,
    product_id: Optional[int] = None,
    db_path: Optional[Path] = None,
) -> List[Dict[str, Any]]:
    scraper = get_scraper(store_name=store)
    if not scraper.supports_search:
        raise UnsupportedStoreError(f"Busca automática ainda não disponível para {store}")

    candidates = scraper.search(query)
    best = max((score_candidate(query, c.title)[0] for c in candidates), default=0)
    simplified = " ".join(t for t in query.split() if normalize(t) not in GENERIC_WORDS)
    if best < GOOD_MATCH and simplified and normalize(simplified) != normalize(query):
        seen = {c.url for c in candidates}
        candidates += [c for c in scraper.search(simplified) if c.url not in seen]

    existing: Set[str] = set()
    if product_id is not None:
        existing = {link_key(l["url"]) for l in get_links_by_product(product_id, db_path=db_path)}

    results = []
    for position, cand in enumerate(candidates):
        score, differences = score_candidate(query, cand.title)
        item = asdict(cand)
        item.update(
            score=score,
            differences=differences,
            already_added=link_key(cand.url) in existing,
            _position=position,
        )
        results.append(item)

    # Mais parecido primeiro; em empate, disponível antes de esgotado e a ordem da loja
    results.sort(key=lambda r: (-r["score"], not r["in_stock"], r["_position"]))
    for r in results:
        del r["_position"]
    return results[:MAX_RESULTS]
