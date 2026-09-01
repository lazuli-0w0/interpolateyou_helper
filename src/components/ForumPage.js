import React from 'react';
import './ForumPage.css';

export function ForumPage({ t }) {
  return (
    <main className="forum-page">
      <div className="forum-page-orb forum-page-orb-one" aria-hidden="true" />
      <div className="forum-page-orb forum-page-orb-two" aria-hidden="true" />

      <section className="forum-page-inner" aria-labelledby="forum-page-title">
        <p>{t('forum.eyebrow')}</p>
        <h1 id="forum-page-title">{t('forum.title')}</h1>
        <div className="forum-page-placeholder">{t('forum.placeholder')}</div>
      </section>
    </main>
  );
}
