import React, { useEffect, useMemo, useRef, useState } from 'react';
import { chineseConverter } from '../utils/ChineseConverter.js';
import './ReadingNotesPage.css';

export function ReadingNotesPage({ notes, locale, t, onOpen, onDelete }) {
  const [openingId, setOpeningId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const cancelDeleteRef = useRef(null);
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }), [locale]);
  const convertText = text => {
    if (!text || locale !== 'zh-Hans' || !chineseConverter.isLoaded) return text;
    return chineseConverter.convertText(text, 'simplified');
  };
  const getNoteTitle = note => (
    [note.source?.title, note.source?.author].filter(Boolean).join(' · ') || t('notes.savedSelection')
  );
  const openNote = async note => {
    setOpeningId(note.id);
    try {
      await onOpen?.(note);
    } finally {
      setOpeningId(null);
    }
  };

  useEffect(() => {
    if (!pendingDelete) return undefined;
    cancelDeleteRef.current?.focus();
    const closeOnEscape = event => {
      if (event.key === 'Escape') setPendingDelete(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [pendingDelete]);

  return (
    <main className="reading-notes-page">
      <div className="reading-notes-orb" aria-hidden="true" />
      <div className="reading-notes-inner">
        <header className="reading-notes-header">
          <div>
            <p>{t('notes.eyebrow')}</p>
            <h1>{t('notes.title')}</h1>
            <span>{t('notes.description')}</span>
          </div>
          <div className="reading-notes-mark" aria-hidden="true">{t('notes.mark')}</div>
        </header>

        {notes.length === 0 ? (
          <section className="reading-notes-empty">
            <div aria-hidden="true">{t('notes.mark')}</div>
            <h2>{t('notes.emptyTitle')}</h2>
            <p>{t('notes.emptyDescription')}</p>
          </section>
        ) : (
          <section className="reading-notes-list" aria-label={t('notes.title')}>
            {notes.map(note => (
              <article className="reading-note-card" key={note.id}>
                <div className="reading-note-card-topline">
                  <span>{convertText(getNoteTitle(note))}</span>
                  <time dateTime={note.createdAt}>{dateFormatter.format(new Date(note.createdAt))}</time>
                </div>
                <blockquote>「{convertText(note.text)}」</blockquote>
                {note.annotation && (
                  <div className="reading-note-annotation">
                    <small>{t('notes.annotation')}</small>
                    <p>{convertText(note.annotation)}</p>
                  </div>
                )}
                <button
                  className="reading-note-open"
                  type="button"
                  onClick={() => openNote(note)}
                  disabled={openingId === note.id}
                  aria-label={t('notes.openNamed', { title: convertText(getNoteTitle(note)) })}
                >
                  <span aria-hidden="true">{openingId === note.id ? '…' : '↗'}</span>
                </button>
                <button
                  className="reading-note-delete"
                  type="button"
                  onClick={() => setPendingDelete(note)}
                  aria-label={t('notes.deleteNamed', { title: convertText(getNoteTitle(note)) })}
                >
                  {t('notes.delete')}
                </button>
              </article>
            ))}
          </section>
        )}
      </div>

      {pendingDelete && (
        <div
          className="reading-note-confirm-backdrop"
          onPointerDown={event => {
            if (event.target === event.currentTarget) setPendingDelete(null);
          }}
        >
          <section
            className="reading-note-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reading-note-confirm-title"
            aria-describedby="reading-note-confirm-description"
          >
            <div className="reading-note-confirm-mark" aria-hidden="true">{t('notes.mark')}</div>
            <h2 id="reading-note-confirm-title">{t('notes.deleteConfirmTitle')}</h2>
            <p id="reading-note-confirm-description">{t('notes.deleteConfirmDescription')}</p>
            <blockquote>「{convertText(pendingDelete.text)}」</blockquote>
            <div className="reading-note-confirm-actions">
              <button ref={cancelDeleteRef} type="button" onClick={() => setPendingDelete(null)}>
                {t('notes.cancel')}
              </button>
              <button
                className="danger"
                type="button"
                onClick={() => {
                  onDelete(pendingDelete.id);
                  setPendingDelete(null);
                }}
              >
                {t('notes.confirmDelete')}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
