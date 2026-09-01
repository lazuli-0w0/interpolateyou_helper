import React, { useEffect, useState } from 'react';
import { getPreferredMeanings, getSecondaryMeanings } from '../utils/search.js';
import { splitReadingParagraphs } from '../utils/readingFormat.js';
import './ResultModal.css';

function ReadingFormatTabs({ mode, onChange, convertText }) {
  return (
    <div className="reading-format-toolbar">
      <span className="reading-format-label">{convertText('閱讀排版')}</span>
      <div className="reading-format-tabs" role="tablist" aria-label={convertText('正文排版')}>
        {[
          ['original', '原文'],
          ['readable', '易讀']
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            className={mode === value ? 'active' : ''}
            onClick={() => onChange(value)}
          >
            {convertText(label)}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReadingText({ content, kind, mode, convertText }) {
  const convertedContent = convertText(content || '');
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

export function ResultModal({
  selectedItem,
  type,
  convertText,
  onClose,
  onLoadNovelChapter
}) {
  const [readingMode, setReadingMode] = useState('original');
  const selectedItemKey = selectedItem?.id || selectedItem?.title || null;

  useEffect(() => {
    setReadingMode('original');
  }, [selectedItemKey]);

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

            <div className="result-modal-content">
              {(selectedItem.type === 'poetry' || type === 'poetry') && (
                <div className="result-modal-section poetry-detail">
                  <h2 style={{ color: '#6890ff', marginBottom: '15px' }}>{convertText(selectedItem.title)}</h2>
                  <p style={{ color: '#7f8c8d', marginBottom: '15px' }}>
                    {[selectedItem.dynasty, selectedItem.author, selectedItem.work].filter(Boolean).map(convertText).join(' · ')}
                  </p>
                  <ReadingFormatTabs mode={readingMode} onChange={setReadingMode} convertText={convertText} />
                  <div className="poetry-body" style={{
                    background: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '8px',
                    lineHeight: '1.8',
                    fontSize: '16px',
                    textAlign: 'center'
                  }}>
                    <ReadingText content={selectedItem.content} kind="poetry" mode={readingMode} convertText={convertText} />
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
                      <ReadingFormatTabs mode={readingMode} onChange={setReadingMode} convertText={convertText} />
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
                  <ReadingFormatTabs mode={readingMode} onChange={setReadingMode} convertText={convertText} />
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ color: '#111100', margin: 0 }}>
                          {convertText(variant.author)} {variant.isMain && <span style={{ color: '#ff6600' }}>★ {convertText('主譜')}</span>}
                        </h4>
                        <span style={{ fontSize: '14px', color: '#666' }}>
                          {variant.size}{convertText('字')}
                        </span>
                      </div>

                      <p style={{ color: '#666', marginBottom: '10px', fontSize: '14px' }}>
                        {convertText(variant.introduction)}
                      </p>

                      {/* 平仄譜 */}
                      <div style={{ marginBottom: '15px' }}>
                        <strong style={{ color: '#111100' }}>{convertText('平仄譜')}：</strong>

                        {/* 圖例說明 */}
                        <div style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>
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
                        <strong style={{ color: '#111100' }}>{convertText('原譜例詞')}：</strong>
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
                          <strong style={{ color: '#111100' }}>{convertText('說明')}：</strong>
                          <p style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                            {convertText(variant.description)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}

                  {selectedItem.score && (
                    <p style={{ marginTop: '15px', color: '#666' }}>
                      <strong>{convertText('搜尋評分')}：</strong> {selectedItem.score}{convertText('分')}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
