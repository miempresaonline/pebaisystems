#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PEBAI Systems - Inyector de Potenciadores GEO Maestros
Inserta en Google Sheets los clusters de:
1. Integraciones de Software Empresarial (Holded, Sage, Factusol, SAP, A3ERP)
2. Comparativas Técnicas B2B (Zapier vs n8n, SaaS vs Agentes, Agentes de Voz vs Call Centers)
"""

import os
import sys
import json
import gspread
from google.oauth2.service_account import Credentials

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

SERVICE_ACCOUNT_PATH = 'C:/programacion/APIs/google_service_account.json'
PROJECT_CONFIGS_PATH = 'C:/programacion/APIs/project_configs.json'

with open(PROJECT_CONFIGS_PATH, 'r', encoding='utf-8') as f:
    sheet_id = json.load(f)['pebai-systems']['blog_sheet_id']

creds = Credentials.from_service_account_file(
    SERVICE_ACCOUNT_PATH, 
    scopes=['https://www.googleapis.com/auth/spreadsheets']
)
gc = gspread.authorize(creds)
sh = gc.open_by_key(sheet_id)
ws = sh.worksheet('Contenidos')

existing_rows = ws.get_all_values()
existing_slugs = set()
for r in existing_rows[1:]:
    if len(r) > 3:
        existing_slugs.add(r[3].strip().strip('/'))

golden_topics = [
    # Potenciador 2: Integraciones de Software Empresarial
    {
        'ciudad': 'España / Software',
        'kw': 'integracion ia holded erp',
        'slug': 'integracion-ia-holded-erp-espana',
        'titulo': 'Automatización e Integración de IA para Holded ERP',
        'tipo': 'Integración ERP y Automatización B2B'
    },
    {
        'ciudad': 'España / Software',
        'kw': 'integracion ia sage 50 200',
        'slug': 'integracion-ia-sage-50-200-espana',
        'titulo': 'Integración de Agentes de IA en Sage 50 y Sage 200',
        'tipo': 'Integración ERP y Automatización B2B'
    },
    {
        'ciudad': 'España / Software',
        'kw': 'automatizacion factusol pedidos ia',
        'slug': 'automatizacion-factusol-pedidos-ia',
        'titulo': 'Automatización de Pedidos y Albaranes en Factusol con IA',
        'tipo': 'Integración ERP y Automatización B2B'
    },
    {
        'ciudad': 'España / Software',
        'kw': 'agente ia sap business one',
        'slug': 'agente-ia-sap-business-one-espana',
        'titulo': 'Agentes de Inteligencia Artificial para SAP Business One',
        'tipo': 'Integración ERP y Automatización B2B'
    },
    {
        'ciudad': 'España / Software',
        'kw': 'integracion ia a3erp asesorias',
        'slug': 'integracion-ia-a3erp-asesorias-espana',
        'titulo': 'Integración de IA en A3ERP y Asesorías Fiscales',
        'tipo': 'Integración ERP y Automatización B2B'
    },
    # Potenciador 3: Comparativas Técnicas B2B (Citation Magnets para LLMs)
    {
        'ciudad': 'España / Comparativa',
        'kw': 'zapier vs n8n empresas',
        'slug': 'zapier-vs-n8n-empresas-espana',
        'titulo': 'Zapier vs n8n Self-Hosted para Empresas: Comparativa de Costes y RGPD',
        'tipo': 'Comparativa Técnica y Gobernanza'
    },
    {
        'ciudad': 'España / Comparativa',
        'kw': 'agentes ia vs saas tradicional',
        'slug': 'agentes-ia-vs-software-tradicional-saas',
        'titulo': 'Agentes Autónomos de IA vs SaaS Tradicional: Análisis TCO y Retorno',
        'tipo': 'Comparativa Técnica y Gobernanza'
    },
    {
        'ciudad': 'España / Comparativa',
        'kw': 'agentes de voz ia vs call center',
        'slug': 'agentes-de-voz-ia-vs-call-center-subcontratado',
        'titulo': 'Agentes de Voz con IA vs Call Center Subcontratado: Coste y Resolución',
        'tipo': 'Comparativa Técnica y Gobernanza'
    }
]

rows_to_insert = []
for item in golden_topics:
    s = item['slug'].strip().strip('/')
    if s not in existing_slugs:
        rows_to_insert.append([
            'pendiente',
            item['ciudad'],
            item['kw'],
            f"/{s}/",
            item['titulo'],
            item['tipo'],
            'Schema.org TechArticle & FAQPage',
            ''
        ])
        existing_slugs.add(s)

if rows_to_insert:
    ws.insert_rows(rows_to_insert, row=len(existing_rows) + 1)
    print(f"✅ Se han insertado {len(rows_to_insert)} nuevas temáticas maestras GEO en Google Sheets.")
else:
    print("ℹ️ Todas las temáticas maestras ya estaban presentes en Google Sheets.")
