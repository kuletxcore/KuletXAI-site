"""Pull public IsekaiZero storyline assets into the site.

Fetches each storyline from the public API, downloads covers,
gallery media, cast portraits and cover videos, writes sanitized HTML cards,
and emits src/data/isk.ts. Run: python3 scripts/build_isk.py [slug ...]
Naming slugs refreshes only those stories and keeps the rest of isk.ts as it is.
"""
import html as htmllib
import io
import json
import os
import re
import sys
import urllib.request

from PIL import Image

SITE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(SITE, 'public', 'isk')
API = 'https://api-global.isekaizero.ai/api'

STORIES = {
    'acolytes': '6aa78f6bd17fe984ab332064',
    'colossus-protocol': '6aa4a2ce523ccdd47ab9b80d',
    'queen-bee': '6a9ae1c5a66365ba9f1523f1',
    'problem-spawner': '6a9504a149fd840d6d383b33',
    'i-am-the-table': '6a9d1ba30b414546e54a59aa',
    'godsmarked': '6ab416c09949716a1b4e333b',
}
# Public characters that belong to a story but aren't attached as cast
EXTRA_CAST = {
    'queen-bee': [
        '6a9e3c1c2dca1fb6fca472c4',  # Aurelia Croft
        '6a9d7368a7f26b6487ee9ca7',  # Jax Mercer
        '6aa0329a7abcf01112e98eff',  # Wren Ashby
        '6a9e61637aa095c0d822083c',  # Sloane Hart
        '6a9c27f2fabff9218f256e03',  # Mira Voss
        '6a9d8c2d575120de7e370026',  # Sable Hale
        '6a9da1f93af63830cda37299',  # Jaime Holt
    ],
    'i-am-the-table': ['6aa34777c884cdcde7806cac'],  # Lord Splinterfang
}
# Intros that talk about {{user}} as "she": after the you/your swap, these phrases are put in the second person too
INTRO_FIXES = {
    'godsmarked': [
        ('that was hers', 'that was yours'),
        ('She games, writes', 'You game, write'),
        ('and has a job search she stopped checking', 'and have a job search you stopped checking'),
        ('She knows every panel', 'You know every panel'),
        ('She has never been', 'You have never been'),
        ('Now she has the costume', 'Now you have the costume'),
    ],
}
GALLERY_CAP = 24
MAX_VIDEO = 6 * 1024 * 1024


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'kuletx-site-builder'})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def save_image(url, path, max_w, max_h, quality=80):
    if os.path.exists(path):
        im = Image.open(path)
        return im.size
    im = Image.open(io.BytesIO(fetch(url)))
    im = im.convert('RGBA') if im.mode in ('RGBA', 'LA', 'P') else im.convert('RGB')
    im.thumbnail((max_w, max_h))
    os.makedirs(os.path.dirname(path), exist_ok=True)
    im.save(path, 'WEBP', quality=quality, method=5)
    return im.size


def save_file(url, path, limit=None):
    if os.path.exists(path):
        return True
    data = fetch(url)
    if limit and len(data) > limit:
        return False
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'wb') as f:
        f.write(data)
    return True


def fill_user(text, char_name=''):
    def rep(m):
        before = text[: m.start()].rstrip()
        cap = not before or before[-1] in '.!?>"“:\n' or before.endswith('<br>')
        word = 'your' if m.group(1) else 'you'
        return word.capitalize() if cap else word
    text = re.sub(r"\{\{\s*user\s*\}\}(['’]s\b)?", rep, text)
    return re.sub(r'\{\{\s*char\s*\}\}', char_name or 'they', text)


def sanitize(markup):
    markup = re.sub(r'<\s*(script|iframe|object|embed|form|link|meta)[^>]*>.*?<\s*/\s*\1\s*>', '', markup, flags=re.S | re.I)
    markup = re.sub(r'<\s*(script|iframe|object|embed|form|link|meta|base)[^>]*/?>', '', markup, flags=re.I)
    markup = re.sub(r'\son\w+\s*=\s*("[^"]*"|\'[^\']*\'|[^\s>]+)', '', markup, flags=re.I)
    markup = re.sub(r'(href|src)\s*=\s*(["\'])\s*javascript:[^"\']*\2', r'\1="#"', markup, flags=re.I)
    return markup


