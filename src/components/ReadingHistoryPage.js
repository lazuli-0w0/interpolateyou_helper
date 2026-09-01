import React, { useMemo, useState } from 'react';
import { chineseConverter } from '../utils/ChineseConverter.js';
import './ReadingHistoryPage.css';

const TYPE_LABEL_KEYS = {
  words: 'tool.words.title',
  poetry: 'tool.poetry.title',
  novels: 'tool.novels.title',
  cipou: 'tool.cipou.title'
};

function getTitle(entry) {
  return entry.item.title || entry.item.name || entry.item.text || '';
}

function getMeta(entry) {
  return [entry.item.dynasty, entry.item.author, entry.item.work || entry.item.category]
    .filter(Boolean)
    .join(' · ');
}

export function ReadingHistoryPage({ history, locale, t, onOpen, onClear }) {
  const [openingId, setOpeningId] = useState(null);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }), [locale]);
  const convertText = text => {
    if (!text || locale !== 'zh-Hans' || !chineseConverter.isLoaded) return text;
    return chineseConverter.convertText(text, 'simplified');
  };
  const openEntry = async entry => {
    setOpeningId(entry.id);
    try {
      await onOpen(entry);
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <main className="reading-history-page">
      <div className="reading-history-orb" aria-hidden="true" />
      <div className="reading-history-inner">
        <header className="reading-history-header">
          <div>
            <p>{t('history.eyebrow')}</p>
            <h1>{t('history.title')}</h1>
            <span>{t('history.description')}</span>
          </div>
          <div className="reading-history-mark" aria-hidden="true">{t('history.mark')}</div>
        </header>

        {history.length === 0 ? (
          <section className="reading-history-empty">
            <div aria-hidden="true">{t('history.mark')}</div>
            <h2>{t('history.emptyTitle')}</h2>
            <p>{t('history.emptyDescription')}</p>
          </section>
        ) : (
          <section className="reading-history-content" aria-label={t('history.title')}>
            <div className="reading-history-toolbar">
              <p>{t('history.count', { count: history.length })}</p>
              <button type="button" onClick={onClear}>{t('history.clear')}</button>
            </div>
            <div className="reading-history-list">
              {history.map(entry => (
                <article className="reading-history-card" key={entry.id}>
                  <div className="reading-history-card-mark" aria-hidden="true">
                    {t(`tool.${entry.view === 'novels' ? 'novels' : entry.view}.mark`)}
                  </div>
                  <div className="reading-history-card-copy">
                    <div className="reading-history-card-label">{t(TYPE_LABEL_KEYS[entry.view])}</div>
                    <h2>{convertText(getTitle(entry))}</h2>
                    {getMeta(entry) && <p>{convertText(getMeta(entry))}</p>}
                    <time dateTime={entry.openedAt}>{dateFormatter.format(new Date(entry.openedAt))}</time>
                  </div>
                  <button
                    type="button"
                    onClick={() => openEntry(entry)}
                    disabled={openingId === entry.id}
                    aria-label={t('history.reopenNamed', { title: convertText(getTitle(entry)) })}
                  >
                    {openingId === entry.id ? t('history.opening') : t('history.reopen')}
                    <span aria-hidden="true">↗</span>
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
