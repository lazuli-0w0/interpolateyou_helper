import React from 'react';
import { siteLinkUrl } from '../data/references.js';
import './ProductPage.css';

const READING_NOTES_PDF = siteLinkUrl('readingNotesPdf');

function PlayingCardsProduct({ t }) {
  return (
    <main className="product-page product-detail-page">
      <div className="product-page-orb product-page-orb-one" aria-hidden="true" />
      <div className="product-page-orb product-page-orb-two" aria-hidden="true" />

      <article className="product-detail-grid" aria-labelledby="playing-cards-title">
        <figure className="product-playing-card-figure">
          <img
            className="product-playing-card-image"
            src="/shijing-playing-cards.png"
            alt={t('product.cards.title')}
          />
        </figure>

        <div className="product-detail-copy">
          <p className="product-page-eyebrow">{t('product.cards.eyebrow')}</p>
          <h1 id="playing-cards-title">{t('product.cards.title')}</h1>

          <section className="product-creator-story" aria-labelledby="creator-why-title">
            <p className="product-creator-label" id="creator-why-title">{t('product.cards.creatorWhy')}</p>
            <p>{t('product.cards.storyOne')}</p>
            <p>{t('product.cards.storyTwo')}</p>
          </section>

          <footer className="product-purchase-row">
            <strong>{t('product.cards.price')}</strong>
          </footer>
        </div>
      </article>
    </main>
  );
}

function ReadingNotesProduct({ t }) {
  return (
    <main className="product-page product-document-page">
      <div className="product-page-orb product-page-orb-one" aria-hidden="true" />
      <div className="product-page-orb product-page-orb-two" aria-hidden="true" />

      <section className="product-document-shell" aria-labelledby="reading-notes-title">
        <header className="product-document-header">
          <div>
            <p className="product-page-eyebrow">{t('product.readingNotes.eyebrow')}</p>
            <h1 id="reading-notes-title">{t('product.readingNotes.title')}</h1>
          </div>
        </header>

        <object
          className="product-document-viewer"
          data={READING_NOTES_PDF}
          type="application/pdf"
          aria-label={t('product.readingNotes.viewerLabel')}
        >
          <p>{t('product.readingNotes.viewerFallback')}</p>
        </object>
      </section>
    </main>
  );
}

export function ProductPage({ product, t }) {
  if (product === 'cards') return <PlayingCardsProduct t={t} />;
  if (product === 'reading-notes') return <ReadingNotesProduct t={t} />;

  const keyPrefix = 'product.bookmark';

  return (
    <main className="product-page">
      <div className="product-page-orb product-page-orb-one" aria-hidden="true" />
      <div className="product-page-orb product-page-orb-two" aria-hidden="true" />

      <section className="product-page-inner" aria-labelledby="product-page-title">
        <p className="product-page-eyebrow">{t('product.page.eyebrow')}</p>
        <div className="product-page-placeholder">
          <span className="product-page-mark" aria-hidden="true">{t(`${keyPrefix}.mark`)}</span>
          <div>
            <small>{t('product.page.status')}</small>
            <h1 id="product-page-title">{t(`${keyPrefix}.title`)}</h1>
            <p>{t(`${keyPrefix}.placeholder`)}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
