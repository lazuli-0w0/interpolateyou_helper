import React, { useEffect, useState } from 'react';
import {
  FEATURED_POEMS,
  getFeaturedPoemPresentation,
  pickFeaturedPoem,
  toFeaturedPoemEntry
} from '../data/featuredPoems.js';
import './LandingPage.css';

const LAST_POEM_KEY = 'interpolateyou:last-featured-poem';

const MENU_ITEMS = [
  { type: 'words', icon: '字', title: '詞語搜尋', description: '查字義、粵拼、普拼與反切', accent: 'jade' },
  { type: 'poetry', icon: '詩', title: '詩詞搜尋', description: '從題名、作者或詩句尋找全文', accent: 'blue' },
  { type: 'novels', icon: '卷', title: '小說閱讀', description: '翻閱古典小說與章回正文', accent: 'amber' },
  { type: 'cipou', icon: '韻', title: '詞牌搜尋', description: '探索詞牌、格律與例詞', accent: 'rose' }
];

function getPreviousPoemId() {
  try {
    return window.sessionStorage.getItem(LAST_POEM_KEY);
  } catch (error) {
    return null;
  }
}

export function LandingPage({ onNavigate, onOpenPoem }) {
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

  return (
    <main className="landing-page">
      <div className="landing-orb landing-orb-one" />
      <div className="landing-orb landing-orb-two" />

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-intro">
          <p className="landing-kicker">INTERPOLATE YOU · 古典中文資料庫</p>
          <h1 id="landing-title">在一句詩裡，<br />遇見下一個字。</h1>
          <p className="landing-lead">查詞、讀詩、翻小說，也沿著格律重新發現中文的聲音。</p>
          <div className="landing-actions">
            <button className="landing-primary" onClick={() => onNavigate('poetry')}>開始尋詩 <span>→</span></button>
            <button className="landing-secondary" onClick={showAnotherPoem}>換一首詩 <span aria-hidden="true">↻</span></button>
          </div>
        </div>

        <article className="featured-poem" aria-live="polite">
          <div className="featured-poem-topline">
            <span>本次詩選</span>
            <span className="featured-poem-mark">詩</span>
          </div>
          <button className="featured-poem-open" type="button" onClick={openPoem} aria-label={`查看《${poem.title}》全文`}>
            <div className="featured-poem-body">
              <p className="featured-poem-dynasty">{poem.dynasty}</p>
              <h2>{poem.title}</h2>
              <p className="featured-poem-author">{poem.author}</p>
              <div className={`featured-poem-lines ${poemPresentation.density}`}>
                {poemPresentation.lines.map((line, index) => <p key={`${index}-${line}`}>{line}</p>)}
              </div>
            </div>
          </button>
          <div className="featured-poem-footer">
            <span>從 500 首精選名篇中，遇見不同的詩</span>
            <div className="featured-poem-footer-actions">
              <button className="featured-poem-entry-button" onClick={openPoem}>查看全文 <span aria-hidden="true">↗</span></button>
              <button className="featured-poem-refresh" onClick={showAnotherPoem} aria-label="顯示另一首詩">↻</button>
            </div>
          </div>
        </article>
      </section>

      <section className="landing-menu" aria-label="功能選單">
        <div className="landing-menu-heading">
          <span>從哪裡開始？</span>
          <span>四種方式，走進古典中文</span>
        </div>
        <div className="landing-menu-grid">
          {MENU_ITEMS.map(item => (
            <button key={item.type} className={`landing-menu-card ${item.accent}`} onClick={() => onNavigate(item.type)}>
              <span className="landing-menu-icon">{item.icon}</span>
              <span className="landing-menu-copy">
                <strong>{item.title}</strong>
                <small>{item.description}</small>
              </span>
              <span className="landing-menu-arrow">↗</span>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}
