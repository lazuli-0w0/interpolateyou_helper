import React from 'react';

export default function ResultsGrid({ results, loading }) {
  if (loading) {
    return null; // Loading handled in parent
  }
  
  if (!results || results.length === 0) {
    return (
      <div className="no-results">
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>🔍</div>
        <div>暫無搜尋結果</div>
        <div style={{ fontSize: '14px', marginTop: '8px', opacity: 0.7 }}>
          嘗試調整搜尋條件或使用不同關鍵字
        </div>
      </div>
    );
  }

  return (
    <div className="results-grid">
      {results.map(result => (
        <div key={result.id} className="result-card" title={`${result.text} - ${result.pinyin || ''} (${result._score || result.score})`}>
          <div className="result-text">{result.text}</div>
          {result.pinyin && (
            <div className="result-pinyin">{result.pinyin}</div>
          )}
          <div className="result-score">{result._score || result.score || 0}</div>
        </div>
      ))}
      
      {/* Fill empty cells to maintain grid structure */}
      {results.length > 0 && Array.from({ length: Math.max(0, 36 - (results.length % 36)) }, (_, i) => (
        <div key={`empty-${i}`} className="result-card" style={{ visibility: 'hidden' }}></div>
      ))}
    </div>
  );
}
