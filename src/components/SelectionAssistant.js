import React, { useCallback, useEffect, useRef, useState } from 'react';
import { dataManager } from '../services/DataManager.js';
import { translateEntryLive } from '../services/liveTranslation.js';
import { getPrimaryPronunciation } from '../utils/pronunciation.js';
import { getPreferredMeanings, getWordSearchRank, matchesWordSearch } from '../utils/search.js';
import './SelectionAssistant.css';

const ACTIONS = [
  ['search', 'selection.search', '⌕'],
  ['meaning', 'selection.meaning', '音'],
  ['copy', 'selection.copy', '複'],
  ['notes', 'selection.notes', '記'],
  ['translate', 'selection.translate', '譯']
];

function clampToolbarPosition(rect) {
  const toolbarWidth = Math.min(520, window.innerWidth - 24);
  const left = Math.min(
    Math.max(12, rect.left + rect.width / 2 - toolbarWidth / 2),
    window.innerWidth - toolbarWidth - 12
  );
  const top = rect.bottom + 10 > window.innerHeight - 90
    ? Math.max(12, rect.top - 72)
    : rect.bottom + 10;

  return {
    style: { left, top, width: toolbarWidth },
    panelPlacement: rect.bottom + 430 > window.innerHeight ? 'above' : 'below'
  };
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  textarea.remove();
  if (!copied) throw new Error('Copy failed');
}

