"""Renderiza las plantillas GBP (Google Business Profile / LinkedIn) a PNG 1200x900.

Uso:
    python carousel-engine/render_gbp.py SPEC.json [SPEC2.json ...] [--out-dir DIR] [--scale 1] [--crop]

Cada SPEC es un objeto JSON (o una lista de objetos) con:
    template   a | b | c  (o a-pregunta, b-proceso, c-consultoria)
    out        ruta del PNG (relativa a la carpeta desde la que se lanza o a --out-dir)
    ...        el resto son los campos de la plantilla (ver templates/gbp/README.md)

--crop guarda además <nombre>_1x1.png con el recorte central 900x900 que hace Google.
Sale con código 1 si alguna imagen falla, para que un agente programado lo detecte.
"""
import argparse
import asyncio
import json
import os
import sys

from playwright.async_api import async_playwright

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

BASE = os.path.dirname(os.path.abspath(__file__))
TPL_DIR = os.path.join(BASE, "templates", "gbp")
TEMPLATES = {
    "a": "a-pregunta.html", "a-pregunta": "a-pregunta.html", "pregunta": "a-pregunta.html",
    "b": "b-proceso.html", "b-proceso": "b-proceso.html", "proceso": "b-proceso.html",
    "c": "c-consultoria.html", "c-consultoria": "c-consultoria.html", "consultoria": "c-consultoria.html",
    "d": "d-ias.html", "d-ias": "d-ias.html", "ias": "d-ias.html",
}
W, H = 1200, 900


def load_specs(paths):
    specs = []
    for p in paths:
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
        for s in data if isinstance(data, list) else [data]:
            s.setdefault("out", os.path.splitext(os.path.basename(p))[0] + ".png")
            specs.append(s)
    return specs


async def launch(p):
    for kwargs in ({}, {"channel": "msedge"}, {"channel": "chrome"}):
        try:
            return await p.chromium.launch(headless=True, **kwargs)
        except Exception:
            continue
    raise RuntimeError("No se encontró Chromium, Edge ni Chrome para Playwright")


async def render(specs, out_dir, scale, crop):
    errors = 0
    async with async_playwright() as p:
        browser = await launch(p)
        ctx = await browser.new_context(viewport={"width": W, "height": H}, device_scale_factor=scale)
        for spec in specs:
            spec = dict(spec)
            name = TEMPLATES.get(str(spec.pop("template", "a")).lower())
            out = spec.pop("out")
            if not name:
                print(f"[GBP] plantilla desconocida en {out}")
                errors += 1
                continue
            out = out if os.path.isabs(out) or not out_dir else os.path.join(out_dir, out)
            os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
            page = await ctx.new_page()
            page.on("console", lambda m: m.type == "error" and print("   consola:", m.text))
            await page.add_init_script("window.GBP_DATA = " + json.dumps(spec, ensure_ascii=False) + ";")
            try:
                await page.goto("file:///" + os.path.join(TPL_DIR, name).replace("\\", "/"))
                await page.wait_for_selector('body[data-ready="1"]', timeout=20000)
                fonts = await page.evaluate(
                    "[document.fonts.check('80px \"Instrument Serif\"'), document.fonts.check('16px Manrope')]")
                if not all(fonts):
                    print("   aviso: alguna fuente no cargó (¿sin internet?). Instrument Serif/Manrope:", fonts)
                await page.screenshot(path=out)
                print(f"[GBP] {name} -> {out}")
                if crop:
                    root, ext = os.path.splitext(out)
                    await page.screenshot(path=root + "_1x1" + ext, clip={"x": 150, "y": 0, "width": 900, "height": 900})
            except Exception as e:
                print(f"[GBP] ERROR en {out}: {e}")
                errors += 1
            await page.close()
        await browser.close()
    return errors


def main():
    ap = argparse.ArgumentParser(description="Renderiza plantillas GBP de PEBAI a PNG")
    ap.add_argument("specs", nargs="+", help="archivos JSON con los datos")
    ap.add_argument("--out-dir", default="", help="carpeta base para las rutas 'out' relativas")
    ap.add_argument("--scale", type=float, default=1, help="1 = 1200x900 (Google); 2 = 2400x1800")
    ap.add_argument("--crop", action="store_true", help="guarda también el recorte central 1:1")
    a = ap.parse_args()
    errors = asyncio.run(render(load_specs(a.specs), a.out_dir, a.scale, a.crop))
    sys.exit(1 if errors else 0)


if __name__ == "__main__":
    main()
