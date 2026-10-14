"""Erzeugt die Screenshots der Dokumentation (docs/img) mit Edge headless aus den Testseiten."""
import pathlib
import subprocess
import sys
import tempfile
from PIL import Image, ImageChops

root = pathlib.Path(__file__).resolve().parent.parent
EDGE = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
out = root / 'docs' / 'img'
out.mkdir(exist_ok=True)


def shot(page, name, width, height, scale=1, query=''):
    import time
    url = (root / 'test' / page).as_uri() + query + ('&' if '?' in query else '?') + 'still=1'
    dst = out / f'{name}.png'
    if dst.exists():
        dst.unlink()
    for _ in range(4):
        prof = tempfile.mkdtemp(prefix='ec-edge-')
        proc = subprocess.Popen([EDGE, f'--user-data-dir={prof}', '--no-first-run', '--headless=new', '--disable-gpu', '--hide-scrollbars',
                                 f'--window-size={width},{height}', f'--force-device-scale-factor={scale}', '--virtual-time-budget=6000',
                                 f'--screenshot={dst}', url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(60):
            time.sleep(0.5)
            if dst.exists() and dst.stat().st_size > 0:
                time.sleep(0.5)
                break
        proc.kill()
        if dst.exists() and dst.stat().st_size > 0:
            return dst
    raise RuntimeError('kein Screenshot: ' + name)


def trim(path, bg=(17, 17, 17), pad=0, keep_top=True):
    im = Image.open(path).convert('RGB')
    bg = im.getpixel((im.width - 1, im.height - 1))  # Hintergrundfarbe der Seite = Pixel unten rechts
    diff = ImageChops.difference(im, Image.new('RGB', im.size, bg)).convert('L').point(lambda v: 255 if v > 4 else 0)
    box = diff.getbbox()
    if box:
        im = im.crop((0, 0, im.width, min(im.height, box[3] + pad)))
    im.save(path)


# Assistent: jeder Schritt der vier Karten
JOBS = [
    ('wizard.html', 'wiz-flow-1-solar', '?card=flow&step=0'),
    ('wizard.html', 'wiz-flow-2-netz', '?card=flow&step=1'),
    ('wizard.html', 'wiz-flow-3-batterie', '?card=flow&step=2'),
    ('wizard.html', 'wiz-flow-5-verbraucher', '?card=flow&step=4&cfg=flow&tab=Assistent'),
    ('wizard.html', 'wiz-flow-6-preise', '?card=flow&step=5&cfg=flow&tab=Assistent'),
    ('wizard.html', 'wiz-flow-7-aussehen', '?card=flow&step=6&cfg=flow&tab=Assistent'),
    ('wizard.html', 'wiz-flow-8-fertig', '?card=flow&step=7&cfg=flow&tab=Assistent'),
    ('wizard.html', 'wiz-devices-assistent', '?card=devices'),
    ('wizard.html', 'wiz-stats-1-zaehler', '?card=stats&step=0'),
    ('wizard.html', 'wiz-room-1-raum', '?card=room&step=0&cfg=room&tab=Assistent'),
    ('wizard.html', 'wiz-room-2-zaehler', '?card=room&step=1&cfg=room&tab=Assistent'),
    ('wizard.html', 'wiz-room-3-herkunft', '?card=room&step=2&cfg=room&tab=Assistent'),
    ('wizard.html', 'wiz-room-4-preis', '?card=room&step=3&cfg=room&tab=Assistent'),
    ('wizard.html', 'wiz-room-5-auswertung', '?card=room&step=4&cfg=room&tab=Assistent'),
    ('wizard.html', 'wiz-room-6-aussehen', '?card=room&step=5&cfg=room&tab=Assistent'),
    ('wizard.html', 'wiz-room-7-fertig', '?card=room&step=6&cfg=room&tab=Assistent'),
]
# Karte der Raum-Abrechnung (Beispieldaten), je Bereich ein Bild
ROOM = [('room-kpis', 'head,kpis'), ('room-abrechnung', '0'), ('room-live', '1'), ('room-herkunft', '2'), ('room-grundlast', '3'),
        ('room-betriebszeiten', '4'), ('room-verlauf', '5'), ('room-archiv', '8')]
for name, show in ROOM:
    JOBS.append(('room-extra.html', name, '?show=' + show))
# Hauptbilder der Karten
JOBS.append(('flow.html', 'flow', '?shot=1'))
JOBS.append(('devices.html', 'devices', '?shot=1'))
JOBS.append(('stats.html', 'stats', '?shot=1'))
JOBS.append(('flow.html', 'flow-watt', '?shot=1&scene=morgen'))
JOBS.append(('flow.html', 'rest-an', '?shot=1&groups=5'))
JOBS.append(('flow.html', 'rest-aus', '?shot=1&groups=5&hiderest=1'))
# Farbschemen
for th in ['hell', 'warm', 'graphit']:
    JOBS.append(('flow.html', f'theme-{th}-flow', f'?theme={th}'))
    JOBS.append(('room-extra.html', f'theme-{th}-room', f'?theme={th}&show=head,kpis,0,1'))
for page, nm in [('devices.html', 'devices'), ('stats.html', 'stats')]:
    JOBS.append((page, f'theme-hell-{nm}', '?theme=hell'))
JOBS.append(('flow.html', 'theme-hell-flow-clean', '?theme=hell&shot=1'))
JOBS.append(('flow.html', 'batterie-grenze', '?shot=1&battery=reserve:10,max:95'))
JOBS.append(('flow.html', 'batterie-nutzbar', '?shot=1&battery=reserve:10,max:95,disp:nutzbar'))
JOBS.append(('flow.html', 'sammel-vorher', '?shot=1&groups=8'))
JOBS.append(('flow.html', 'sammel-breit', '?shot=1&groups=8&sammel=1'))
JOBS.append(('flow.html', 'sammel-schmal', '?shot=1&groups=8&sammel=1'))
only = sys.argv[1:]
for page, name, q in JOBS:
    if only and name not in only:
        continue
    w, h = (560, 1500) if name == 'sammel-schmal' else (1100, 1400) if name.startswith('sammel') else (1100, 3200) if page.startswith('room') else ((1100, 1400) if (page.startswith('theme') or name.startswith('theme') or name.startswith('batterie') or name in ('flow', 'devices', 'stats', 'flow-watt', 'rest-an', 'rest-aus')) else (560, 1100))
    p = shot(page, name, w, h, 1.5 if w < 1000 else 1, q)
    trim(p, pad=6)
    if name == 'wiz-devices-assistent':  # nur den Assistentenkasten (Formular gibt es im Test nicht)
        im = Image.open(p); im.crop((0, 0, im.width, 318)).save(p)
    print(name)
