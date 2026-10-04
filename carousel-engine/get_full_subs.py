import urllib.request
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Jordi Segues VTT
url_jordi = "https://v16-webapp.tiktokcdn-eu.com/76c5d40ce17056827ceabb7a7ab4323c/6ac33ec6/video/tos/alisg/tos-alisg-pv-0037/e5df2ae3b07b4ad99b8422ee33a87624/?a=1988&bti=ODszNWYuMDE6&&bt=4847&ft=_sO_C~0.N12Nvjx2cP7nRf65YlcI6IxVvYRpiX&mime_type=video_mp4&rc=anQzZnE5cjg5ZDMzODczNEBpanQzZnE5cjg5ZDMzODczNEA0bWRfMmRjXmNhLS1kMWBzYSM0bWRfMmRjXmNhLS1kMWBzcw%3D%3D&l=202610030607327E1A77A1E7843A80E205&btag=e00048000"

# Mich Markeeting VTT
url_mich = "https://v16-webapp.tiktokcdn-eu.com/afbe4991da0d92be6549f0682fe2a57e/6ac33ec9/video/tos/alisg/tos-alisg-pv-0037/4548d7d7674546b4b3bac995a4b7eb4d/?a=1988&bti=ODszNWYuMDE6&&bt=1681&ft=_sO_C~0.N12Nvjz2cP7nRf7NYlcI6IxVvYvpiX&mime_type=video_mp4&rc=amk2OHU5cmx1ZDMzODczNEBpamk2OHU5cmx1ZDMzODczNEBlYC5kMmRrNjBhLS1kMTFzYSNlYC5kMmRrNjBhLS1kMTFzcw%3D%3D&l=20261003060733498AD6ABFA676C806CEB&btag=e00048000"

print("=== JORDI SEGUES FULL SUBTITLES ===")
try:
    print(urllib.request.urlopen(urllib.request.Request(url_jordi, headers=headers)).read().decode('utf-8'))
except Exception as e:
    print("Error Jordi:", e)

print("\n=== MICH MARKEETING FULL SUBTITLES ===")
try:
    print(urllib.request.urlopen(urllib.request.Request(url_mich, headers=headers)).read().decode('utf-8'))
except Exception as e:
    print("Error Mich:", e)
