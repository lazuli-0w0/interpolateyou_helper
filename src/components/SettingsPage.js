import React from 'react';
import { LOCALE_OPTIONS } from '../i18n.js';
import './SettingsPage.css';

export function SettingsPage({ locale, onLocaleChange, t }) {
  return (
    <main className="settings-page">
      <div className="settings-page-orb settings-page-orb-one" aria-hidden="true" />
      <div className="settings-page-orb settings-page-orb-two" aria-hidden="true" />

      <div className="settings-page-inner">
        <header className="settings-page-header">
          <p>{t('settings.page.eyebrow')}</p>
          <h1>{t('settings.page.title')}</h1>
          <span>{t('settings.page.intro')}</span>
        </header>

        <section className="settings-card" aria-labelledby="language-setting-title">
          <div className="settings-card-heading">
            <span className="settings-card-mark" aria-hidden="true">{t('settings.feature.mark')}</span>
            <div>
              <p>{t('settings.language.eyebrow')}</p>
              <h2 id="language-setting-title">{t('settings.language.title')}</h2>
              <span>{t('settings.language.description')}</span>
            </div>
          </div>

          <ul className="settings-language-list" role="radiogroup" aria-label={t('settings.language.groupLabel')}>
            {LOCALE_OPTIONS.map(option => {
              const selected = locale === option.value;
              return (
                <li key={option.value}>
                  <button
                    className={selected ? 'selected' : ''}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => onLocaleChange(option.value)}
                  >
                    <span className="settings-language-mark" aria-hidden="true">{option.mark}</span>
                    <span className="settings-language-copy">
                      <strong>{option.label}</strong>
                      <small>{option.secondaryLabel}</small>
                      <span>{t(option.descriptionKey)}</span>
                    </span>
                    <span className="settings-language-check" aria-hidden="true">{selected ? '✓' : ''}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