function CharacterReadings({ text, pronunciations, t, convertText }) {
  const characters = Array.from(text).filter(character => /\p{L}/u.test(character));
  if (characters.length === 0) return null;

  return (
    <div className="selection-character-readings">
      {characters.map((character, index) => {
        const readings = pronunciations[character] || {};
        return (
          <div key={`${character}-${index}`}>
            <strong>{convertText(character)}</strong>
            <span>{t('selection.jyutping')}: {getPrimaryPronunciation(readings.j) || '—'}</span>
            <span>{t('selection.mandarin')}: {getPrimaryPronunciation(readings.p) || '—'}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SelectionAssistant({ scopeRef, t, convertText, source, onSaveReadingNote }) {
  const [selection, setSelection] = useState(null);
  const [activePanel, setActivePanel] = useState(null);
  const [query, setQuery] = useState('');
  const [wordResults, setWordResults] = useState([]);
  const [pronunciations, setPronunciations] = useState({});
  const [status, setStatus] = useState('idle');
  const [annotation, setAnnotation] = useState('');
  const [noteStatus, setNoteStatus] = useState('idle');
  const [translation, setTranslation] = useState('');
  const [translationStatus, setTranslationStatus] = useState('idle');
  const [translationTarget, setTranslationTarget] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [interactionsReady, setInteractionsReady] = useState(false);
  const selectionTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const interactionTimerRef = useRef(null);
  const assistantRef = useRef(null);
  const activePanelRef = useRef(null);
  const lastSelectionTextRef = useRef('');
  const lookupRequestRef = useRef(0);
  const translationRequestRef = useRef(0);

  const closeAssistant = useCallback(() => {
    activePanelRef.current = null;
    lastSelectionTextRef.current = '';
    lookupRequestRef.current += 1;
    translationRequestRef.current += 1;
    setActivePanel(null);
    setSelection(null);
  }, []);

  const openPanel = useCallback(panel => {
    activePanelRef.current = panel;
    setActivePanel(panel);
  }, []);

  const handleCopy = useCallback(async text => {
    try {
      await copyText(text);
      setFeedback(t('selection.copied'));
    } catch (error) {
      setFeedback(t('selection.copyFailed'));
    }
    window.clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = window.setTimeout(() => setFeedback(''), 1800);
  }, [t]);

  const runTranslation = useCallback(async (text, target) => {
    const requestId = translationRequestRef.current + 1;
    translationRequestRef.current = requestId;
    openPanel('translate');
    setTranslationTarget(target);
    setTranslation('');
    setTranslationStatus('loading');
    try {
      const translatedText = await translateEntryLive(text, target);
      if (translationRequestRef.current !== requestId) return;
      setTranslation(translatedText);
      setTranslationStatus('ready');
    } catch (error) {
      if (translationRequestRef.current === requestId) setTranslationStatus('error');
    }
  }, [openPanel]);

  const runWordLookup = useCallback(async (lookupQuery, panel) => {
    const normalizedQuery = lookupQuery.replace(/\s+/g, ' ').trim();
    if (!normalizedQuery) return;
    const requestId = lookupRequestRef.current + 1;
    lookupRequestRef.current = requestId;

    activePanelRef.current = panel;
    setActivePanel(panel);
    setQuery(normalizedQuery);
    setStatus('loading');
    try {
      const [words, readingIndex] = await Promise.all([
        dataManager.loadWordsData(),
        dataManager.loadCharacterPronunciations()
      ]);
      const variants = dataManager.generateSearchVariants(normalizedQuery.toLowerCase());
      const matches = words
        .filter(item => matchesWordSearch(item, variants, normalizedQuery))
        .sort((left, right) => (
          getWordSearchRank(right, variants, normalizedQuery) -
          getWordSearchRank(left, variants, normalizedQuery)
        ) || (right.score || 0) - (left.score || 0))
        .slice(0, panel === 'meaning' ? 1 : 8);
      if (lookupRequestRef.current !== requestId) return;
      setWordResults(matches);
      setPronunciations(readingIndex);
      setStatus('ready');
    } catch (error) {
      if (lookupRequestRef.current !== requestId) return;
      setWordResults([]);
      setPronunciations({});
      setStatus('error');
    }
  }, []);

  const captureSelection = useCallback(() => {
    const nativeSelection = window.getSelection();
    if (!nativeSelection || nativeSelection.isCollapsed || nativeSelection.rangeCount === 0) {
      if (!activePanelRef.current) setSelection(null);
      return;
    }

    const range = nativeSelection.getRangeAt(0);
    const commonNode = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement
      : range.commonAncestorContainer;
    const text = nativeSelection.toString().replace(/\s+/g, ' ').trim();
    if (!text || !scopeRef.current?.contains(commonNode)) {
      if (!activePanelRef.current) setSelection(null);
      return;
    }

    const rect = range.getBoundingClientRect();
    if (!rect.width && !rect.height) return;
    const nextText = text.slice(0, 600);
    const placement = clampToolbarPosition(rect);
    if (lastSelectionTextRef.current !== nextText) {
      lastSelectionTextRef.current = nextText;
      activePanelRef.current = null;
      lookupRequestRef.current += 1;
      translationRequestRef.current += 1;
      setActivePanel(null);
      setWordResults([]);
      setStatus('idle');
      setAnnotation('');
      setNoteStatus('idle');
      setTranslation('');
      setTranslationStatus('idle');
      setTranslationTarget(null);
      setInteractionsReady(false);
      window.clearTimeout(interactionTimerRef.current);
      interactionTimerRef.current = window.setTimeout(() => setInteractionsReady(true), 300);
    }
    setSelection({ text: nextText, position: placement.style, panelPlacement: placement.panelPlacement });
  }, [scopeRef]);

  useEffect(() => {
    const scheduleCapture = () => {
      window.clearTimeout(selectionTimerRef.current);
      selectionTimerRef.current = window.setTimeout(captureSelection, 120);
    };
    const closeOnEscape = event => {
      if (event.key === 'Escape') closeAssistant();
    };
    const closeOnViewportChange = event => {
      const scrolledElement = event.type === 'scroll' && event.target instanceof Element
        ? event.target
        : null;

      // The result reader can move independently underneath this fixed assistant,
      // so close it when the reader moves. Scrolling the assistant's own results is
      // intentional and must not dismiss or interrupt the panel.
      if (scrolledElement && assistantRef.current?.contains(scrolledElement)) return;
      closeAssistant();
    };

    document.addEventListener('selectionchange', scheduleCapture);
    document.addEventListener('pointerup', scheduleCapture);
    document.addEventListener('keyup', scheduleCapture);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnViewportChange);
    window.addEventListener('scroll', closeOnViewportChange, { capture: true, passive: true });
    return () => {
      window.clearTimeout(selectionTimerRef.current);
      window.clearTimeout(feedbackTimerRef.current);
      window.clearTimeout(interactionTimerRef.current);
      document.removeEventListener('selectionchange', scheduleCapture);
      document.removeEventListener('pointerup', scheduleCapture);
      document.removeEventListener('keyup', scheduleCapture);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
      window.removeEventListener('scroll', closeOnViewportChange, { capture: true });
    };
  }, [captureSelection, closeAssistant]);

  if (!selection) return null;

  return (
    <div
      ref={assistantRef}
      className="selection-assistant"
      role="toolbar"
      aria-label={t('selection.toolbar')}
      style={selection.position}
      data-panel-placement={selection.panelPlacement}
      onPointerDown={event => {
        if (event.target.closest('button')) event.preventDefault();
      }}
    >
      {ACTIONS.map(([action, labelKey, mark]) => (
        <button
          key={action}
          type="button"
          data-action={action}
          disabled={!interactionsReady}
          onClick={() => {
            if (action === 'search' || action === 'meaning') runWordLookup(selection.text, action);
            if (action === 'copy') handleCopy(selection.text);
            if (action === 'notes') {
              setAnnotation('');
              setNoteStatus('idle');
              openPanel('notes');
            }
            if (action === 'translate') {
              setTranslation('');
              setTranslationStatus('idle');
              setTranslationTarget(null);
              openPanel('translate');
            }
          }}
        >
          <span aria-hidden="true">{mark}</span>
          {t(labelKey)}
        </button>
      ))}

      {(activePanel === 'search' || activePanel === 'meaning') && (
        <section className="selection-assistant-panel" role="dialog" aria-label={activePanel === 'search' ? t('selection.search') : t('selection.meaning')} aria-live="polite">
          <div className="selection-assistant-panel-heading">
            <div>
              <small>{activePanel === 'search' ? t('selection.search') : t('selection.meaning')}</small>
              <strong>「{convertText(query)}」</strong>
            </div>
            <button type="button" onClick={closeAssistant} aria-label={t('selection.close')}>×</button>
          </div>

          {activePanel === 'search' && (
            <form
              className="selection-search-form"
              onSubmit={event => {
                event.preventDefault();
                runWordLookup(query, 'search');
              }}
            >
              <input
                value={query}
                onChange={event => setQuery(event.target.value)}
                aria-label={t('selection.searchInput')}
              />
              <button type="submit">{t('selection.search')}</button>
            </form>
          )}

          {status === 'loading' && <p className="selection-assistant-status">{t('selection.loading')}</p>}
          {status === 'error' && <p className="selection-assistant-status error">{t('selection.unavailable')}</p>}
          {status === 'ready' && wordResults.length === 0 && (
            <>
              <p className="selection-assistant-status">{t('selection.noDefinition')}</p>
              <CharacterReadings text={query} pronunciations={pronunciations} t={t} convertText={convertText} />
            </>
          )}
          {status === 'ready' && wordResults.length > 0 && (
            <div className="selection-word-results">
              {wordResults.map(item => (
                <article key={item.id}>
                  <strong>{convertText(item.text)}</strong>
                  <div>
                    {item.jyutPinyin && <span>{t('selection.jyutping')}: {item.jyutPinyin}</span>}
                    {item.mandarinPinyin && <span>{t('selection.mandarin')}: {item.mandarinPinyin}</span>}
                  </div>
                  {getPreferredMeanings(item)[0] && <p>{convertText(getPreferredMeanings(item)[0])}</p>}
                </article>
              ))}
              {activePanel === 'meaning' && (
                <CharacterReadings text={query} pronunciations={pronunciations} t={t} convertText={convertText} />
              )}
            </div>
          )}
        </section>
      )}

      {activePanel === 'notes' && (
        <section className="selection-assistant-panel" role="dialog" aria-label={t('notes.title')} aria-live="polite">
          <div className="selection-assistant-panel-heading">
            <div>
              <small>{t('notes.title')}</small>
              <strong>「{convertText(selection.text)}」</strong>
            </div>
            <button type="button" onClick={closeAssistant} aria-label={t('selection.close')}>×</button>
          </div>
          <label className="selection-note-field">
            <span>{t('selection.annotationLabel')}</span>
            <textarea
              value={annotation}
              onChange={event => setAnnotation(event.target.value)}
              placeholder={t('selection.annotationPlaceholder')}
              maxLength={4000}
            />
          </label>
          <div className="selection-panel-actions">
            <small>{t('selection.annotationOptional')}</small>
            <button
              type="button"
              disabled={noteStatus === 'saved'}
              onClick={() => {
                onSaveReadingNote?.({ text: selection.text, annotation, source });
                setNoteStatus('saved');
              }}
            >
              {noteStatus === 'saved' ? t('selection.noteSaved') : t('selection.saveNote')}
            </button>
          </div>
        </section>
      )}

      {activePanel === 'translate' && (
        <section className="selection-assistant-panel" role="dialog" aria-label={t('selection.translate')} aria-live="polite">
          <div className="selection-assistant-panel-heading">
            <div>
              <small>{t('selection.translate')}</small>
              <strong>「{convertText(selection.text)}」</strong>
            </div>
            <button type="button" onClick={closeAssistant} aria-label={t('selection.close')}>×</button>
          </div>
          <div className="selection-translation-targets" aria-label={t('selection.translationTarget')}>
            <button type="button" className={translationTarget === 'en' ? 'active' : ''} onClick={() => runTranslation(selection.text, 'en')}>English</button>
            <button type="button" className={translationTarget === 'it' ? 'active' : ''} onClick={() => runTranslation(selection.text, 'it')}>Italiano</button>
          </div>
          {translationStatus === 'idle' && <p className="selection-assistant-status">{t('selection.chooseLanguage')}</p>}
          {translationStatus === 'loading' && <p className="selection-assistant-status">{t('selection.translating')}</p>}
          {translationStatus === 'error' && <p className="selection-assistant-status error">{t('selection.translationUnavailable')}</p>}
          {translationStatus === 'ready' && <p className="selection-translation-result">{translation}</p>}
        </section>
      )}

      {feedback && <div className="selection-assistant-feedback" role="status">{feedback}</div>}
    </div>
  );
}
