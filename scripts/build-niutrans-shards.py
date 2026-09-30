#!/usr/bin/env python3
"""Build one browser-searchable SQLite file per NiuTrans bilingual book.

Run with a local sparse checkout containing the repository's 双语数据 directory:
python3 scripts/build-niutrans-shards.py /path/to/Classical-Modern
"""
import argparse
import hashlib
import json
import re
import sqlite3
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/data/classics/niutrans'
EXPECTED_BOOKS = 97
EXPECTED_PAIRS = 972467
ORDER = {
    '论语': '学而篇 为政篇 八佾篇 里仁篇 公冶长篇 雍也篇 述而篇 泰伯篇 子罕篇 乡党篇 先进篇 颜渊篇 子路篇 宪问篇 卫灵公篇 季氏篇 阳货篇 微子篇 子张篇 尧曰篇'.split(),
    '孙子兵法': '始计篇 作战篇 谋攻篇 军形篇 兵势篇 虚实篇 军争篇 九变篇 行军篇 地形篇 九地篇 火攻篇 用间篇'.split(),
}
AUTHORS = {'论语': '孔門弟子', '老子': '老子', '孙子兵法': '孫武'}
HAN_NUMBERS = {'零': 0, '〇': 0, '一': 1, '二': 2, '兩': 2, '两': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}
UNITS = {'十': 10, '百': 100, '千': 1000, '萬': 10000, '万': 10000}
NUMERIC = re.compile(r'[第卷回章節节篇]([零〇一二兩两三四五六七八九十百千萬万]+)')
TRADITIONAL_TITLES = {'论语': '論語', '孙子兵法': '孫子兵法', '水经注': '水經注'}
NAME_FIXES = str.maketrans({'誌': '志', '畧': '略', '説': '說', '韆': '千', '鞦': '秋',
    '週': '周', '傢': '家', '樸': '朴', '蒐': '搜', '鵰': '雕', '録': '錄',
    '硃': '朱', '樑': '梁', '顔': '顏', '穀': '谷'})
SCHEMA = '''
CREATE TABLE books(id TEXT PRIMARY KEY, title TEXT NOT NULL, author TEXT NOT NULL, volume_count INTEGER NOT NULL, translated_units INTEGER NOT NULL);
CREATE TABLE chapters(book_id TEXT NOT NULL REFERENCES books(id), volume INTEGER NOT NULL, title TEXT NOT NULL, part TEXT NOT NULL, PRIMARY KEY(book_id,volume));
CREATE TABLE sentences(book_id TEXT NOT NULL, id TEXT NOT NULL, volume INTEGER NOT NULL, position INTEGER NOT NULL, paragraph INTEGER NOT NULL, original TEXT NOT NULL, translation TEXT, original_search TEXT NOT NULL, translation_search TEXT NOT NULL, metadata_search TEXT NOT NULL, PRIMARY KEY(book_id,id), FOREIGN KEY(book_id,volume) REFERENCES chapters(book_id,volume));
CREATE INDEX sentences_volume ON sentences(book_id,volume,position);
'''

def han_number(value):
    result, current, digit = 0, 0, 0
    for character in value:
        if character in HAN_NUMBERS:
            digit = HAN_NUMBERS[character]
        elif character in UNITS:
            unit = UNITS[character]
            if unit == 10000:
                result += (current + digit) * unit
                current = digit = 0
            else:
                current += (digit or 1) * unit
                digit = 0
    return result + current + digit

def natural_key(path, base):
    parts = path.relative_to(base).parts
    if base.name in ORDER and len(parts) == 1:
        return ((0, ORDER[base.name].index(parts[0])),)
    if base.name == '老子':
        match = NUMERIC.search(parts[-1])
        if match:
            return ((0, han_number(match.group(1))),)
    key = []
    for part in parts:
        match = NUMERIC.search(part)
        key.append((0, han_number(match.group(1))) if match else (1, part))
    return tuple(key)

def paired_lines(folder):
    source = (folder / 'source.txt').read_text(encoding='utf-8-sig').splitlines()
    target = (folder / 'target.txt').read_text(encoding='utf-8-sig').splitlines()
    if len(source) != len(target):
        raise ValueError(f'Line count mismatch in {folder}: {len(source)} != {len(target)}')
    pairs = [(original.strip(), translation.strip()) for original, translation in zip(source, target)]
    if any(not original or not translation for original, translation in pairs):
        raise ValueError(f'Empty side of a pair in {folder}')
    return pairs

def display_name(value, traditional):
    return ''.join(traditional.get(character, character) for character in value).translate(NAME_FIXES)

