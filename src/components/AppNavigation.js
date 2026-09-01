import React from 'react';
import './AppNavigation.css';

const NAV_ITEMS = [
  { type: 'words', label: '詞語' },
  { type: 'poetry', label: '詩詞' },
  { type: 'novels', label: '小說' },
  { type: 'cipou', label: '詞牌' }
];

export function AppNavigation({ view, onViewChange }) {
  return (
    <nav className="app-navigation" aria-label="主選單">
      <div className="app-navigation-inner">
        <button className={`app-brand ${view === 'home' ? 'active' : ''}`} onClick={() => onViewChange('home')}>
          <span className="app-brand-seal">詩</span>
          <span>
            <strong>詩詞搜尋</strong>
            <small>INTERPOLATE YOU</small>
          </span>
        </button>

        <div className="app-navigation-links">
          {NAV_ITEMS.map(({ type, label }) => (
            <button
              key={type}
              className={view === type ? 'active' : ''}
              onClick={() => onViewChange(type)}
            >
              {label}
            </button>
          ))}
        </div>

        <img src="/logo-header.png" alt="Interpolate You Logo" className="app-navigation-logo" />
      </div>
    </nav>
  );
}
