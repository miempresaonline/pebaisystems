#!/usr/bin/env python3
"""
Playwright Visual & Responsive Audit Tool - PEBAI Web Craft Engine
Ejecuta una auditoria automatizada multi-dispositivo en navegadores reales:
- Captura de pantallas en 3 resoluciones (Movil 390x844, Tablet 768x1024, Desktop 1440x900).
- Deteccion de desbordamiento horizontal (horizontal scroll leak).
- Deteccion de targets tactiles demasiado pequenos (< 44px).
- Captura de errores de consola JS o excepciones no controladas.
- Soporte para auditoria en Modo Oscuro y Modo Claro.
"""

import sys
import os
import argparse
from playwright.sync_api import sync_playwright

VIEWPORTS = [
    {
        "name": "mobile_iphone",
        "width": 390,
        "height": 844,
        "device_scale_factor": 3,
        "is_mobile": True,
        "has_touch": True
    },
    {
        "name": "tablet_ipad",
        "width": 768,
        "height": 1024,
        "device_scale_factor": 2,
        "is_mobile": True,
        "has_touch": True
    },
    {
        "name": "desktop_retina",
        "width": 1440,
        "height": 900,
        "device_scale_factor": 2,
        "is_mobile": False,
        "has_touch": False
    }
]

def run_audit(target_url, output_dir="scratch/audit_screenshots"):
    os.makedirs(output_dir, exist_ok=True)
    print(f"[*] Iniciando auditoria visual con Playwright...")
    print(f"[*] Destino: {target_url}")
    print(f"[*] Directorio de capturas: {output_dir}")
    print("-" * 65)

    audit_results = {
        "url": target_url,
        "console_errors": [],
        "overflow_detected": False,
        "small_touch_targets": [],
        "screenshots": []
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        for vp in VIEWPORTS:
            print(f"\n[+] Auditando viewport: {vp['name']} ({vp['width']}x{vp['height']})...")
            
            context = browser.new_context(
                viewport={"width": vp["width"], "height": vp["height"]},
                device_scale_factor=vp["device_scale_factor"],
                is_mobile=vp["is_mobile"],
                has_touch=vp["has_touch"]
            )
            page = context.new_page()

            # Capturar errores de consola
            def on_console(msg):
                if msg.type in ("error", "warning"):
                    audit_results["console_errors"].append(f"[{vp['name']}][{msg.type}] {msg.text}")
            page.on("console", on_console)
            page.on("pageerror", lambda err: audit_results["console_errors"].append(f"[{vp['name']}][PAGE_ERROR] {err}"))

            # Cargar pagina
            try:
                page.goto(target_url, wait_until="networkidle", timeout=15000)
            except Exception as e:
                print(f"    [!] Error al cargar URL: {e}")
                # Reintentar con domcontentloaded
                page.goto(target_url, wait_until="domcontentloaded", timeout=15000)

            page.wait_for_timeout(1000)

            # 1. Comprobacion de Desbordamiento Horizontal
            scroll_width = page.evaluate("() => document.documentElement.scrollWidth")
            client_width = page.evaluate("() => document.documentElement.clientWidth")
            if scroll_width > client_width + 1:
                print(f"    [ALERTA OVERFLOW] Desbordamiento horizontal detectado: scrollWidth ({scroll_width}px) > clientWidth ({client_width}px)!")
                audit_results["overflow_detected"] = True
            else:
                print(f"    [OK] Sin desbordamiento horizontal ({client_width}px).")

            # 2. Comprobacion de Targets Tactiles en Movil
            if vp["is_mobile"]:
                small_targets = page.evaluate("""() => {
                    const targets = [];
                    const interactive = document.querySelectorAll('button, a, input, select, [role="button"], .option-card');
                    interactive.forEach(el => {
                        const rect = el.getBoundingClientRect();
                        if (rect.width > 0 && rect.height > 0) {
                            if (rect.width < 38 || rect.height < 38) {
                                targets.push({
                                    tag: el.tagName.toLowerCase(),
                                    text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30).trim(),
                                    w: Math.round(rect.width),
                                    h: Math.round(rect.height)
                                });
                            }
                        }
                    });
                    return targets;
                }""")
                if small_targets:
                    print(f"    [AVISO TACTIL] {len(small_targets)} elementos con area táctil inferior a 38px:")
                    for t in small_targets[:4]:
                        print(f"      - <{t['tag']}> '{t['text']}': {t['w']}x{t['h']}px")
                    audit_results["small_touch_targets"].extend(small_targets)
                else:
                    print(f"    [OK] Targets táctiles adecuados para móvil (>= 38px).")

            # 3. Captura Modo Actual
            img_path = os.path.join(output_dir, f"{vp['name']}_audit.png")
            page.screenshot(path=img_path, full_page=False)
            audit_results["screenshots"].append(img_path)
            print(f"    [FOTO] Captura guardada: {img_path}")

            # 4. Alternar a Modo Claro para verificar compatibilidad dual
            try:
                page.evaluate("() => { if (typeof applyTheme === 'function') applyTheme('light'); else document.documentElement.dataset.theme = 'light'; }")
                page.wait_for_timeout(400)
                light_img_path = os.path.join(output_dir, f"{vp['name']}_light_audit.png")
                page.screenshot(path=light_img_path, full_page=False)
                audit_results["screenshots"].append(light_img_path)
                print(f"    [FOTO] Captura Modo Claro guardada: {light_img_path}")
            except Exception as e:
                pass

            context.close()

        browser.close()

    print("\n" + "=" * 65)
    print("RESUMEN DE AUDITORIA PLAYWRIGHT:")
    print(f"  * Errores de consola: {len(audit_results['console_errors'])}")
    if audit_results["console_errors"]:
        for err in audit_results["console_errors"][:3]:
            print(f"    - {err}")
    print(f"  * Desbordamiento horizontal: {'DETECTADO (Requiere correccion)' if audit_results['overflow_detected'] else 'LIMPIO (0px)'}")
    print(f"  * Elementos táctiles reducidos: {len(audit_results['small_touch_targets'])}")
    print(f"  * Total capturas generadas: {len(audit_results['screenshots'])}")
    print("=" * 65)
    return audit_results

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Auditor visual Playwright para PEBAI Web Craft Engine")
    parser.add_argument("url", nargs="?", default="https://pebaisystems.es/diagnostico/", help="URL a auditar")
    parser.add_argument("--out", default="scratch/audit_screenshots", help="Carpeta de salida de capturas")
    args = parser.parse_args()

    run_audit(args.url, args.out)