CARD_DOC = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>{title}</title>
<base target="_blank">
<style>
html,body{{margin:0;background:#0d0f14;color:#e6e8ec;font-family:Georgia,'Times New Roman',serif;line-height:1.6}}
body{{padding:16px}}
img,video{{max-width:100%;height:auto}}
table{{max-width:100%}}
a{{color:#9cc7ff}}
</style></head><body>
{body}
</body></html>
"""


def write_card(path, title, body, char_name='', fixes=()):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    body = fill_user(body, char_name)
    for old, new in fixes:
        if old not in body:
            print('intro fix no longer matches:', repr(old), file=sys.stderr)
        body = body.replace(old, new)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(CARD_DOC.format(title=htmllib.escape(title), body=sanitize(body)))


def plain(text, char_name=''):
    return fill_user(text or '', char_name).strip()


def cast_entry(slug, c, role):
    cid = c['_id']
    name = c['name']
    out = {
        'id': cid,
        'name': name,
        'summary': plain(c.get('descriptionSummary'), name),
        'rating': c.get('contentRating') or 'sfw',
        'role': role,
    }
    cover = (c.get('cover') or {}).get('url')
    if cover:
        save_image(cover, os.path.join(PUB, slug, 'cast', f'{cid}.webp'), 600, 800)
        out['portrait'] = f'/isk/{slug}/cast/{cid}.webp'
    if c.get('description'):
        write_card(os.path.join(PUB, slug, 'cards', f'{cid}.html'), name, c['description'], name)
        out['card'] = f'/isk/{slug}/cards/{cid}.html'
    return out


ISK_TS = os.path.join(SITE, 'src', 'data', 'isk.ts')
ISK_DECL = 'export const ISK: Record<string, IskStory> = '


def main():
    only = sys.argv[1:]
    result = {}
    if only:
        with open(ISK_TS, encoding='utf-8') as f:
            src = f.read()
        result = json.loads(src[src.index(ISK_DECL) + len(ISK_DECL):])
    for slug, sid in STORIES.items():
        if only and slug not in only:
            continue
        d = json.loads(fetch(f'{API}/storylines/{sid}?excludeOwner=true&src=direct'))['data']
        entry = {'cast': [], 'gallery': []}

        vc = (d.get('videoCover') or {}).get('url')
        # Prefer the raw upload: the generated cover is an upscaled, low-bitrate copy
        if vc:
            m_orig = re.search(r'/videos/covers/([0-9a-f-]{36})_cover\.mp4', vc)
            if m_orig:
                vc_orig = vc.replace(m_orig.group(0), f'/videos/{m_orig.group(1)}_original.mp4')
                try:
                    fetch_head = urllib.request.urlopen(urllib.request.Request(vc_orig, method='HEAD'), timeout=20)
                    if fetch_head.status == 200:
                        vc = vc_orig
                except Exception:
                    pass
        if vc and save_file(vc, os.path.join(PUB, slug, 'cover.mp4'), MAX_VIDEO):
            entry['videoCover'] = f'/isk/{slug}/cover.mp4'

        if d.get('plot'):
            write_card(os.path.join(PUB, slug, 'cards', 'intro.html'), d['title'], d['plot'], fixes=INTRO_FIXES.get(slug, ()))
            entry['introCard'] = f'/isk/{slug}/cards/intro.html'

        seen = set()
        for c in d.get('personas', []):
            entry['cast'].append(cast_entry(slug, c, 'persona'))
            seen.add(c['_id'])
        for c in d.get('characters', []):
            if c['_id'] not in seen and c.get('name') != 'The Table™':
                entry['cast'].append(cast_entry(slug, c, 'character'))
                seen.add(c['_id'])
        for cid in EXTRA_CAST.get(slug, []):
            if cid in seen:
                continue
            c = json.loads(fetch(f'{API}/characters/{cid}'))['data']
            if c.get('visibility') == 'public' and not c.get('nsfw'):
                entry['cast'].append(cast_entry(slug, c, 'character'))

        media = [m for m in d.get('media', []) if not (m.get('nsfw') or m.get('flagged') or m.get('hidden') or m.get('isDraft'))]
        for m in media:
            if len(entry['gallery']) >= GALLERY_CAP:
                break
            mid = m['_id']
            cap = (m.get('description') or '').strip()
            if cap.lower().startswith('cover art:'):
                cap = 'Cover art'
            if cap.startswith('BG_'):
                cap = cap[3:].replace('_', ' ')
                cap = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', cap)
            try:
                if m['type'] == 'image':
                    full = os.path.join(PUB, slug, 'gallery', f'{mid}.webp')
                    w, h = save_image(m.get('url') or m['originalUrl'], full, 1400, 1400, 78)
                    save_image(m.get('url') or m['originalUrl'], os.path.join(PUB, slug, 'gallery', 'thumbs', f'{mid}.webp'), 360, 360, 72)
                    entry['gallery'].append({
                        'type': 'image', 'src': f'/isk/{slug}/gallery/{mid}.webp',
                        'thumb': f'/isk/{slug}/gallery/thumbs/{mid}.webp', 'w': w, 'h': h, 'caption': cap,
                    })
                elif m['type'] == 'video' and (m.get('originalUrl') or m.get('url')):
                    if save_file(m.get('originalUrl') or m['url'], os.path.join(PUB, slug, 'gallery', f'{mid}.mp4'), MAX_VIDEO):
                        entry['gallery'].append({
                            'type': 'video', 'src': f'/isk/{slug}/gallery/{mid}.mp4',
                            'w': int(m.get('width') or 0), 'h': int(m.get('height') or 0), 'caption': cap,
                        })
            except Exception as e:  # skip one bad asset, keep going
                print('skip', slug, mid, e, file=sys.stderr)
        result[slug] = entry
        print(slug, 'cast', len(entry['cast']), 'gallery', len(entry['gallery']), 'video', bool(entry.get('videoCover')))

    result = {slug: result[slug] for slug in STORIES if slug in result}
    with open(ISK_TS, 'w', encoding='utf-8') as f:
        f.write('// Generated from public IsekaiZero storyline data. Re-run build_isk.py to refresh.\n')
        f.write('export type IskCast = { id: string; name: string; summary: string; rating: string; role: "persona" | "character"; portrait?: string; card?: string }\n')
        f.write('export type IskMedia = { type: "image" | "video"; src: string; thumb?: string; w: number; h: number; caption: string }\n')
        f.write('export type IskStory = { videoCover?: string; introCard?: string; cast: IskCast[]; gallery: IskMedia[] }\n\n')
        f.write(ISK_DECL)
        f.write(json.dumps(result, indent=2, ensure_ascii=False))
        f.write('\n')


main()