def build_book(book_dir, chars, traditional):
    source_title = book_dir.name
    title = TRADITIONAL_TITLES.get(source_title) or display_name(source_title, traditional)
    author = AUTHORS.get(source_title, '')
    book_id = hashlib.sha256(title.encode()).hexdigest()[:16]
    chapters = sorted((path.parent for path in book_dir.rglob('source.txt')), key=lambda path: natural_key(path, book_dir))
    if not chapters:
        raise ValueError(f'No bilingual chapters in {book_dir}')
    if source_title in ORDER and {path.name for path in chapters} != set(ORDER[source_title]):
        raise ValueError(f'Unexpected chapter list in {book_dir}')
    destination = OUTPUT / f'{book_id}.sqlite'
    temporary = destination.with_suffix('.tmp')
    if temporary.exists():
        temporary.unlink()
    con = sqlite3.connect(temporary)
    con.executescript('PRAGMA foreign_keys=ON; PRAGMA journal_mode=OFF;' + SCHEMA)
    count = 0
    catalog_chapters = []
    con.execute('INSERT INTO books VALUES(?,?,?,?,?)', (book_id, title, author, len(chapters), 0))

    def normalize(value):
        return ''.join(chars.get(character, character) for character in unicodedata.normalize('NFKC', value) if not character.isspace()).lower()

    for volume, folder in enumerate(chapters, 1):
        relative = folder.relative_to(book_dir)
        chapter_title = display_name(folder.name, traditional)
        part = title if len(relative.parts) == 1 else ' · '.join(display_name(piece, traditional) for piece in relative.parts[:-1])
        con.execute('INSERT INTO chapters VALUES(?,?,?,?)', (book_id, volume, chapter_title, part))
        catalog_chapters.append({'book_id': book_id, 'volume': volume, 'title': chapter_title, 'part': part})
        metadata = normalize(' '.join((title, author, chapter_title, part)))
        for position, (original, translation) in enumerate(paired_lines(folder), 1):
            count += 1
            sentence_id = f'v{volume:04d}-{position:04d}'
            con.execute('INSERT INTO sentences VALUES(?,?,?,?,?,?,?,?,?,?)', (
                book_id, sentence_id, volume, position, 1, original, translation,
                normalize(original), normalize(translation), metadata,
            ))
    con.execute('UPDATE books SET translated_units=? WHERE id=?', (count, book_id))
    con.commit()
    if con.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or con.execute('PRAGMA foreign_key_check').fetchall():
        raise ValueError(f'Database integrity failure for {title}')
    con.close()
    temporary.replace(destination)
    print(f'{title}: {len(chapters)} chapters, {count} pairs, {destination.stat().st_size:,} bytes', flush=True)
    return {'id': book_id, 'title': title, 'author': author, 'volume_count': len(chapters), 'translated_units': count}, catalog_chapters

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('checkout', type=Path)
    parser.add_argument('--books', nargs='*', help='Limit a verification run to these source-folder names')
    arguments = parser.parse_args()
    source = arguments.checkout / '双语数据'
    if not source.is_dir():
        parser.error(f'{source} not found')
    conversion = json.loads((ROOT / 'public/data/fanjian.json').read_text())
    chars = {item['i']: item['o'] for item in conversion}
    traditional = {item['o']: item['i'] for item in conversion}
    OUTPUT.mkdir(parents=True, exist_ok=True)
    book_dirs = sorted(path for path in source.iterdir() if path.is_dir() and (not arguments.books or path.name in arguments.books))
    if arguments.books:
        missing = set(arguments.books) - {path.name for path in book_dirs}
        if missing:
            parser.error(f'Books not found: {", ".join(sorted(missing))}')
    elif len(book_dirs) != EXPECTED_BOOKS:
        parser.error(f'Expected {EXPECTED_BOOKS} books, found {len(book_dirs)} in {source}')
    books, chapters = [], []
    for book_dir in book_dirs:
        book, book_chapters = build_book(book_dir, chars, traditional)
        books.append(book)
        chapters.extend(book_chapters)
    total_pairs = sum(book['translated_units'] for book in books)
    if not arguments.books and total_pairs != EXPECTED_PAIRS:
        raise ValueError(f'Expected {EXPECTED_PAIRS} sentence pairs, found {total_pairs}; catalog was not replaced')
    manifest = {'source': 'NiuTrans/Classical-Modern', 'books': books, 'chapters': chapters}
    (OUTPUT / 'catalog.json').write_text(json.dumps(manifest, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    if not arguments.books:
        expected = {f'{book["id"]}.sqlite' for book in books}
        for stale in OUTPUT.glob('*.sqlite'):
            if stale.name not in expected:
                stale.unlink()
    print(f'Total: {len(books)} books, {total_pairs} sentence pairs', flush=True)

if __name__ == '__main__':
    main()
