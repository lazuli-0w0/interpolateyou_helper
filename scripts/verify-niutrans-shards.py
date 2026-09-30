#!/usr/bin/env python3
"""Check every published NiuTrans book shard against its catalog entry."""
import json
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
folder = ROOT / 'public/data/classics/niutrans'
catalog = json.loads((folder / 'catalog.json').read_text(encoding='utf-8'))
assert len(catalog['books']) == 97
assert len({book['id'] for book in catalog['books']}) == 97
assert len({book['title'] for book in catalog['books']}) == 97
assert sum(book['translated_units'] for book in catalog['books']) == 972467
assert len(list(folder.glob('*.sqlite'))) == 97

for book in catalog['books']:
    path = folder / f"{book['id']}.sqlite"
    with sqlite3.connect(f'file:{path}?mode=ro', uri=True) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0] == 'ok', book['title']
        assert db.execute('SELECT count(*) FROM chapters').fetchone()[0] == book['volume_count'], book['title']
        assert db.execute('SELECT count(*) FROM sentences').fetchone()[0] == book['translated_units'], book['title']
        assert db.execute('SELECT count(*) FROM sentences WHERE translation IS NULL OR trim(translation)=""').fetchone()[0] == 0, book['title']
    assert len([chapter for chapter in catalog['chapters'] if chapter['book_id'] == book['id']]) == book['volume_count']

print(f'PASS: 97 complete SQLite shards, 972,467 bilingual sentence pairs; largest shard {max(path.stat().st_size for path in folder.glob("*.sqlite")):,} bytes')
