#!/usr/bin/env python3
"""Import sentence-aligned classics JSON into the website's SQLite database."""
import argparse, hashlib, json, re, shutil, sqlite3, unicodedata
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--source', type=Path, help='One aligned book JSON; defaults to data-sources/classics/*.json')
args = parser.parse_args()
files = [args.source] if args.source else sorted((ROOT/'data-sources/classics').glob('*.json'))
if not files:
    parser.error('Place aligned book JSON files in data-sources/classics or pass --source.')
out = ROOT/'public/data/classics'; out.mkdir(parents=True, exist_ok=True)
variants = dict(zip('髙嵗隂宻㫖㑹囘廵蠭靣㓜䇿畧𡚁', '高歲陰密旨會回巡蜂面幼策略弊'))
chars = {item['i']: item['o'] for item in json.loads((ROOT/'public/data/fanjian.json').read_text())}
chars.update({k: chars.get(v,v) for k,v in variants.items()})
def normalize(value):
    return ''.join(chars.get(c,c) for c in unicodedata.normalize('NFKC',value or '') if not c.isspace()).lower()
path = out/'classics.sqlite'; temp = path.with_suffix('.tmp')
if temp.exists(): temp.unlink()
con = sqlite3.connect(temp)
con.executescript('''
PRAGMA foreign_keys=ON;
CREATE TABLE books(id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, volume_count INTEGER NOT NULL, translated_units INTEGER NOT NULL);
CREATE TABLE chapters(book_id TEXT NOT NULL REFERENCES books(id), volume INTEGER NOT NULL, title TEXT NOT NULL, part TEXT NOT NULL, PRIMARY KEY(book_id,volume));
CREATE TABLE sentences(book_id TEXT NOT NULL, id TEXT NOT NULL, volume INTEGER NOT NULL, position INTEGER NOT NULL, paragraph INTEGER NOT NULL, original TEXT NOT NULL, translation TEXT, original_search TEXT NOT NULL, translation_search TEXT NOT NULL, metadata_search TEXT NOT NULL, PRIMARY KEY(book_id,id), FOREIGN KEY(book_id,volume) REFERENCES chapters(book_id,volume));
CREATE INDEX sentences_volume ON sentences(book_id,volume,position);
''')
for file in files:
    data=json.loads(file.read_text())
    book_id=hashlib.sha256(data['title'].encode()).hexdigest()[:16]
    chapters=([{'volume':0,'title':'序','part':'序','sentences':data['preface_sentences']}] if data.get('preface_sentences') else [])+data['volumes']
    count=sum(r.get('translation') is not None for c in chapters for r in c['sentences'])
    con.execute('INSERT INTO books VALUES(?,?,?,?,?)',(book_id,data['title'],data['author'],len(data['volumes']),count))
    for c in chapters:
        con.execute('INSERT INTO chapters VALUES(?,?,?,?)',(book_id,c['volume'],c['title'],c['part']))
        metadata=normalize(data['title']+' '+data['author']+' '+c['title']+' '+c['part'])
        for position,r in enumerate(c['sentences'],1):
            con.execute('INSERT INTO sentences VALUES(?,?,?,?,?,?,?,?,?,?)',(book_id,r['id'],c['volume'],position,r['paragraph'],r['original'],r.get('translation'),normalize(r['original']),normalize(r.get('translation')),metadata))
con.commit()
assert con.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
assert not con.execute('PRAGMA foreign_key_check').fetchall()
count=con.execute('SELECT count(*) FROM sentences').fetchone()[0]
base_catalog={
    'books':[dict(zip(('id','title','author','volume_count','translated_units'),row)) for row in con.execute('SELECT id,title,author,volume_count,translated_units FROM books ORDER BY title')],
    'chapters':[dict(zip(('book_id','volume','title','part'),row)) for row in con.execute('SELECT book_id,volume,title,part FROM chapters ORDER BY book_id,volume')]
}
con.close(); temp.replace(path)
(out/'catalog-base.json').write_text(json.dumps(base_catalog,ensure_ascii=False,separators=(',',':')))
(out/'search-normalization.json').write_text(json.dumps(chars,ensure_ascii=False,separators=(',',':')))
# Keep a downloadable database beside the original JSON and Markdown when explicitly importing one file.
if args.source: shutil.copy2(path,args.source.with_suffix('.sqlite'))
print(f'Imported {len(files)} book(s), {count} sentence units into {path}')

runtime = ROOT/'node_modules/sql.js'
for name in ['sql-wasm.js', 'sql-wasm.wasm']:
    shutil.copy2(runtime/'dist'/name, out/name)
shutil.copy2(runtime/'LICENSE', out/'sql.js-LICENSE.txt')
