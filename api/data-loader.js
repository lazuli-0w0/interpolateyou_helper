const fs = require('fs');
const path = require('path');

function loadData() {
  // Prefer a /data folder at project root (one level up from my-app)
  const candidate = path.resolve(__dirname, '..', 'data');
  const fallback = path.join(__dirname, 'sample-data.json');

  try {
    if (fs.existsSync(candidate)) {
      // load all .json files in that folder
      const files = fs.readdirSync(candidate).filter(f => f.endsWith('.json'));
      let merged = [];
      files.forEach(f => {
        const p = path.join(candidate, f);
        const content = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (f === 'eng_index.json') {
          // Handle eng_index.json structure: {"!aa": [["拉:laai1", 82], ...]}
          Object.keys(content).forEach(phoneticKey => {
            const entries = content[phoneticKey];
            entries.forEach(([textWithPinyin, score]) => {
              const [text, pinyin] = textWithPinyin.split(':');
              merged.push({
                id: `${phoneticKey}_${text}`,
                text: text,
                pinyin: pinyin || '',
                phoneticKey: phoneticKey,
                score: score || 0,
                source: 'eng_index'
              });
            });
          });
        } else if (Array.isArray(content)) {
          merged = merged.concat(content);
        } else {
          merged.push(content);
        }
      });
      console.log(`Loaded ${merged.length} items from ${candidate}`);
      return merged;
    }
  } catch (err) {
    console.error('Error loading data from /data:', err.message);
  }

  // fallback to bundled sample
  try {
    const sample = JSON.parse(fs.readFileSync(fallback, 'utf8'));
    console.log(`Loaded ${sample.length} items from bundled sample data`);
    return sample;
  } catch (err) {
    console.error('Failed to load sample data:', err.message);
    return [];
  }
}

module.exports = { loadData };
