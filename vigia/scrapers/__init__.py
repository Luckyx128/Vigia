"""Módulo de scrapers especializados para o Vigia."""
from vigia.scrapers.base import BaseScraper, ScrapeResult
from vigia.scrapers.dispatcher import get_scraper, scrape_url

__all__ = ["BaseScraper", "ScrapeResult", "get_scraper", "scrape_url"]
