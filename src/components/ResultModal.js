import React, { useEffect, useRef, useState } from 'react';
import { dataManager } from '../services/DataManager.js';
import { getPrimaryPronunciation } from '../utils/pronunciation.js';
import { supportsLiveTranslation, translateEntryLive } from '../services/liveTranslation.js';
import { getPreferredMeanings, getSecondaryMeanings } from '../utils/search.js';
import { splitReadingParagraphs } from '../utils/readingFormat.js';
import { SelectionAssistant } from './SelectionAssistant.js';
import './ResultModal.css';

function ReadingFormatTabs({ mode, onChange, t }) {
  return (
    <div className="reading-format-toolbar">
      <span className="reading-format-label">{t('entry.readingLayout')}</span>
      <div className="reading-format-tabs" role="tablist" aria-label={t('entry.readingLayout')}>
        {[
          ['original', 'entry.original'],
          ['readable', 'entry.readable']
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? 'active' : ''}
            onClick={() => onChange(value)}
          >
            {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function PronunciationTabs({ mode, onChange, t, convertText, loading }) {
  return (
    <div className="pronunciation-toolbar">
      <span className="reading-format-label">{t('entry.pronunciation')}</span>
      <div className="pronunciation-tabs" role="tablist" aria-label={t('entry.pronunciation')}>
        {[
          ['none', 'entry.hidden'],
          ['jyutping', '粵拼'],
          ['mandarin', '普拼']
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? 'active' : ''}
            onClick={() => onChange(value)}
          >
            {label.startsWith('entry.') ? t(label) : convertText(label)}
          </button>
        ))}
      </div>
      {loading && <span className="pronunciation-loading" aria-live="polite">{t('entry.loading')}</span>}
    </div>
  );
}

function PronouncedPoetryLine({ line, pronunciationMode, pronunciations }) {
  const readingKey = pronunciationMode === 'jyutping' ? 'j' : 'p';

  return Array.from(line).map((character, index) => {
    const reading = getPrimaryPronunciation(pronunciations[character]?.[readingKey]);
    if (!reading) return <span key={`${index}-${character}`}>{character}</span>;

    return (
      <ruby className="poetry-ruby" key={`${index}-${character}`}>
        {character}<rt>{reading}</rt>
      </ruby>
    );
  });
}

function ReadingText({ content, kind, mode, convertText, pronunciationMode = 'none', pronunciations = {} }) {
  const convertedContent = convertText(content || '');

  if (kind === 'poetry' && pronunciationMode !== 'none') {
    const lines = mode === 'readable'
      ? splitReadingParagraphs(convertedContent, kind).flatMap(paragraph => paragraph)
      : convertedContent.split(/\n+/).filter(Boolean);

    return (
      <div className={`pronounced-poetry-text ${mode}`}>
        {lines.map((line, index) => (
          <div className="pronounced-poetry-line" key={`${index}-${line}`}>
            <PronouncedPoetryLine
              line={line}
              pronunciationMode={pronunciationMode}
              pronunciations={pronunciations}
            />
          </div>
        ))}
      </div>
    );
  }

  if (mode === 'original') return convertedContent;

  const paragraphs = splitReadingParagraphs(convertedContent, kind);
  if (kind === 'poetry') {
    return (
      <div className="formatted-poetry-text">
        {paragraphs.flatMap(paragraph => paragraph).map((line, index) => (
          <div className="formatted-poetry-line" key={`${index}-${line}`}>{line}</div>
        ))}
      </div>
    );
  }

  return (
    <div className="formatted-prose-text">
      {paragraphs.map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex}>
          {paragraph.map((sentence, sentenceIndex) => (
            <span className="formatted-prose-sentence" key={`${sentenceIndex}-${sentence}`}>
              {sentence}
            </span>
          ))}
        </p>
      ))}
    </div>
  );
}

