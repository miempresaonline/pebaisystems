#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import requests
from google.oauth2.service_account import Credentials
import google.auth.transport.requests

SERVICE_ACCOUNT_PATH = 'C:/programacion/APIs/google_service_account.json'
PROPERTY_ID = '554831316'

creds = Credentials.from_service_account_file(
    SERVICE_ACCOUNT_PATH, 
    scopes=['https://www.googleapis.com/auth/analytics.readonly']
)
creds.refresh(google.auth.transport.requests.Request())
token = creds.token
headers = {'Authorization': f'Bearer {token}'}

def run_query(payload):
    url = f'https://analyticsdata.googleapis.com/v1beta/properties/{PROPERTY_ID}:runReport'
    r = requests.post(url, headers=headers, json=payload, timeout=15)
    return r.json()

# 1. Resumen general últimos 28 días vs últimos 7 días
print("=== RESUMEN GENERAL GA4 ===")
res_overview = run_query({
    'dateRanges': [{'startDate': '28daysAgo', 'endDate': 'today'}],
    'metrics': [
        {'name': 'activeUsers'},
        {'name': 'newUsers'},
        {'name': 'sessions'},
        {'name': 'userEngagementDuration'},
        {'name': 'bounceRate'}
    ]
})
if 'rows' in res_overview:
    m = res_overview['rows'][0]['metricValues']
    print(f"Últimos 28 días:")
    print(f"  • Usuarios Activos: {m[0]['value']}")
    print(f"  • Nuevos Usuarios: {m[1]['value']}")
    print(f"  • Sesiones: {m[2]['value']}")
    print(f"  • Tiempo Total Engagement: {float(m[3]['value'])/60:.1f} minutos")
    print(f"  • Tasa de Rebote: {float(m[4]['value'])*100:.1f}%")

# 2. Canales de Adquisición (Últimos 28 días)
print("\n=== CANALES DE TRÁFICO (Últimos 28 días) ===")
res_channels = run_query({
    'dateRanges': [{'startDate': '28daysAgo', 'endDate': 'today'}],
    'dimensions': [{'name': 'sessionDefaultChannelGroup'}],
    'metrics': [{'name': 'sessions'}, {'name': 'activeUsers'}, {'name': 'engagementRate'}],
    'orderBys': [{'metric': {'metricName': 'sessions'}, 'desc': True}]
})
for r in res_channels.get('rows', []):
    ch = r['dimensionValues'][0]['value']
    sess = r['metricValues'][0]['value']
    usr = r['metricValues'][1]['value']
    eng = float(r['metricValues'][2]['value']) * 100
    print(f"  • {ch:20}: {sess} sesiones | {usr} usuarios | {eng:.1f}% tasa interacción")

# 3. Fuentes / Medios detallados
print("\n=== FUENTES Y MEDIOS (sessionSource / sessionMedium) ===")
res_sources = run_query({
    'dateRanges': [{'startDate': '28daysAgo', 'endDate': 'today'}],
    'dimensions': [{'name': 'sessionSource'}, {'name': 'sessionMedium'}],
    'metrics': [{'name': 'sessions'}, {'name': 'activeUsers'}],
    'orderBys': [{'metric': {'metricName': 'sessions'}, 'desc': True}],
    'limit': 15
})
for r in res_sources.get('rows', []):
    src = r['dimensionValues'][0]['value']
    med = r['dimensionValues'][1]['value']
    sess = r['metricValues'][0]['value']
    usr = r['metricValues'][1]['value']
    print(f"  • {src} / {med}: {sess} sesiones ({usr} usuarios)")

# 4. Top Páginas visitadas
print("\n=== TOP PÁGINAS (Últimos 28 días) ===")
res_pages = run_query({
    'dateRanges': [{'startDate': '28daysAgo', 'endDate': 'today'}],
    'dimensions': [{'name': 'pagePath'}],
    'metrics': [{'name': 'screenPageViews'}, {'name': 'activeUsers'}],
    'orderBys': [{'metric': {'metricName': 'screenPageViews'}, 'desc': True}],
    'limit': 15
})
for r in res_pages.get('rows', []):
    path = r['dimensionValues'][0]['value']
    views = r['metricValues'][0]['value']
    usr = r['metricValues'][1]['value']
    print(f"  • {path:45}: {views} vistas ({usr} usuarios)")

# 5. Países y Ciudades
print("\n=== GEOGRAFÍA (Top Ciudades) ===")
res_geo = run_query({
    'dateRanges': [{'startDate': '28daysAgo', 'endDate': 'today'}],
    'dimensions': [{'name': 'country'}, {'name': 'city'}],
    'metrics': [{'name': 'activeUsers'}, {'name': 'sessions'}],
    'orderBys': [{'metric': {'metricName': 'activeUsers'}, 'desc': True}],
    'limit': 10
})
for r in res_geo.get('rows', []):
    country = r['dimensionValues'][0]['value']
    city = r['dimensionValues'][1]['value']
    usr = r['metricValues'][0]['value']
    sess = r['metricValues'][1]['value']
    print(f"  • {country} - {city}: {usr} usuarios ({sess} sesiones)")

# 6. Dispositivos
print("\n=== DISPOSITIVOS ===")
res_dev = run_query({
    'dateRanges': [{'startDate': '28daysAgo', 'endDate': 'today'}],
    'dimensions': [{'name': 'deviceCategory'}],
    'metrics': [{'name': 'activeUsers'}, {'name': 'sessions'}],
    'orderBys': [{'metric': {'metricName': 'activeUsers'}, 'desc': True}]
})
for r in res_dev.get('rows', []):
    cat = r['dimensionValues'][0]['value']
    usr = r['metricValues'][0]['value']
    sess = r['metricValues'][1]['value']
    print(f"  • {cat}: {usr} usuarios ({sess} sesiones)")
