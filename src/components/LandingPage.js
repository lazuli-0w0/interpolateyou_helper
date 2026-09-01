import React, { useEffect, useState } from 'react';
import {
  FEATURED_POEMS,
  getFeaturedPoemPresentation,
  pickFeaturedPoem,
  toFeaturedPoemEntry
} from '../data/featuredPoems.js';
import { convertContentForLocale } from '../i18n.js';
import './LandingPage.css';

const LAST_POEM_KEY = 'interpolateyou:last-featured-poem';

const MENU_ITEMS = [
  { type: 'words', iconKey: 'tool.words.mark', titleKey: 'tool.words.title', descriptionKey: 'tool.words.menuDescription', accent: 'jade' },
  { type: 'poetry', iconKey: 'tool.poetry.mark', titleKey: 'tool.poetry.title', descriptionKey: 'tool.poetry.menuDescription', accent: 'blue' },
  { type: 'novels', iconKey: 'tool.novels.mark', titleKey: 'tool.novels.title', descriptionKey: 'tool.novels.menuDescription', accent: 'amber' },
  { type: 'cipou', iconKey: 'tool.cipou.mark', titleKey: 'tool.cipou.title', descriptionKey: 'tool.cipou.menuDescription', accent: 'rose' }
];

function getPreviousPoemId() {
  try {
    return window.sessionStorage.getItem(LAST_POEM_KEY);
  } catch (error) {
    return null;
  }
}

export function LandingPage({ onNavigate, onOpenPoem, locale, t }) {
  const [poems, setPoems] = useState(FEATURED_POEMS);
  const [poem, setPoem] = useState(() => pickFeaturedPoem(getPreviousPoemId()));

  useEffect(() => {
    let cancelled = false;
    fetch('/data/literature/featured-poems.json')
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(items => {
        if (cancelled || !Array.isArray(items) || items.length === 0) return;
        const collection = items.map(item => {
          const lines = item.c.match(/[^。！？；]+[。！？；]?/g) || [item.c];
          return {
            id: `literature-${item.i}`,
            literatureId: item.i,
            title: item.t,
            author: item.a,
            dynasty: item.d,
            literatureKind: item.k,
            kindLabel: item.k === 'ci' ? '詞' : item.k === 'qu' ? '曲' : '詩',
            work: item.w,
            content: item.c,
            lines,
            weight: item.r || 1
          };
        });
        setPoems(collection);
        setPoem(current => pickFeaturedPoem(current.id, Math.random(), collection));
      })
      .catch(() => {
        // The bundled shortlist remains available when the extended list fails.
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(LAST_POEM_KEY, poem.id);
    } catch (error) {
      // The landing page still works when storage is unavailable.
    }
  }, [poem.id]);

  const showAnotherPoem = () => setPoem(current => pickFeaturedPoem(current.id, Math.random(), poems));
  const openPoem = () => onOpenPoem(toFeaturedPoemEntry(poem));
  const poemPresentation = getFeaturedPoemPresentation(poem);
  const localizeContent = (text) => convertContentForLocale(text, locale);

  return (
    <main className="landing-page">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <p className="landing-kicker">{t('landing.kicker')}</p>
          <h1 id="landing-title">{t('landing.titleLineOne')}<br />{t('landing.titleLineTwo')}</h1>
          <p className="landing-lead">{t('landing.lead')}</p>
          <div className="landing-actions">
            <button className="landing-primary" onClick={() => onNavigate('poetry')}>{t('landing.startPoetry')} <span>→</span></button>
            <button className="landing-secondary" onClick={showAnotherPoem}>{t('landing.anotherPoem')} <span aria-hidden="true">↻</span></button>
          </div>
        </div>

        <article className="featured-poem" aria-live="polite">
          <div className="featured-poem-topline">
            <span>{t('landing.featured')}</span>
            <span className="featured-poem-mark">{t('tool.poetry.mark')}</span>
          </div>
          <button className="featured-poem-open" type="button" onClick={openPoem} aria-label={t('landing.openPoem', { title: localizeContent(poem.title) })}>
            <div className="featured-poem-body">
              <p className="featured-poem-dynasty">{localizeContent(poem.dynasty)}</p>
              <h2>{localizeContent(poem.title)}</h2>
              <p className="featured-poem-author">{localizeContent(poem.author)}</p>
              <div className={`featured-poem-lines ${poemPresentation.density}`}>
                {poemPresentation.lines.map((line, index) => <p key={`${index}-${line}`}>{localizeContent(line)}</p>)}
              </div>
            </div>
          </button>
          <div className="featured-poem-footer">
            <span>{t('landing.featuredFooter')}</span>
            <div className="featured-poem-footer-actions">
              <button className="featured-poem-entry-button" onClick={openPoem}>{t('landing.openFull')} <span aria-hidden="true">↗</span></button>
              <button className="featured-poem-refresh" onClick={showAnotherPoem} aria-label={t('landing.showAnother')}>↻</button>
            </div>
          </div>
        </article>
      </section>

      <section className="landing-menu" aria-label={t('landing.menuLabel')}>
        <div className="landing-menu-heading">
          <span>{t('landing.menuTitle')}</span>
          <span>{t('landing.menuSubtitle')}</span>
        </div>
        <div className="landing-menu-grid">
          {MENU_ITEMS.map(item => (
            <button key={item.type} className={`landing-menu-card ${item.accent}`} onClick={() => onNavigate(item.type)}>
              <span className="landing-menu-icon">{t(item.iconKey)}</span>
              <span className="landing-menu-copy">
                <strong>{t(item.titleKey)}</strong>
                <small>{t(item.descriptionKey)}</small>
              </span>
              <span className="landing-menu-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
