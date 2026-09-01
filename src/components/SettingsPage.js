import React from 'react';
import { LOCALE_OPTIONS } from '../i18n.js';
import './SettingsPage.css';

const THEME_OPTIONS = [
  {
    value: 'light',
    mark: '曦',
    labelKey: 'settings.theme.light.label',
    secondaryLabelKey: 'settings.theme.light.secondaryLabel',
    descriptionKey: 'settings.theme.light.description'
  },
  {
    value: 'dark',
    mark: '晦',
    labelKey: 'settings.theme.dark.label',
    secondaryLabelKey: 'settings.theme.dark.secondaryLabel',
    descriptionKey: 'settings.theme.dark.description'
  }
];

export function SettingsPage({ section = 'language', locale, onLocaleChange, theme, onThemeChange, t }) {
  const isAppearance = section === 'appearance';
  const options = isAppearance ? THEME_OPTIONS : LOCALE_OPTIONS;
  const selectedValue = isAppearance ? theme : locale;
  const updateValue = isAppearance ? onThemeChange : onLocaleChange;
  const settingPrefix = isAppearance ? 'settings.appearance' : 'settings.language';
  const markKey = isAppearance ? 'settings.appearance.mark' : 'settings.feature.mark';

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

        <section className="settings-card" aria-labelledby={`${section}-setting-title`}>
          <div className="settings-card-heading">
            <span className="settings-card-mark" aria-hidden="true">{t(markKey)}</span>
            <div>
              <p>{t(`${settingPrefix}.eyebrow`)}</p>
              <h2 id={`${section}-setting-title`}>{t(`${settingPrefix}.title`)}</h2>
              <span>{t(`${settingPrefix}.description`)}</span>
            </div>
          </div>

          <ul className="settings-option-list" role="radiogroup" aria-label={t(`${settingPrefix}.groupLabel`)}>
            {options.map(option => {
              const selected = selectedValue === option.value;
              return (
                <li key={option.value}>
                  <button
                    className={selected ? 'selected' : ''}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => updateValue(option.value)}
                  >
                    <span className="settings-option-mark" aria-hidden="true">{option.mark}</span>
                    <span className="settings-option-copy">
                      <strong>{option.labelKey ? t(option.labelKey) : option.label}</strong>
                      <small>{option.secondaryLabelKey ? t(option.secondaryLabelKey) : option.secondaryLabel}</small>
                      <span>{t(option.descriptionKey)}</span>
                    </span>
                    <span className="settings-option-check" aria-hidden="true">{selected ? '✓' : ''}</span>
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
