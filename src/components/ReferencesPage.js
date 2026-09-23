import React from 'react';
import { allReferences, referenceStats } from '../data/references.js';
import './SettingsPage.css';
import './ReferencesPage.css';

const GROUPS = ['words', 'literature', 'iching', 'services'];

function ReferenceItem({ reference, t }) {
  return <li className="references-item">
    <div>
      {reference.url
        ? <a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.title} <span aria-hidden="true">↗</span></a>
        : <strong>{reference.title}</strong>}
      <small>{t(reference.useKey)}</small>
    </div>
    {reference.local && <span className="references-local">{t('references.local')}</span>}
  </li>;
}

export function ReferencesPage({ t }) {
  const references = allReferences();
  const stats = referenceStats(references);

  return <main className="settings-page references-page">
    <div className="settings-page-orb settings-page-orb-one" aria-hidden="true" />
    <div className="settings-page-orb settings-page-orb-two" aria-hidden="true" />
    <div className="settings-page-inner">
      <header className="settings-page-header">
        <p>{t('references.eyebrow')}</p>
        <h1>{t('references.title')}</h1>
        <span>{t('references.intro')}</span>
      </header>

      <section className="settings-card" aria-labelledby="references-list-title">
        <div className="settings-card-heading">
          <span className="settings-card-mark" aria-hidden="true">引</span>
          <div>
            <p>{t('references.eyebrow')}</p>
            <h2 id="references-list-title">{t('references.heading')}</h2>
            <span>{t('references.catalogueNote')}</span>
          </div>
        </div>

        <div className="references-stats" aria-label={t('references.statsLabel')}>
          <div><strong>{stats.total}</strong><span>{t('references.total')}</span></div>
          <div><strong>{stats.linked}</strong><span>{t('references.linked')}</span></div>
          <div><strong>{stats.local}</strong><span>{t('references.localCount')}</span></div>
        </div>

        {GROUPS.map(group => <section className="references-group" key={group} aria-labelledby={`references-${group}`}>
          <h3 id={`references-${group}`}>{t(`references.group.${group}`)}</h3>
          <ul>{references.filter(reference => reference.group === group).map(reference =>
            <ReferenceItem key={reference.id} reference={reference} t={t} />)}</ul>
        </section>)}

      </section>
    </div>
  </main>;
}
