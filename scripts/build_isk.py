"""Pull public IsekaiZero and KageSekai storyline assets into the site.

Fetches each storyline from its platform's public API, downloads covers,
gallery media, cast portraits and cover videos, writes sanitized HTML cards,
and emits src/data/isk.ts. Run: python3 scripts/build_isk.py [slug ...]
Naming slugs refreshes only those stories and keeps the rest of isk.ts as it is.
"""
import hashlib
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
# 18+ storylines are served by KageSekai's own API
KAGE_API = 'https://api.kagesekai.ai/api'
KAGE = {'wristbound'}

STORIES = {
    'acolytes': '6aa78f6bd17fe984ab332064',
    'colossus-protocol': '6aa4a2ce523ccdd47ab9b80d',
    'queen-bee': '6a9ae1c5a66365ba9f1523f1',
    'problem-spawner': '6a9504a149fd840d6d383b33',
    'i-am-the-table': '6a9d1ba30b414546e54a59aa',
    'godsmarked': '6ab416c09949716a1b4e333b',
    'wristbound': '6af2da17a519bbd9cf367837',
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
# Stories whose player is written as "she": {{user}} becomes this noun there instead of you/your
PLAYER_NOUN = {
    'colossus-protocol': '[your character]',
    'queen-bee': 'the new girl',
}
# Raw card text that needs more than the {{user}} swap: name slots, and pronouns that have to follow the player
CARD_FIXES = {
    'acolytes': [
        ('line-height:1.3;">{{user}}</div>', 'line-height:1.3;">[Your character]</div>'),
    ],
    'colossus-protocol': [
        ('FILE CONTINUES AS {{user}}', 'FILE CONTINUES AS [YOUR CHARACTER]'),
    ],
    'queen-bee': [
        ('Can {{user}} force', 'Can she force'),
        ('acknowledge {{user}}</span>', 'acknowledge her</span>'),
    ],
    'problem-spawner': [
        ('behind their own thoughts', 'behind your own thoughts'),
        ('before Meridian decides for them', 'before Meridian decides for you'),
        ("doesn't exist for anyone but them", "doesn't exist for anyone but you"),
    ],
    'wristbound': [
        ('width:100%; max-width:640px; background', 'width:100%; max-width:640px; margin:0 auto; background'),
    ],
}
IRREGULAR = {'is': 'are', 'was': 'were', 'has': 'have', 'does': 'do', "isn't": "aren't", "wasn't": "weren't", "hasn't": "haven't", "doesn't": "don't"}
NOT_VERBS = {'always', 'perhaps', 'sometimes', 'besides', 'afterwards', 'towards', 'upstairs', 'downstairs', 'whereas', 'yours', 'hers', 'ours', 'theirs', 'plus', 'versus'}
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


def you_verb(verb):
    """The verb that followed {{user}}, made to agree with "you": lives -> live, has -> have."""
    low = verb.lower().replace('’', "'")
    if low in IRREGULAR:
        return IRREGULAR[low]
    if len(low) < 4 or low in NOT_VERBS or not low.endswith('s') or low.endswith(('ss', 'us', 'is')):
        return verb
    if low.endswith('ies'):
        return low[:-3] + 'y'
    if low.endswith(('ches', 'shes', 'sses', 'xes', 'zes', 'oes')):
        return low[:-2]
    return low[:-1]


def cap_first(word):
    return re.sub(r'[a-z]', lambda m: m.group(0).upper(), word, count=1)


def fill_user(text, char_name='', noun=''):
    def rep(m):
        before = re.sub(r'&(ldquo|lsquo|quot|apos|#8220|#8216|#34|#39);$', '"', text[: m.start()].rstrip())
        cap = not before or before[-1] in '.!?>"“:\n' or before.endswith('<br>')
        if noun:
            word = noun + (m.group(1) or '')
            return (cap_first(word) if cap else word) + (m.group(2) or '') + (m.group(3) or '')
        word = 'your' if m.group(1) else 'you'
        word = word.capitalize() if cap else word
        if not m.group(3):
            return word
        verb = you_verb(m.group(3))
        if verb != m.group(3):
            print(f'  agreement: you {m.group(3)} -> you {verb}')
        return word + m.group(2) + verb
    text = re.sub(r"\{\{\s*user\s*\}\}(?:(['’]s\b)|(\s+)([A-Za-z]+(?:['’]t)?\b))?", rep, text)
    return re.sub(r'\{\{\s*char\s*\}\}', char_name or 'they', text)


FIX_HITS = set()


def story_text(slug, text, char_name=''):
    """Card or summary text with the story's fixes applied and {{user}} filled in."""
    for old, new in CARD_FIXES.get(slug, ()):
        if old in text:
            FIX_HITS.add((slug, old))
            text = text.replace(old, new)
    return fill_user(text, char_name, PLAYER_NOUN.get(slug, ''))


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


def write_card(slug, name, title, body, char_name=''):
    path = os.path.join(PUB, slug, 'cards', f'{name}.html')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    doc = CARD_DOC.format(title=htmllib.escape(title), body=sanitize(story_text(slug, body, char_name)))
    with open(path, 'w', encoding='utf-8') as f:
        f.write(doc)
    # Cards are cached for a day, so a content hash in the URL makes edits show up at once
    return f'/isk/{slug}/cards/{name}.html?v={hashlib.sha1(doc.encode()).hexdigest()[:8]}'


def cast_entry(slug, c, role):
    cid = c['_id']
    name = c['name']
    out = {
        'id': cid,
        'name': name,
        'summary': story_text(slug, c.get('descriptionSummary') or '', name).strip(),
        'rating': c.get('contentRating') or 'sfw',
        'role': role,
    }
    cover = (c.get('cover') or {}).get('url')
    if cover:
        save_image(cover, os.path.join(PUB, slug, 'cast', f'{cid}.webp'), 600, 800)
        out['portrait'] = f'/isk/{slug}/cast/{cid}.webp'
    if c.get('description'):
        out['card'] = write_card(slug, cid, name, c['description'], name)
    return out


def tidy_caption(cap):
    if cap.lower().startswith(('cover art:', "the story's cover.")):
        return 'Cover art'
    # "Key visual, same art and scene as the cover but with no lettering: ..." is a note to the scene picker
    cap = re.sub(r'^(Key visual), same art[^:]*:', r'\1:', cap)
    # Some captions are the whole image prompt: keep only what the picture shows
    if cap.startswith('References, in order:'):
        cap = re.sub(r'^.*?cinematic background art\.\s*', '', cap, flags=re.S)
        cap = re.sub(r'^Vertical 9:16\s+(establishing shot of\s+)?', '', cap)
        cap = re.split(r'[:.]', cap, maxsplit=1)[0]
    # Captions double as scene-picker notes ("Use for...", "Use when..."), which are not for readers
    return re.sub(r'\.\s*Use (for|when)\b.*$', '.', cap, flags=re.S | re.I).strip()


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
        api = KAGE_API if slug in KAGE else API
        d = json.loads(fetch(f'{api}/storylines/{sid}?excludeOwner=true&src=direct'))['data']
        entry = {'cast': [], 'gallery': []}

        vc = (d.get('videoCover') or {}).get('url')
        # Prefer the raw upload: the generated cover is an upscaled, low-bitrate copy
        if vc:
            m_orig = re.search(r'/videos/covers/([0-9a-f-]{36})_cover\.mp4', vc)
            if m_orig:
                vc_orig = vc.replace(m_orig.group(0), f'/videos/{m_orig.group(1)}_original.mp4')
                try:
                    # The CDN answers 403 to requests without a user agent
                    fetch_head = urllib.request.urlopen(urllib.request.Request(vc_orig, method='HEAD', headers={'User-Agent': 'kuletx-site-builder'}), timeout=20)
                    if fetch_head.status == 200:
                        vc = vc_orig
                except Exception:
                    pass
        if vc and save_file(vc, os.path.join(PUB, slug, 'cover.mp4'), MAX_VIDEO):
            entry['videoCover'] = f'/isk/{slug}/cover.mp4'

        if d.get('plot'):
            entry['introCard'] = write_card(slug, 'intro', d['title'], d['plot'])

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
            c = json.loads(fetch(f'{api}/characters/{cid}'))['data']
            if c.get('visibility') == 'public' and not c.get('nsfw'):
                entry['cast'].append(cast_entry(slug, c, 'character'))

        media = [m for m in d.get('media', []) if not (m.get('nsfw') or m.get('flagged') or m.get('hidden') or m.get('isDraft'))]
        for m in media:
            if len(entry['gallery']) >= GALLERY_CAP:
                break
            mid = m['_id']
            cap = tidy_caption((m.get('description') or '').strip())
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
        for old, _ in CARD_FIXES.get(slug, ()):
            if (slug, old) not in FIX_HITS:
                print('card fix no longer matches:', slug, repr(old), file=sys.stderr)
        print(slug, 'cast', len(entry['cast']), 'gallery', len(entry['gallery']), 'video', bool(entry.get('videoCover')))

    result = {slug: result[slug] for slug in STORIES if slug in result}
    with open(ISK_TS, 'w', encoding='utf-8') as f:
        f.write('// Generated from public IsekaiZero and KageSekai storyline data. Re-run build_isk.py to refresh.\n')
        f.write('export type IskCast = { id: string; name: string; summary: string; rating: string; role: "persona" | "character"; portrait?: string; card?: string }\n')
        f.write('export type IskMedia = { type: "image" | "video"; src: string; thumb?: string; w: number; h: number; caption: string }\n')
        f.write('export type IskStory = { videoCover?: string; introCard?: string; cast: IskCast[]; gallery: IskMedia[] }\n\n')
        f.write(ISK_DECL)
        f.write(json.dumps(result, indent=2, ensure_ascii=False))
        f.write('\n')


main()
