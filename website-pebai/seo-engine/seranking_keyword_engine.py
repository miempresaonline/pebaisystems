#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - SE Ranking Autonomous Intelligence & Keyword Engine
Aprovecha al 100% el potencial de SE Ranking (Data API & Project Management):
1. Minería de palabras clave de alta intención, similares y preguntas.
2. Análisis de volumen de búsqueda, CPC y dificultad en España (source=es).
3. Reposición automática de nuevas ideas y temáticas en estado 'pendiente' en Google Sheets.
4. Monitorización de rankings para el proyecto pebaisystems.es (ID: 12936941).
"""

import os
import sys
import json
import time
import requests

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WEBSITE_DIR = os.path.dirname(SCRIPT_DIR)
APIS_DIR = "C:/programacion/APIs"
API_KEYS_PATH = os.path.join(APIS_DIR, "api_keys.json")
PROJECT_CONFIGS_PATH = os.path.join(APIS_DIR, "project_configs.json")
SERVICE_ACCOUNT_PATH = os.path.join(APIS_DIR, "google_service_account.json")

def load_credentials():
    with open(API_KEYS_PATH, "r", encoding="utf-8") as f:
        keys = json.load(f)
    with open(PROJECT_CONFIGS_PATH, "r", encoding="utf-8") as f:
        proj = json.load(f).get("pebai-systems", {})
    return keys, proj

def get_seranking_headers(api_key):
    return {
        "Authorization": f"Token {api_key}",
        "Content-Type": "application/json"
    }

def get_account_status(api_key):
    url = "https://api.seranking.com/v1/account/subscription"
    r = requests.get(url, headers=get_seranking_headers(api_key), timeout=10)
    if r.status_code == 200:
        return r.json().get("subscription_info", {})
    return None

def fetch_similar_keywords(seed_keyword, api_key, limit=10, country="es"):
    time.sleep(1.2) # Respetar rate limit de SE Ranking (1 req/seg)
    url = f"https://api.seranking.com/v1/keywords/similar?source={country}&keyword={requests.utils.quote(seed_keyword)}&limit={limit}"
    r = requests.get(url, headers=get_seranking_headers(api_key), timeout=15)
    if r.status_code == 200:
        return r.json().get("keywords", [])
    return []

def fetch_related_keywords(seed_keyword, api_key, limit=10, country="es"):
    time.sleep(1.2)
    url = f"https://api.seranking.com/v1/keywords/related?source={country}&keyword={requests.utils.quote(seed_keyword)}&limit={limit}"
    r = requests.get(url, headers=get_seranking_headers(api_key), timeout=15)
    if r.status_code == 200:
        return r.json().get("keywords", [])
    return []

def fetch_keyword_metrics(keywords_list, api_key, country="es"):
    time.sleep(1.2)
    url = f"https://api.seranking.com/v1/keywords/export?source={country}"
    payload = {"keywords": keywords_list}
    r = requests.post(url, headers=get_seranking_headers(api_key), json=payload, timeout=20)
    if r.status_code in (200, 201):
        return r.json()
    return []

def replenish_google_sheets_with_ideas(ideas, sheet_id):
    """Inserta nuevas ideas de SEO en estado 'pendiente' en Google Sheets."""
    import gspread
    from google.oauth2.service_account import Credentials
    creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_PATH, scopes=['https://www.googleapis.com/auth/spreadsheets'])
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(sheet_id)
    ws = sh.worksheet('Contenidos')

    existing_rows = ws.get_all_values()
    existing_slugs = set()
    for r in existing_rows[1:]:
        if len(r) > 3:
            existing_slugs.add(r[3].strip().strip('/'))

    added = 0
    rows_to_insert = []
    for idea in ideas:
        slug = idea["slug"].strip().strip('/')
        if slug in existing_slugs:
            continue

        new_row = [
            "pendiente",
            idea["ciudad"],
            idea["keyword"],
            f"/{slug}/",
            idea["titulo"],
            idea.get("tipo", "Consultoría e Ingeniería de Procesos con IA"),
            "Schema.org Service & FAQPage",
            ""
        ]
        rows_to_insert.append(new_row)
        existing_slugs.add(slug)

    if rows_to_insert:
        ws.insert_rows(rows_to_insert, row=len(existing_rows) + 1)
        added = len(rows_to_insert)

    return added

def auto_mine_top_keywords_to_sheets(target_count=10):
    """
    Mina las palabras clave con mayor volumen y CPC de SE Ranking en España
    y las inyecta directamente en estado 'pendiente' en Google Sheets.
    """
    keys, proj = load_credentials()
    api_key = keys.get("se_ranking_api_key")
    sheet_id = proj.get("blog_sheet_id")

    seed_topics = [
        ("consultoria inteligencia artificial empresas", "Consultoría e Ingeniería de Procesos con IA"),
        ("auditoria de procesos empresas", "Auditoría Operativa y Viabilidad IA"),
        ("automatizacion de procesos empresas", "Optimización y Automatización B2B"),
        ("inteligencia artificial para empresas", "Consultoría e Implantación de IA"),
        ("agentes de inteligencia artificial", "Sistemas Multiagente y Agentes de Voz"),
        ("software a medida para empresas", "Desarrollo de Software Operativo a Medida"),
        ("formacion inteligencia artificial empresas", "Capacitación Técnica y Retainer Mensual"),
        ("optimizacion de procesos industriales", "Ingeniería de Procesos e Industria")
    ]

    mined_candidates = []
    seen_kws = set()

    print(f"⛏️ Iniciando minería de palabras clave en SE Ranking (España)...")
    for seed, category in seed_topics:
        similar = fetch_similar_keywords(seed, api_key, limit=8)
        for k in similar:
            kw_name = k.get("keyword", "").strip().lower()
            vol = k.get("volume", 0)
            cpc = k.get("cpc", 0.0)
            if not kw_name or kw_name in seen_kws:
                continue
            # Excluir intenciones no comerciales (empleo, académico)
            if any(neg in kw_name for neg in ["trabajo", "empleo", "sueldo", "salario", "que es", "master", "carrera", "curso gratis"]):
                continue
            if vol >= 30 or cpc >= 1.5:
                seen_kws.add(kw_name)
                mined_candidates.append({
                    "keyword": kw_name,
                    "volume": vol,
                    "cpc": cpc,
                    "category": category
                })

    # Ordenar por valor comercial B2B (CPC * 2 + Volumen * 0.1)
    mined_candidates.sort(key=lambda x: (x["cpc"] * 2.0 + x["volume"] * 0.1), reverse=True)
    print(f"📊 Encontradas {len(mined_candidates)} oportunidades de alto potencial.")

    # Formatear para Google Sheets
    ideas_to_add = []
    for cand in mined_candidates[:target_count]:
        kw = cand["keyword"]
        slug_raw = kw.replace(" ", "-").replace("á", "a").replace("é", "e").replace("í", "i").replace("ó", "o").replace("ú", "u").replace("ñ", "n")
        slug = f"{slug_raw}-espana"
        title = f"{kw.title()} para Empresas en España"
        ideas_to_add.append({
            "ciudad": "España",
            "keyword": kw,
            "slug": slug,
            "titulo": title,
            "tipo": cand["category"]
        })

    added = replenish_google_sheets_with_ideas(ideas_to_add, sheet_id)
    print(f"✅ Se han añadido {added} nuevas temáticas minadas de SE Ranking a Google Sheets.")
    return added

if __name__ == "__main__":
    keys, proj = load_credentials()
    api_key = keys.get("se_ranking_api_key")
    site_id = proj.get("se_ranking_site_id")
    sheet_id = proj.get("blog_sheet_id")

    print(f"🔍 Conectando a SE Ranking (Site ID: {site_id})...")
    status = get_account_status(api_key)
    if status:
        print(f"✅ Cuenta SE Ranking activa | Unidades restantes: {status.get('units_left')}/{status.get('units_limit')}")
    else:
        print("⚠️ No se pudo obtener el estado de la suscripción.")

    print("\n🧠 Buscando palabras clave similares para 'inteligencia artificial empresas'...")
    similar = fetch_similar_keywords("inteligencia artificial empresas", api_key, limit=5)
    for k in similar:
        print(f"  • {k.get('keyword')} | Vol: {k.get('volume')} | CPC: {k.get('cpc')}€ | Dif: {k.get('difficulty')}%")

    print("\n🧠 Buscando palabras clave relacionadas para 'automatizacion procesos'...")
    related = fetch_related_keywords("automatizacion procesos", api_key, limit=5)
    for k in related:
        print(f"  • {k.get('keyword')} | Vol: {k.get('volume')} | CPC: {k.get('cpc')}€")

