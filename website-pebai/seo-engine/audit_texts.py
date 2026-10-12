#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import glob
import re

files = glob.glob('dist/**/*.html', recursive=True)
button_texts = set()
for f in files:
    txt = open(f, encoding='utf-8', errors='ignore').read()
    matches = re.findall(r'<a[^>]*class=["\'][^"\']*button[^"\']*["\'][^>]*>[\s\S]*?</a>', txt)
    for m in matches:
        # extract text inside spans
        spans = re.findall(r'<span[^>]*>([^<]+)</span>', m)
        for s in spans:
            s_clean = s.strip()
            if s_clean and not s_clean.startswith('<') and len(s_clean) < 60:
                button_texts.add(s_clean)

print("Textos de botones encontrados en dist/:")
for bt in sorted(button_texts):
    print(f" - {bt}")
