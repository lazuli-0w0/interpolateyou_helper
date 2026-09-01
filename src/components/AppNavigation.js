import React, { useEffect, useRef, useState } from 'react';
import './AppNavigation.css';

// Add another object here to create a new top-level tab with its own feature menu.
const NAV_TABS = [
  {
    id: 'tools',
    labelKey: 'nav.tools',
    eyebrowKey: 'nav.tools.eyebrow',
    titleKey: 'nav.tools.title',
    descriptionKey: 'nav.tools.description',
    features: [
      { view: 'words', markKey: 'tool.words.mark', labelKey: 'tool.words.title', descriptionKey: 'tool.words.menuDescription' },
      { view: 'poetry', markKey: 'tool.poetry.mark', labelKey: 'tool.poetry.title', descriptionKey: 'tool.poetry.menuDescription' },
      { view: 'novels', markKey: 'tool.novels.mark', labelKey: 'tool.novels.title', descriptionKey: 'tool.novels.menuDescription' },
      { view: 'cipou', markKey: 'tool.cipou.mark', labelKey: 'tool.cipou.title', descriptionKey: 'tool.cipou.menuDescription' }
    ]
  },
  {
    id: 'settings',
    labelKey: 'nav.settings',
    eyebrowKey: 'nav.settings.eyebrow',
    titleKey: 'nav.settings.title',
    descriptionKey: 'nav.settings.description',
    features: [
      { view: 'settings-language', markKey: 'settings.feature.mark', labelKey: 'settings.feature.label', descriptionKey: 'settings.feature.description' }
    ]
  },
  {
    id: 'founders-why',
    labelKey: 'nav.foundersWhy',
    view: 'founders-why'
  }
];

export function AppNavigation({ view, onViewChange, t }) {
  const [openTabId, setOpenTabId] = useState(null);
  const navigationRef = useRef(null);
  const activeTabId = NAV_TABS.find(tab =>
    tab.view === view || tab.features?.some(feature => feature.view === view)
  )?.id;
  const openTab = NAV_TABS.find(tab => tab.id === openTabId);

  useEffect(() => {
    const closeOnOutsideClick = (event) => {
      if (!navigationRef.current?.contains(event.target)) setOpenTabId(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setOpenTabId(null);
    };

    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  const navigateTo = (nextView) => {
    setOpenTabId(null);
    onViewChange(nextView);
  };

  return (
    <nav className="app-navigation" aria-label={t('nav.main')} ref={navigationRef}>
      <div className="app-navigation-inner">
        <button className={`app-brand ${view === 'home' ? 'active' : ''}`} onClick={() => navigateTo('home')}>
          <span className="app-brand-seal">{t('tool.poetry.mark')}</span>
          <span>
            <strong>{t('brand.name')}</strong>
            <small>INTERPOLATE YOU</small>
          </span>
        </button>

        <div className="app-navigation-tabs">
          {NAV_TABS.map(tab => (
            <button
              key={tab.id}
              className={activeTabId === tab.id || openTabId === tab.id ? 'active' : ''}
              type="button"
              aria-expanded={tab.features ? openTabId === tab.id : undefined}
              aria-controls={tab.features ? `navigation-menu-${tab.id}` : undefined}
              onClick={() => tab.view
                ? navigateTo(tab.view)
                : setOpenTabId(current => current === tab.id ? null : tab.id)}
            >
              {t(tab.labelKey)}
              {tab.features && <span className="app-navigation-chevron" aria-hidden="true">⌄</span>}
            </button>
          ))}
        </div>

        <a
          className="app-navigation-logo-link"
          href="https://linktr.ee/interpolateyou"
          target="_blank"
          rel="noreferrer"
          aria-label={t('nav.credentials')}
        >
          <img src="/logo-header.png" alt="Interpolate You Logo" className="app-navigation-logo" />
        </a>
      </div>

      {openTab && (
        <div className="app-navigation-menu" id={`navigation-menu-${openTab.id}`}>
          <div className="app-navigation-menu-intro">
            <p>{t(openTab.eyebrowKey)}</p>
            <h2>{t(openTab.titleKey)}</h2>
            <span>{t(openTab.descriptionKey)}</span>
          </div>
          <div className="app-navigation-feature-grid">
            {openTab.features.map(feature => (
              <button key={feature.view} type="button" onClick={() => navigateTo(feature.view)}>
                <span className="app-navigation-feature-mark" aria-hidden="true">{t(feature.markKey)}</span>
                <span className="app-navigation-feature-copy">
                  <strong>{t(feature.labelKey)}</strong>
                  <small>{t(feature.descriptionKey)}</small>
                </span>
                <span className="app-navigation-feature-arrow" aria-hidden="true">↗</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
