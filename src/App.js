import './App.css';
import React, { useState, useEffect } from 'react';
import SearchInterface from './components/SearchForm';
import ResultsGrid from './components/ResultList';
// For GitHub Pages - using sample data instead of API
import sampleData from './data/sample-eng-data.json';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);

  const [allData, setAllData] = useState([]);

  useEffect(() => {
    // Load sample data on component mount
    setAllData(sampleData || []);
  }, []);

  function handleSearch(params) {
    setLoading(true);
    setError(null);
    
    // Simulate API delay for better UX
    setTimeout(() => {
      try {
        let filtered = allData.filter(item => {
          // Text search
          if (params.q) {
            const qLower = params.q.toLowerCase();
            const textMatch = (item.text || '').toLowerCase().includes(qLower);
            const pinyinMatch = (item.pinyin || '').toLowerCase().includes(qLower);
            const phoneticMatch = (item.phoneticKey || '').toLowerCase().includes(qLower);
            if (!(textMatch || pinyinMatch || phoneticMatch)) return false;
          }
          
          // Filter conditions
          if (params.phoneticKey && item.phoneticKey !== params.phoneticKey) return false;
          if (params.pinyin && item.pinyin && !item.pinyin.includes(params.pinyin)) return false;
          if (params.rhymeBook && item.rhymeBook !== params.rhymeBook) return false;
          if (params.pingze && item.pingze !== params.pingze) return false;
          if (params.rhyme && item.rhyme !== params.rhyme) return false;
          if (params.form && item.form !== params.form) return false;
          
          return true;
        });
        
        // Score and sort results
        const scored = filtered.map(item => {
          let score = item.score || 0;
          if (params.phoneticKey && item.phoneticKey === params.phoneticKey) score += 50;
          if (params.pinyin && item.pinyin && item.pinyin.includes(params.pinyin)) score += 40;
          if (params.q) {
            const qLower = params.q.toLowerCase();
            if ((item.text || '').toLowerCase().includes(qLower)) score += 25;
            if ((item.pinyin || '').toLowerCase().includes(qLower)) score += 20;
          }
          return { ...item, _score: score };
        });
        
        scored.sort((a, b) => b._score - a._score);
        const results = scored.slice(0, 50); // Limit to 50 results for demo
        
        setResults(results);
        setTotalResults(scored.length);
      } catch (err) {
        setError('搜尋時發生錯誤');
        setResults([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1 className="brand-title">Interpolate You</h1>
      </header>

      <div className="main-content">
        <div className="search-container">
          <SearchInterface onSearch={handleSearch} loading={loading} />
          
          {error && <div className="error">{error}</div>}
          
          <div className="results-container">
            {loading && <div className="loading">搜尋中...</div>}
            {!loading && results.length > 0 && (
              <div style={{ marginBottom: '20px', color: '#7f8c8d', fontSize: '14px' }}>
                找到 {totalResults} 個結果
              </div>
            )}
            <ResultsGrid results={results} loading={loading} />
          </div>
        </div>

        <div className="sidebar">
          <div className="sidebar-panel">
            <div className="panel-title">典故</div>
            <div className="panel-item">...</div>
            <div className="panel-item">...</div>
            <div className="panel-item">...</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
