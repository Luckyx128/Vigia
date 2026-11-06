"""Script principal de inicialização, gerenciamento e testes do Vigia."""
import argparse
import os
import sys
from pathlib import Path

# Configura encoding de saída para compatibilidade com terminais Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_tests():
    """Executa a suíte de testes de integração e validação de contratos do Vigia."""
    print("=" * 60)
    print("Iniciando bateria de testes do Vigia...")
    print("=" * 60)

    import tempfile
    from fastapi.testclient import TestClient
    from vigia.api import app
    from vigia.database import (
        add_price_record,
        create_product,
        create_store_link,
        delete_product,
        delete_store_link,
        get_all_products,
        get_latest_prices_by_product,
        get_price_history_for_product,
        get_product,
        init_db,
    )
    from vigia.notifier import notify_notch
    from vigia.scrapers.base import BaseScraper
    from vigia.scrapers.dispatcher import get_scraper, scrape_url
    from vigia.service import (
        calculate_stats_for_product,
        get_overview_stats,
        scrape_all_products,
        scrape_single_product,
        seed_initial_data,
    )

    # 1. Teste de Parsing de Moeda BRL e Parcelamento
    print("\n[1/7] Testando utilitários do BaseScraper (BRL e Parcelas)...")
    assert BaseScraper.parse_brl("R$ 1.234,56") == 1234.56, "Falha no parse R$ 1.234,56"
    assert BaseScraper.parse_brl("R$\xa0829,99") == 829.99, "Falha no parse com non-breaking space"
    assert BaseScraper.parse_brl("1.349,00") == 1349.00, "Falha no parse 1.349,00"
    assert BaseScraper.parse_brl("R$ 350") == 350.0, "Falha no parse R$ 350"
    assert BaseScraper.parse_brl("899.90") == 899.90, "Falha no parse 899.90"
    assert BaseScraper.parse_brl(None) is None, "Falha no parse None"

    tot, txt = BaseScraper.extract_installments("10x de R$ 94,99 sem juros")
    assert tot == 949.90, f"Total parcelas esperado 949.90, obteve {tot}"
    assert "10x de R$ 94,99" in txt, f"Texto parcelas incorreto: {txt}"
    print("  [OK] Parse de BRL e parcelamento validado com sucesso!")

    # 2. Teste do Despachante e Scrapers Especializados com Fallback Resiliente
    print("\n[2/7] Testando despachante de scrapers para as 5 lojas...")
    stores_to_test = [
        ("Kabum", "https://www.kabum.com.br/produto/320797/ryzen-5-5600"),
        ("Terabyte", "https://www.terabyteshop.com.br/produto/20788/ryzen-5-5600"),
        ("Pichau", "https://www.pichau.com.br/processador-amd-ryzen-5-5600"),
        ("Amazon", "https://www.amazon.com.br/dp/B0BBWH1R8H"),
        ("Mercado Livre", "https://www.mercadolivre.com.br/disco-solido-kingston-1tb"),
    ]

    for store_name, test_url in stores_to_test:
        scraper = get_scraper(store_name=store_name, url=test_url)
        assert scraper.store_name == store_name, f"Scraper incorreto para {store_name}: {scraper.store_name}"
        res = scraper.resilient_fallback(test_url)
        assert res.success is True, f"Fallback falhou para {store_name}"
        assert res.price_cash and res.price_cash > 0, f"Preço inválido para {store_name}: {res.price_cash}"
        assert res.price_installment and res.price_installment >= res.price_cash, (
            f"Preço parcelado menor que à vista para {store_name}"
        )
        print(f"  [OK] {store_name}: R$ {res.price_cash:.2f} (PIX) / R$ {res.price_installment:.2f} ({res.installments_text})")

    # 3. Teste do Banco de Dados SQLite em arquivo temporário
    print("\n[3/7] Testando Banco de Dados SQLite e CRUD...")
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        test_db_path = Path(tmp.name)

    try:
        init_db(test_db_path)
        p_id = create_product(
            name="Produto Teste",
            category="Hardware",
            specs="Spec teste",
            target_price=500.0,
            db_path=test_db_path,
        )
        assert p_id > 0, "Falha na criação do produto"
        prod = get_product(p_id, db_path=test_db_path)
        assert prod["name"] == "Produto Teste", "Nome do produto incorreto"

        link_id = create_store_link(
            product_id=p_id,
            store_name="Kabum",
            url="https://www.kabum.com.br/teste",
            db_path=test_db_path,
        )
        assert link_id > 0, "Falha na criação do link"

        rec_id = add_price_record(
            store_link_id=link_id,
            product_id=p_id,
            store_name="Kabum",
            price_cash=480.00,
            price_installment=530.00,
            installments_text="10x de R$ 53,00",
            in_stock=1,
            db_path=test_db_path,
        )
        assert rec_id > 0, "Falha ao gravar preço"

        latest = get_latest_prices_by_product(p_id, db_path=test_db_path)
        assert len(latest) == 1 and latest[0]["price_cash"] == 480.00

        history = get_price_history_for_product(p_id, db_path=test_db_path)
        assert len(history) == 1

        stats = calculate_stats_for_product(prod, db_path=test_db_path)
        assert stats["lowest_price_now"] == 480.00
        assert stats["all_time_low"] == 480.00
        assert stats["is_real_discount"] is True  # bateu target_price de 500

        # Teste de delete
        assert delete_store_link(link_id, db_path=test_db_path) is True
        assert delete_product(p_id, db_path=test_db_path) is True
        print("  [OK] Inicialização, inserção, consulta, estatísticas e remoção validados!")
    finally:
        if test_db_path.exists():
            test_db_path.unlink()

    # 4. Teste do Seed de Dados e Banco Oficial
    print("\n[4/7] Validando Seed inicial no banco isolado de teste...")
    test_seed_db = Path(tempfile.gettempdir()) / "test_seed_vigia.db"
    if test_seed_db.exists():
        test_seed_db.unlink()
    try:
        init_db(test_seed_db)
        seed_initial_data(db_path=test_seed_db)
        products = get_all_products(db_path=test_seed_db)
        assert len(products) >= 3, f"Esperado pelo menos 3 produtos semeados, encontrado: {len(products)}"
        overview = get_overview_stats(db_path=test_seed_db)
        assert overview["total_products"] >= 3, "Overview não contém os produtos"
        assert overview["total_records"] >= 45, f"Histórico insuficiente: {overview['total_records']} registros"
        print(f"  [OK] Banco de teste semeado: {overview['total_products']} produtos, {overview['total_links']} links, {overview['total_records']} registros de preços.")
    finally:
        if test_seed_db.exists():
            test_seed_db.unlink()

    # 5. Teste de Notificação na Notch do Cortinho
    print("\n[5/7] Testando notificação na Notch local (http://127.0.0.1:48123/notify/)...")
    sent = notify_notch("Vigia: Teste de integração do Harvester executado com sucesso!", kind="success")
    if sent:
        print("  [OK] Notificação enviada e confirmada pelo servidor local da Notch (HTTP 200 OK)!")
    else:
        print("  [AVISO] Servidor Notch não respondeu no momento (verifique se está ativo na porta 48123).")

    # 6. Teste da API FastAPI e Endpoints do Contrato
    print("\n[6/7] Testando Endpoints FastAPI contra contracts.md...")
    with TestClient(app) as client:
        # GET /api/products
        res = client.get("/api/products")
        assert res.status_code == 200, f"GET /api/products falhou: {res.status_code}"
        prods_data = res.json()
        assert isinstance(prods_data, list), "Resposta deve ser uma lista"
        if prods_data:
            first = prods_data[0]
            assert "lowest_price_now" in first, "Campo lowest_price_now ausente"
            assert "all_time_low" in first, "Campo all_time_low ausente"
            assert "avg_price_30d" in first, "Campo avg_price_30d ausente"
            assert "is_real_discount" in first, "Campo is_real_discount ausente"
        print("  [OK] GET /api/products: OK")

        # POST /api/products
        create_res = client.post(
            "/api/products",
            json={
                "name": "Produto Teste API",
                "category": "Teste",
                "specs": "Teste specs",
                "target_price": 999.0,
            },
        )
        assert create_res.status_code == 201, f"POST /api/products falhou: {create_res.status_code}"
        created_p = create_res.json()
        created_id = created_p["id"]
        print(f"  [OK] POST /api/products: Criado ID {created_id}")

        # GET /api/products/{id}
        res_get = client.get(f"/api/products/{created_id}")
        assert res_get.status_code == 200, "GET /api/products/{id} falhou"
        print(f"  [OK] GET /api/products/{created_id}: OK")

        # POST /api/products/{id}/links
        link_res = client.post(
            f"/api/products/{created_id}/links",
            json={"store_name": "Kabum", "url": "https://www.kabum.com.br/produto/99999/teste"},
        )
        assert link_res.status_code == 201, "POST /api/products/{id}/links falhou"
        created_link_id = link_res.json()["id"]
        print(f"  [OK] POST /api/products/{created_id}/links: Criado link ID {created_link_id}")

        # POST /api/scrape/{product_id}
        scrape_prod_res = client.post(f"/api/scrape/{created_id}")
        assert scrape_prod_res.status_code == 200, "POST /api/scrape/{id} falhou"
        print(f"  [OK] POST /api/scrape/{created_id}: OK")

        # GET /api/products/{id}/history
        hist_res = client.get(f"/api/products/{created_id}/history")
        assert hist_res.status_code == 200, "GET /api/products/{id}/history falhou"
        hist_json = hist_res.json()
        assert "stores" in hist_json and "records" in hist_json, "Contrato de histórico violado"
        print(f"  [OK] GET /api/products/{created_id}/history: OK")

        # GET /api/stats/overview
        overview_res = client.get("/api/stats/overview")
        assert overview_res.status_code == 200, "GET /api/stats/overview falhou"
        assert overview_res.json()["total_products"] > 0
        print("  [OK] GET /api/stats/overview: OK")

        # POST /api/notify/test
        notify_res = client.post("/api/notify/test", json={"message": "Teste via endpoint da API", "kind": "alert"})
        assert notify_res.status_code == 200, "POST /api/notify/test falhou"
        print("  [OK] POST /api/notify/test: OK")

        # DELETE /api/links/{link_id}
        del_link_res = client.delete(f"/api/links/{created_link_id}")
        assert del_link_res.status_code == 200, "DELETE /api/links/{link_id} falhou"
        print(f"  [OK] DELETE /api/links/{created_link_id}: OK")

        # DELETE /api/products/{id}
        del_prod_res = client.delete(f"/api/products/{created_id}")
        assert del_prod_res.status_code == 200, "DELETE /api/products/{id} falhou"
        print(f"  [OK] DELETE /api/products/{created_id}: OK")

        # POST /api/scrape/all
        scrape_all_res = client.post("/api/scrape/all")
        assert scrape_all_res.status_code == 200, "POST /api/scrape/all falhou"
        print("  [OK] POST /api/scrape/all: OK")

    # 7. Busca de links (offline, com HTML de exemplo da Kabum)
    print("\n[7/7] Testando busca de links e nota de semelhança...")
    import json
    from vigia.link_search import link_key, score_candidate
    from vigia.scrapers.kabum import KabumScraper

    now = 1_800_000_000
    items = [
        {
            "code": 1, "name": "Placa de Vídeo RX 7600  8GB", "friendlyName": "placa-rx-7600",
            "price": 2000.0, "priceWithDiscount": 1700.0, "maxInstallment": "10x de R$ 180,00",
            "available": True, "sellerName": "KaBuM!", "flags": {"isMarketplace": False},
            "offer": {"name": "NINJA FRIDAY", "price": 1800.0, "priceWithDiscount": 1500.0, "endsAt": now + 3600},
        },
        {
            "code": 2, "name": "Placa RX 7600 XT 16GB", "friendlyName": "placa-rx-7600-xt",
            "price": 2500.0, "priceWithDiscount": 2200.0, "available": False, "sellerName": "Loja X",
            "flags": {"isMarketplace": True},
            "offer": {"name": "VENCIDA", "price": 1.0, "priceWithDiscount": 1.0, "endsAt": now - 10},
        },
        {"code": 3, "name": "Sem preço"},
    ]
    next_data = {"props": {"pageProps": {"data": json.dumps({"catalogServer": {"data": items}})}}}
    html = f'<script id="__NEXT_DATA__" type="application/json">{json.dumps(next_data)}</script>'
    found = KabumScraper.parse_search_html(html, now=now)
    assert len(found) == 2, f"Esperado 2 candidatos (item sem preço descartado), obteve {len(found)}"
    a, b = found
    assert a.price_cash == 1500.0 and a.offer_name == "NINJA FRIDAY", "Oferta ativa deveria valer"
    assert a.title == "Placa de Vídeo RX 7600 8GB", f"Título não normalizado: {a.title!r}"
    assert a.url == "https://www.kabum.com.br/produto/1/placa-rx-7600"
    assert a.installments_text == "10x de R$ 180,00 sem juros"
    assert b.price_cash == 2200.0 and b.offer_name is None, "Oferta vencida não deveria valer"
    assert b.is_marketplace and not b.in_stock
    print("  [OK] Parsing da busca da Kabum (oferta ativa/vencida, marketplace, estoque)")

    assert score_candidate("rx 7600 8gb", "Placa de Vídeo RX 7600 8GB GDDR6") == (100, [])
    sc, diff = score_candidate("rx 7600", "Placa de Vídeo RX 7600 XT 16GB")
    assert diff == ["XT"] and sc == 75, f"XT não detectado: {sc} {diff}"
    sc, diff = score_candidate("ryzen 5 5600", "Processador AMD Ryzen 5 5600X")
    assert "5600X" in diff, f"5600X não detectado: {diff}"
    sc_wrong, _ = score_candidate("ryzen 5 5600", "Processador AMD Ryzen 5 5500")
    assert sc_wrong < 60, f"Modelo errado com nota alta: {sc_wrong}"
    _, diff = score_candidate("rx 7600", "PC Gamer Ryzen 5 5500, RX 7600 8 GB")
    assert "PC completo" in diff, f"PC completo não detectado: {diff}"
    _, diff = score_candidate("ryzen 5 8500g", "Processador AMD Ryzen 5 8500G + Placa Mãe ASUS")
    assert "Combo" in diff, f"Combo não detectado: {diff}"
    print("  [OK] Nota de semelhança (modelo, XT, 5600X, PC completo, combo)")

    assert link_key("https://www.kabum.com.br/produto/459144/qualquer-nome?utm=x") == "kabum:459144"
    assert link_key("https://www.kabum.com.br/produto/459144") == "kabum:459144"
    print("  [OK] Identificação de links já monitorados")

    # Busca redirecionada para a categoria errada: tenta de novo sem "AMD"
    import vigia.link_search as link_search_mod
    from vigia.scrapers.base import SearchCandidate

    class FakeScraper:
        supports_search = True
        calls = []

        def search(self, q):
            self.calls.append(q)
            if q.lower().startswith("amd"):
                return [SearchCandidate("Kabum", "Placa de Vídeo RX 7600", "https://www.kabum.com.br/produto/1/gpu", price_cash=1.0)]
            return [SearchCandidate("Kabum", "Processador AMD Ryzen 7 5700X3D", "https://www.kabum.com.br/produto/2/cpu", price_cash=1.0)]

    fake = FakeScraper()
    original_get_scraper = link_search_mod.get_scraper
    link_search_mod.get_scraper = lambda store_name=None, url=None: fake
    try:
        found = link_search_mod.search_store_links("Kabum", "AMD Ryzen 7 5700X3D")
    finally:
        link_search_mod.get_scraper = original_get_scraper
    assert fake.calls == ["AMD Ryzen 7 5700X3D", "Ryzen 7 5700X3D"], f"Buscas feitas: {fake.calls}"
    assert found[0]["title"] == "Processador AMD Ryzen 7 5700X3D" and found[0]["score"] == 100
    assert len(found) == 2, "Resultados das duas buscas deveriam ser juntados"
    print("  [OK] Segunda tentativa sem palavras genéricas quando a loja redireciona")

    with TestClient(app) as client:
        res = client.get("/api/search", params={"q": "rx 7600", "store": "Pichau"})
        assert res.status_code == 400, f"Loja sem busca deveria dar 400, deu {res.status_code}"
        res = client.get("/api/search", params={"q": "x"})
        assert res.status_code == 422, f"Busca curta deveria dar 422, deu {res.status_code}"
    print("  [OK] GET /api/search: validações")

    print("\n" + "=" * 60)
    print("[SUCESSO] TODOS OS TESTES PASSARAM COM SUCESSO!")
    print("=" * 60)
    return True


