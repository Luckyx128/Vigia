"""Gerenciamento do banco de dados SQLite para o Vigia."""
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

from vigia.config import DB_PATH


def get_current_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


@contextmanager
def get_db(db_path: Optional[Path] = None) -> Generator[sqlite3.Connection, None, None]:
    """Retorna uma conexão SQLite com row_factory ativado e foreign keys habilitadas."""
    path = db_path or DB_PATH
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db(db_path: Optional[Path] = None) -> None:
    """Cria as tabelas do banco de dados caso não existam."""
    with get_db(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT,
                specs TEXT,
                target_price REAL,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS store_links (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                store_name TEXT NOT NULL,
                url TEXT NOT NULL,
                is_active INTEGER DEFAULT 1,
                created_at TEXT NOT NULL,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS price_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                store_link_id INTEGER NOT NULL,
                product_id INTEGER NOT NULL,
                store_name TEXT NOT NULL,
                price_cash REAL,
                price_installment REAL,
                installments_text TEXT,
                in_stock INTEGER DEFAULT 1,
                scraped_at TEXT NOT NULL,
                FOREIGN KEY (store_link_id) REFERENCES store_links (id) ON DELETE CASCADE,
                FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_store_links_product_id ON store_links(product_id);
            CREATE INDEX IF NOT EXISTS idx_price_records_product_id ON price_records(product_id);
            CREATE INDEX IF NOT EXISTS idx_price_records_store_link_id ON price_records(store_link_id);
            CREATE INDEX IF NOT EXISTS idx_price_records_scraped_at ON price_records(scraped_at);
            """
        )


# --- Funções CRUD de Produtos ---

def create_product(
    name: str,
    category: Optional[str] = None,
    specs: Optional[str] = None,
    target_price: Optional[float] = None,
    created_at: Optional[str] = None,
    db_path: Optional[Path] = None,
) -> int:
    created = created_at or get_current_iso()
    with get_db(db_path) as conn:
        cur = conn.execute(
            """
            INSERT INTO products (name, category, specs, target_price, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, category, specs, target_price, created),
        )
        return cur.lastrowid


def get_product(product_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    with get_db(db_path) as conn:
        row = conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        return dict(row) if row else None


def get_all_products(db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    with get_db(db_path) as conn:
        rows = conn.execute("SELECT * FROM products ORDER BY id ASC").fetchall()
        return [dict(r) for r in rows]


def delete_product(product_id: int, db_path: Optional[Path] = None) -> bool:
    with get_db(db_path) as conn:
        # Cascade manually as safety in addition to foreign keys
        conn.execute("DELETE FROM price_records WHERE product_id = ?", (product_id,))
        conn.execute("DELETE FROM store_links WHERE product_id = ?", (product_id,))
        cur = conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
        return cur.rowcount > 0


# --- Funções CRUD de Links de Lojas ---

def create_store_link(
    product_id: int,
    store_name: str,
    url: str,
    is_active: int = 1,
    created_at: Optional[str] = None,
    db_path: Optional[Path] = None,
) -> int:
    created = created_at or get_current_iso()
    with get_db(db_path) as conn:
        cur = conn.execute(
            """
            INSERT INTO store_links (product_id, store_name, url, is_active, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (product_id, store_name, url, is_active, created),
        )
        return cur.lastrowid


def get_link_by_id(link_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    with get_db(db_path) as conn:
        row = conn.execute("SELECT * FROM store_links WHERE id = ?", (link_id,)).fetchone()
        return dict(row) if row else None


def get_links_by_product(product_id: int, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    with get_db(db_path) as conn:
        rows = conn.execute(
            "SELECT * FROM store_links WHERE product_id = ? ORDER BY id ASC",
            (product_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_all_active_links(db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    with get_db(db_path) as conn:
        rows = conn.execute(
            "SELECT * FROM store_links WHERE is_active = 1 ORDER BY product_id, id ASC"
        ).fetchall()
        return [dict(r) for r in rows]


def delete_store_link(link_id: int, db_path: Optional[Path] = None) -> bool:
    with get_db(db_path) as conn:
        conn.execute("DELETE FROM price_records WHERE store_link_id = ?", (link_id,))
        cur = conn.execute("DELETE FROM store_links WHERE id = ?", (link_id,))
        return cur.rowcount > 0


# --- Funções CRUD de Registros de Preços ---

def add_price_record(
    store_link_id: int,
    product_id: int,
    store_name: str,
    price_cash: Optional[float],
    price_installment: Optional[float],
    installments_text: Optional[str],
    in_stock: int = 1,
    scraped_at: Optional[str] = None,
    db_path: Optional[Path] = None,
) -> int:
    scraped = scraped_at or get_current_iso()
    with get_db(db_path) as conn:
        cur = conn.execute(
            """
            INSERT INTO price_records (
                store_link_id, product_id, store_name, price_cash,
                price_installment, installments_text, in_stock, scraped_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                store_link_id,
                product_id,
                store_name,
                price_cash,
                price_installment,
                installments_text,
                in_stock,
                scraped,
            ),
        )
        return cur.lastrowid


def get_latest_price_for_link(store_link_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    with get_db(db_path) as conn:
        row = conn.execute(
            """
            SELECT * FROM price_records
            WHERE store_link_id = ?
            ORDER BY scraped_at DESC, id DESC
            LIMIT 1
            """,
            (store_link_id,),
        ).fetchone()
        return dict(row) if row else None


def get_latest_prices_by_product(product_id: int, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retorna o registro mais recente de cada link do produto."""
    with get_db(db_path) as conn:
        rows = conn.execute(
            """
            SELECT pr.* FROM price_records pr
            INNER JOIN (
                SELECT store_link_id, MAX(scraped_at) as max_scraped
                FROM price_records
                WHERE product_id = ?
                GROUP BY store_link_id
            ) latest ON pr.store_link_id = latest.store_link_id AND pr.scraped_at = latest.max_scraped
            WHERE pr.product_id = ?
            ORDER BY pr.price_cash ASC
            """,
            (product_id, product_id),
        ).fetchall()
        return [dict(r) for r in rows]


def get_price_history_for_product(product_id: int, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Retorna o histórico cronológico de preços para o produto."""
    with get_db(db_path) as conn:
        rows = conn.execute(
            """
            SELECT id, scraped_at, store_name, price_cash, price_installment, in_stock
            FROM price_records
            WHERE product_id = ?
            ORDER BY scraped_at ASC, id ASC
            """,
            (product_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def get_all_time_low(product_id: int, db_path: Optional[Path] = None) -> Optional[Dict[str, Any]]:
    """Retorna o menor preço à vista registrado e a loja correspondente."""
    with get_db(db_path) as conn:
        row = conn.execute(
            """
            SELECT price_cash, store_name, scraped_at
            FROM price_records
            WHERE product_id = ? AND price_cash IS NOT NULL AND price_cash > 0 AND in_stock = 1
            ORDER BY price_cash ASC, scraped_at ASC
            LIMIT 1
            """,
            (product_id,),
        ).fetchone()
        return dict(row) if row else None


def get_30d_avg(product_id: int, db_path: Optional[Path] = None) -> Optional[float]:
    """Calcula a média do preço à vista nos últimos 30 dias (ou de todo o histórico disponível)."""
    with get_db(db_path) as conn:
        row = conn.execute(
            """
            SELECT AVG(price_cash) as avg_price
            FROM price_records
            WHERE product_id = ? AND price_cash IS NOT NULL AND price_cash > 0 AND in_stock = 1
            """,
            (product_id,),
        ).fetchone()
        if row and row["avg_price"] is not None:
            return round(float(row["avg_price"]), 2)
        return None


def delete_price_record(record_id: int, db_path: Optional[Path] = None) -> bool:
    """Remove um registro específico de preço pelo ID."""
    with get_db(db_path) as conn:
        cur = conn.execute("DELETE FROM price_records WHERE id = ?", (record_id,))
        return cur.rowcount > 0


def clear_product_history(product_id: int, db_path: Optional[Path] = None) -> int:
    """Remove todo o histórico de preços de um produto."""
    with get_db(db_path) as conn:
        cur = conn.execute("DELETE FROM price_records WHERE product_id = ?", (product_id,))
        return cur.rowcount
