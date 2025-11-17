import React, { useState } from 'react';

export default function SearchInterface({ onSearch, loading }) {
  const [q, setQ] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced search fields
  const [phoneticKey, setPhoneticKey] = useState('');
  const [pinyin, setPinyin] = useState('');
  const [rhymeBook, setRhymeBook] = useState('');
  const [pingze, setPingze] = useState('');
  const [rhyme, setRhyme] = useState('');
  const [form, setForm] = useState('');
  const [allusion, setAllusion] = useState('');
  const [mood, setMood] = useState('');

  const filters = [
    { key: 'rhymeBook', label: '正韻', value: rhymeBook, setter: setRhymeBook },
    { key: 'pingze', label: '平仄', value: pingze, setter: setPingze },
    { key: 'rhyme', label: '韻腳', value: rhyme, setter: setRhyme },
    { key: 'form', label: '詞形', value: form, setter: setForm }
  ];

  function handleFilterClick(filter) {
    if (activeFilter === filter.key) {
      setActiveFilter('');
      filter.setter('');
    } else {
      setActiveFilter(filter.key);
    }
  }

  function handleSearch() {
    const params = {
      q,
      phoneticKey,
      pinyin,
      rhymeBook,
      pingze,
      rhyme,
      form,
      allusion,
      mood
    };
    onSearch(params);
  }

  function handleKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  }

  return (
    <div>
      {/* Main Search Bar with Filter Pills */}
      <div className="filter-pills">
        {filters.map(filter => (
          <button
            key={filter.key}
            type="button"
            className={`filter-pill ${activeFilter === filter.key ? 'active' : ''}`}
            onClick={() => handleFilterClick(filter)}
          >
            {filter.label}
          </button>
        ))}
        
        <input
          type="text"
          className="search-input"
          placeholder="搜尋詩詞、音韻、拼音..."
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        
        <button
          type="button"
          className="adv-search-btn"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          Adv. 搜尋 ▽
        </button>
      </div>

      {/* Advanced Search Panel */}
      <div className={`advanced-search ${showAdvanced ? 'show' : ''}`}>
        <div className="advanced-inputs">
          <input
            type="text"
            className="advanced-input"
            placeholder="英語音韻 (!aa, !ab...)"
            value={phoneticKey}
            onChange={e => setPhoneticKey(e.target.value)}
          />
          <input
            type="text"
            className="advanced-input"
            placeholder="粵語拼音 (laai1...)"
            value={pinyin}
            onChange={e => setPinyin(e.target.value)}
          />
          {activeFilter && (
            <input
              type="text"
              className="advanced-input"
              placeholder={`輸入${filters.find(f => f.key === activeFilter)?.label}...`}
              value={filters.find(f => f.key === activeFilter)?.value || ''}
              onChange={e => filters.find(f => f.key === activeFilter)?.setter(e.target.value)}
            />
          )}
          <input
            type="text"
            className="advanced-input"
            placeholder="典故"
            value={allusion}
            onChange={e => setAllusion(e.target.value)}
          />
          <input
            type="text"
            className="advanced-input"
            placeholder="意境"
            value={mood}
            onChange={e => setMood(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#111100',
            color: '#feffc6',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? '搜尋中...' : '搜尋'}
        </button>
      </div>
    </div>
  );
}
