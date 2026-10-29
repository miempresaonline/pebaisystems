#!/usr/bin/env python3
"""Detecta señales de contacto/automatización en la portada de una lista de dominios.

Uso: python3 senales_web.py dominios.txt > resultados.csv   (un dominio por línea)
Solo lee la portada con GET normal (robots.txt respetado). La lista de dominios
no se sube al repositorio: solo se publican cifras agregadas.
"""
import csv, re, sys, urllib.request, urllib.robotparser, urllib.parse

UA = "Mozilla/5.0 (compatible; PEBAI-estudio/1.0; +https://pebaisystems.es)"
SENALES = {
    "whatsapp": r"wa\.me/|api\.whatsapp\.com|web\.whatsapp\.com|whatsapp:",
    "formulario": r"<form[\s>]",
    "chat": r"tawk\.to|crisp\.chat|tidio|intercom|drift\.com|livechat|zopim|hubspot.{0,40}conversations|botpress|manychat|chatwoot",
    "reserva": r"calendly\.com|cal\.com|simplybook|reservio|booksy|doctoralia|setmore|acuityscheduling|youcanbook",
    "telefono": r"href=[\"']tel:",
}

def permitido(dominio):
    rp = urllib.robotparser.RobotFileParser()
    try:
        req = urllib.request.Request(f"https://{dominio}/robots.txt", headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=15) as r:
            rp.parse(r.read().decode("utf-8", "ignore").splitlines())
        return rp.can_fetch(UA, f"https://{dominio}/")
    except Exception:
        return True


def leer(dominio):
    req = urllib.request.Request(f"https://{dominio}/", headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status, r.read(600_000).decode("utf-8", "ignore")

def main():
    dominios = [l.strip().lower() for l in open(sys.argv[1]) if l.strip()]
    w = csv.writer(sys.stdout)
    w.writerow(["dominio", "estado"] + list(SENALES))
    for d in dominios:
        d = urllib.parse.urlparse("//" + d).netloc or d
        if not permitido(d):
            w.writerow([d, "robots"] + [""] * len(SENALES))
            continue
        try:
            estado, html = leer(d)
        except Exception as e:
            w.writerow([d, f"error:{type(e).__name__}"] + [""] * len(SENALES))
            continue
        w.writerow([d, estado] + [int(bool(re.search(p, html, re.I))) for p in SENALES.values()])

if __name__ == "__main__":
    main()