function getEntryTranslationSource(item, type) {
  const entryType = item.type || type;
  const parts = [item.title || item.name || item.text];

  if (entryType === 'word') {
    parts.push(...(item.cantoneseMeanings || []), ...(item.meanings || []));
  } else if (entryType === 'cipou') {
    parts.push(...(item.variants || []).flatMap(variant => [variant.introduction, variant.example, variant.description]));
  } else {
    parts.push(item.intro, item.content);
  }

  return parts.filter(Boolean).join('\n\n');
}

function LiveTranslation({ source, locale, t }) {
  const [translation, setTranslation] = useState('');
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    let cancelled = false;
    if (!supportsLiveTranslation(locale) || !source) return undefined;

    setStatus('loading');
    setTranslation('');
    translateEntryLive(source, locale)
      .then(result => {
        if (!cancelled) {
          setTranslation(result);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, [source, locale]);

  if (!supportsLiveTranslation(locale)) return null;

  return (
    <section className="live-translation" aria-live="polite">
      <div className="live-translation-heading">
        <span>{t('translation.live')}</span>
        <small>{t('translation.note')}</small>
      </div>
      {status === 'loading' && <p className="live-translation-status">{t('translation.loading')}</p>}
      {status === 'ready' && <p className="live-translation-copy">{translation}</p>}
      {status === 'error' && <p className="live-translation-error">{t('translation.unavailable')}</p>}
    </section>
  );
}

export function ResultModal({
  selectedItem,
  type,
  locale,
  t,
  convertText,
  onClose,
  onLoadNovelChapter,
  onSaveReadingNote
}) {
  const contentRef = useRef(null);
  const [readingMode, setReadingMode] = useState('original');
  const [pronunciationMode, setPronunciationMode] = useState('none');
  const [pronunciations, setPronunciations] = useState({});
  const [pronunciationsLoading, setPronunciationsLoading] = useState(false);
  const selectedItemKey = selectedItem?.id || selectedItem?.title || null;
  const isPoetry = selectedItem?.type === 'poetry' || type === 'poetry';
  const translationSource = selectedItem ? getEntryTranslationSource(selectedItem, type) : '';

  useEffect(() => {
    setReadingMode('original');
    setPronunciationMode('none');
  }, [selectedItemKey]);

  useEffect(() => {
    let cancelled = false;
    if (!isPoetry || pronunciationMode === 'none') {
      setPronunciationsLoading(false);
      return undefined;
    }

    setPronunciationsLoading(true);
    dataManager.loadCharacterPronunciations().then(data => {
      if (!cancelled) {
        setPronunciations(data);
        setPronunciationsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isPoetry, pronunciationMode]);

  if (!selectedItem) return null;

  const setSelectedItem = value => {
    if (value === null) onClose();
  };
  const loadNovelChapter = onLoadNovelChapter;

  return (
    <>
      {/* 详情弹窗 - 懒加载详细信息 */}
      {selectedItem && (
        <div className="result-modal-backdrop" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className={`result-modal-panel ${selectedItem.type || type}`} style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: selectedItem.type === 'novel-book' || selectedItem.type === 'novel-chapter' ? '760px' : '500px',
            width: 'calc(100% - 40px)',
            maxHeight: '80vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              className="result-modal-close"
              onClick={() => setSelectedItem(null)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '15px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
            >
              ✕
            </button>

            <div className="result-modal-content" ref={contentRef}>
              {(selectedItem.type === 'poetry' || type === 'poetry') && (
                <div className="result-modal-section poetry-detail">
                  <h2 style={{ color: '#6890ff', marginBottom: '15px' }}>{convertText(selectedItem.title)}</h2>
                  <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
                    {[selectedItem.dynasty, selectedItem.author, selectedItem.work].filter(Boolean).map(convertText).join(' · ')}
                  </p>
                  <ReadingFormatTabs mode={readingMode} onChange={setReadingMode} t={t} />
                  <PronunciationTabs
                    mode={pronunciationMode}
                    onChange={setPronunciationMode}
                    t={t}
                    convertText={convertText}
                    loading={pronunciationsLoading}
                  />
                  <div className="poetry-body" style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    lineHeight: '1.8',
                    fontSize: '16px',
                    textAlign: 'center'
                  }}>
                    <ReadingText
                      content={selectedItem.content}
                      kind="poetry"
                      mode={readingMode}
                      convertText={convertText}
                      pronunciationMode={pronunciationMode}
                      pronunciations={pronunciations}
                    />
                  </div>
                  <p style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
                    {convertText('資料來源')}：<a href="https://github.com/chinese-poetry/chinese-poetry" target="_blank" rel="noreferrer" style={{ color: '#3f80ff' }}>chinese-poetry</a>
                  </p>
                </div>
              )}

              {selectedItem.type === 'novel-book' && (
                <div className="result-modal-section novel-detail">
                  <h2 style={{ color: '#8a5a2b', marginBottom: '8px' }}>{convertText(selectedItem.title)}</h2>
                  <p style={{ color: '#7f8c8d' }}>{[selectedItem.dynasty, selectedItem.author, selectedItem.category].filter(Boolean).map(convertText).join(' · ')}</p>
                  {selectedItem.intro && (
                    <>
                      <ReadingFormatTabs mode={readingMode} onChange={setReadingMode} t={t} />
                      <div className="novel-intro" style={{ background: '#fffaf2', padding: '14px', borderRadius: '8px', lineHeight: 1.7, color: '#555' }}>
                        <ReadingText content={selectedItem.intro} kind="prose" mode={readingMode} convertText={convertText} />
                      </div>
                    </>
                  )}
                  <h3 style={{ color: '#8a5a2b', marginTop: '22px' }}>{convertText('章回目錄')}</h3>
                  <div className="novel-chapter-list" style={{ display: 'grid', gap: '8px' }}>
                    {selectedItem.chapters.map((chapter, index) => (
                      <button className="novel-chapter-button" key={chapter.id} onClick={() => loadNovelChapter(chapter.id)} style={{ textAlign: 'left', border: '1px solid #ead8bd', background: '#fff', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', color: '#5f4528' }}>
                        {index + 1}. {convertText(chapter.title)}
                      </button>
                    ))}
                  </div>
                  <p style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
                    {convertText('資料來源')}：<a href="https://github.com/luoxuhai/chinese-novel" target="_blank" rel="noreferrer" style={{ color: '#8a5a2b' }}>chinese-novel</a>
                  </p>
                </div>
              )}

              {selectedItem.type === 'novel-chapter' && (
                <div className="result-modal-section novel-detail novel-reader">
                  <div style={{ color: '#8a5a2b', fontWeight: 'bold', marginBottom: '8px' }}>{convertText(selectedItem.work)}</div>
                  <h2 style={{ color: '#5f4528', marginBottom: '8px' }}>{convertText(selectedItem.title)}</h2>
                  <p style={{ color: '#7f8c8d' }}>{[selectedItem.dynasty, selectedItem.author, selectedItem.category].filter(Boolean).map(convertText).join(' · ')}</p>
                  <ReadingFormatTabs mode={readingMode} onChange={setReadingMode} t={t} />
                  <article className="novel-reading-paper" style={{ background: '#fffaf2', padding: '22px', borderRadius: '8px', lineHeight: 2, fontSize: '17px', color: '#332a20', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
                    <ReadingText content={selectedItem.content} kind="prose" mode={readingMode} convertText={convertText} />
                  </article>
                  <p style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
                    {convertText('資料來源')}：<a href="https://github.com/luoxuhai/chinese-novel" target="_blank" rel="noreferrer" style={{ color: '#8a5a2b' }}>chinese-novel</a>
                  </p>
                </div>
              )}

              {(selectedItem.type === 'word' || type === 'words') && (
                <div className="result-modal-section word-detail">
                  <h2 style={{ color: '#3faaff', marginBottom: '15px' }}>{convertText(selectedItem.text)}</h2>
                  {(selectedItem.jyutPinyin || selectedItem.mandarinPinyin || selectedItem.qieyunPinyin) && (
                    <div className="modal-pronunciations" style={{ fontSize: '18px', marginTop: '20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'baseline' }}>
                      {selectedItem.jyutPinyin && (
                        <span><strong>{convertText('粵拼')}：</strong><span style={{ color: '#e67e22', fontWeight: 'bold', fontSize: '20px' }}>{selectedItem.jyutPinyin}</span></span>
                      )}
                      {selectedItem.mandarinPinyin && (
                        <span><strong>{convertText('普拼')}：</strong><span style={{ color: '#2471a3', fontWeight: 'bold', fontSize: '20px' }}>{selectedItem.mandarinPinyin}</span></span>
                      )}
                      {selectedItem.qieyunPinyin && (
                        <span><strong>{convertText('切韻')}：</strong><span style={{ color: '#7d3c98', fontWeight: 'bold', fontSize: '20px' }}>{selectedItem.qieyunPinyin}</span></span>
                      )}
                    </div>
                  )}
                  {!selectedItem.jyutPinyin && (
                    <p style={{ color: '#95a5a6', fontStyle: 'italic' }}>{convertText('此詞語暫無粵拼資料')}</p>
                  )}
                  {Array.isArray(selectedItem.cantoneseMeanings) && selectedItem.cantoneseMeanings.length > 0 && (
                    <div className="meaning-block cantonese" style={{ marginTop: '22px' }}>
                      <h3 style={{ color: '#0b6b53', marginBottom: '10px' }}>{convertText('粵語典籍釋義')}</h3>
                      <ol style={{ paddingLeft: '24px', lineHeight: '1.75', color: '#444' }}>
                        {selectedItem.cantoneseMeanings.map((meaning, index) => (
                          <li key={index} style={{ marginBottom: '8px' }}>{convertText(meaning)}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {((selectedItem.cantoneseMeanings || []).length > 0
                    ? getSecondaryMeanings(selectedItem)
                    : (selectedItem.meanings || [])
                  ).length > 0 && (
                    <div className="meaning-block mandarin" style={{ marginTop: '22px' }}>
                      <h3 style={{ color: '#333', marginBottom: '10px' }}>
                        {convertText('教育部辭典釋義')}
                      </h3>
                      <ol style={{ paddingLeft: '24px', lineHeight: '1.75', color: '#444' }}>
                        {((selectedItem.cantoneseMeanings || []).length > 0
                          ? getSecondaryMeanings(selectedItem)
                          : (selectedItem.meanings || [])
                        ).map((meaning, index) => (
                          <li key={index} style={{ marginBottom: '8px' }}>{convertText(meaning)}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {getPreferredMeanings(selectedItem).length > 0 ? (
                    <p style={{ marginTop: '18px', fontSize: '12px', color: '#888' }}>
                      {convertText('資料來源')}：{' '}
                      {selectedItem.hasCantoneseBooksData && (
                        <a
                          href="https://github.com/jyutnet/cantonese-books-data"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#0b6b53', marginRight: '10px' }}
                        >
                          {convertText('《粵音資料集叢》典籍資料')}
                        </a>
                      )}
                      {Array.isArray(selectedItem.meanings) && selectedItem.meanings.length > 0 && (
                        <a
                          href="https://github.com/g0v/moedict-data"
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: '#3f80ff' }}
                        >
                          {convertText('教育部《重編國語辭典修訂本》資料')}
                        </a>
                      )}
                    </p>
                  ) : (
                    <p style={{ color: '#95a5a6', fontStyle: 'italic', marginTop: '20px' }}>
                      {convertText('此詞語在現有典籍及辭典資料中暫無釋義')}
                    </p>
                  )}
                </div>
              )}

              {(selectedItem.type === 'cipou' || type === 'cipou') && (
                <div className="result-modal-section cipou-detail">
                  <h2 style={{ color: '#ffcc7b', marginBottom: '15px' }}>{convertText(selectedItem.name)}</h2>

                  {selectedItem.variants && selectedItem.variants.map((variant, index) => (
                    <div className={`cipou-variant ${variant.isMain ? 'main' : ''}`} key={index} style={{
                      background: variant.isMain ? '#fff9e6' : '#f8f9fa',
                      padding: '15px',
                      borderRadius: '8px',
                      margin: '10px 0',
                      border: variant.isMain ? '2px solid #fff500' : '1px solid #e0e0e0'
                    }}>
                      <div className="cipou-variant-heading">
                        <h4 className="cipou-variant-author">
                          {convertText(variant.author)} {variant.isMain && <span className="cipou-main-badge">★ {convertText('主譜')}</span>}
                        </h4>
                        <span className="cipou-variant-size">
                          {variant.size}{convertText('字')}
                        </span>
                      </div>

                      <p className="cipou-variant-intro">
                        {convertText(variant.introduction)}
                      </p>

                      {/* 平仄譜 */}
                      <div style={{ marginBottom: '15px' }}>
                        <strong className="cipou-section-label">{convertText('平仄譜')}：</strong>

                        {/* 圖例說明 */}
                        <div className="cipou-legend">
                          <span style={{ color: '#2196F3' }}>■ {convertText('平聲')}</span>{' '}
                          <span style={{ color: '#FF5722' }}>■ {convertText('仄聲')}</span>{' '}
                          <span style={{ color: '#9C27B0' }}>■ {convertText('中(原聲為平)')}</span>{' '}
                          <span style={{ color: '#E91E63' }}>■ {convertText('中(原聲為仄)')}</span>{' '}
                          <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>■ {convertText('押韻')}</span>
                        </div>

                        <div className="tone-pattern" style={{
                          background: '#f0f0f0',
                          padding: '10px',
                          borderRadius: '4px',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                          marginTop: '5px',
                          lineHeight: '1.6'
                        }}>
                          {variant.content.split('|').map((line, i) => (
                            <div key={i} style={{ margin: '5px 0' }}>
                              {line.split('').map((char, j) => {
                                if (char === '0') return <span key={j} style={{ color: '#2196F3' }}>{convertText('平')}</span>;
                                if (char === '1') return <span key={j} style={{ color: '#FF5722' }}>{convertText('仄')}</span>;
                                if (char === '2') return <span key={j} style={{ color: '#9C27B0' }}>{convertText('中')}</span>;
                                if (char === '3') return <span key={j} style={{ color: '#E91E63' }}>{convertText('中')}</span>;
                                if (char === 'a' || char === 'A') return <span key={j} style={{ color: '#4CAF50', fontWeight: 'bold' }}>{convertText('押')}</span>;
                                return <span key={j}>{char}</span>;
                              })}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 原譜例詞 */}
                      <div style={{ marginBottom: '15px' }}>
                        <strong className="cipou-section-label">{convertText('原譜例詞')}：</strong>
                        <div className="cipou-example" style={{
                          background: '#f8f9fa',
                          padding: '15px',
                          borderRadius: '4px',
                          fontSize: '16px',
                          lineHeight: '1.8',
                          marginTop: '5px',
                          textAlign: 'center',
                          color: '#333'
                        }}>
                          {variant.example.split('|').map((line, i) => (
                            <div key={i} style={{ margin: '5px 0' }}>{convertText(line)}</div>
                          ))}
                        </div>
                      </div>

                      {/* 說明 */}
                      {variant.description && (
                        <div>
                          <strong className="cipou-section-label">{convertText('說明')}：</strong>
                          <p className="cipou-description">
                            {convertText(variant.description)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedItem.score && (
                    <p className="cipou-score">
                      <strong>{convertText('搜尋評分')}：</strong> {selectedItem.score}{convertText('分')}
                    </p>
                  )}
                </div>
              )}
              <LiveTranslation source={translationSource} locale={locale} t={t} />
            </div>
            <SelectionAssistant
              scopeRef={contentRef}
              t={t}
              convertText={convertText}
              source={selectedItem}
              onSaveReadingNote={onSaveReadingNote}
            />
          </div>
        </div>
      )}
    </>
  );
}