def main():
    parser = argparse.ArgumentParser(description="Vigia - Monitor de Preços Black Friday")
    parser.add_argument("--test", action="store_true", help="Executa suíte de testes automatizados")
    parser.add_argument("--seed", action="store_true", help="Recria e semeia os dados iniciais no banco")
    parser.add_argument("--scrape", action="store_true", help="Executa varredura de preços em todas as lojas")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host do servidor (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Porta do servidor (default: 8000)")
    parser.add_argument("--reload", action="store_true", default=False, help="Habilita auto-reload no uvicorn")
    parser.add_argument("--dev", action="store_true", help="Inicia o backend FastAPI e o frontend Next.js simultaneamente")

    args = parser.parse_args()

    if args.dev:
        import subprocess
        frontend_dir = Path(__file__).resolve().parent / "frontend"
        print("Iniciando Vigia Fullstack (Backend FastAPI + Frontend Next.js)...")
        print("  - Backend:  http://127.0.0.1:8000")
        print("  - Frontend: http://localhost:3001")
        frontend_proc = subprocess.Popen(["npm", "run", "dev"], cwd=frontend_dir, shell=(os.name == "nt"))
        import uvicorn
        try:
            uvicorn.run("vigia.api:app", host=args.host, port=args.port, reload=args.reload)
        finally:
            frontend_proc.terminate()
        return

    if args.test:
        success = run_tests()
        sys.exit(0 if success else 1)

    if args.seed:
        from vigia.service import seed_initial_data
        print("Semeando banco de dados...")
        seed_initial_data(force_reseed=True)
        print("Seed concluído com sucesso!")
        return

    if args.scrape:
        from vigia.service import scrape_all_products
        print("Executando varredura geral em todas as lojas...")
        res = scrape_all_products()
        print(f"Varredura concluída: {res['success_count']}/{res['total_scraped']} links raspados com sucesso. Alertas disparados: {res['alerts_sent']}")
        return

    # Iniciar servidor Uvicorn
    import uvicorn
    print(f"Iniciando servidor Vigia em http://{args.host}:{args.port}")
    uvicorn.run("vigia.api:app", host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
