const express = require('express');
const router = express.Router();

// Search supports: q (text), phoneticKey, pinyin, rhymeBook, pingze, rhyme, form, allusion, mood
router.get('/', (req, res) => {
  const data = req.appData || [];
  const {
    rhymeBook,
    pingze,
    rhyme,
    form,
    allusion,
    mood,
    q,
    phoneticKey,
    pinyin,
    page = 1,
    limit = 20
  } = req.query;

  function scoreItem(item) {
    let score = item.score || 0; // use original score as base
    
    // Phonetic and pinyin matching (high priority for this dataset)
    if (phoneticKey && item.phoneticKey === phoneticKey) score += 50;
    if (pinyin && item.pinyin && item.pinyin.includes(pinyin)) score += 40;
    
    // Traditional poetry fields
    if (rhymeBook && item.rhymeBook === rhymeBook) score += 30;
    if (pingze && item.pingze === pingze) score += 20;
    if (rhyme && item.rhyme === rhyme) score += 30;
    if (form && item.form === form) score += 15;
    if (allusion && Array.isArray(item.allusion) && item.allusion.includes(allusion)) score += 10;
    if (mood && Array.isArray(item.mood) && item.mood.includes(mood)) score += 8;
    
    // Text search
    if (q) {
      const qLower = q.toLowerCase();
      if ((item.text || '').toLowerCase().includes(qLower)) score += 25;
      if ((item.pinyin || '').toLowerCase().includes(qLower)) score += 20;
      if ((item.phoneticKey || '').toLowerCase().includes(qLower)) score += 15;
      if ((item.source || '').toLowerCase().includes(qLower)) score += 5;
    }
    return score;
  }

  // Filter items: if a filter param is provided, require match
  let filtered = data.filter(item => {
    // Phonetic filters
    if (phoneticKey && item.phoneticKey !== phoneticKey) return false;
    if (pinyin && item.pinyin && !item.pinyin.includes(pinyin)) return false;
    
    // Traditional poetry filters
    if (rhymeBook && item.rhymeBook !== rhymeBook) return false;
    if (pingze && item.pingze !== pingze) return false;
    if (rhyme && item.rhyme !== rhyme) return false;
    if (form && item.form !== form) return false;
    if (allusion && Array.isArray(item.allusion) && !item.allusion.includes(allusion)) return false;
    if (mood && Array.isArray(item.mood) && !item.mood.includes(mood)) return false;
    
    // Text search
    if (q) {
      const qLower = q.toLowerCase();
      const textMatch = (item.text || '').toLowerCase().includes(qLower);
      const pinyinMatch = (item.pinyin || '').toLowerCase().includes(qLower);
      const phoneticMatch = (item.phoneticKey || '').toLowerCase().includes(qLower);
      const sourceMatch = (item.source || '').toLowerCase().includes(qLower);
      if (!(textMatch || pinyinMatch || phoneticMatch || sourceMatch)) return false;
    }
    return true;
  });

  // Compute scores and sort by score desc
  const scored = filtered.map(item => ({ item, score: scoreItem(item) }));
  scored.sort((a, b) => b.score - a.score);

  const p = Math.max(1, parseInt(page, 10));
  const l = Math.max(1, parseInt(limit, 10));
  const start = (p - 1) * l;
  const pageItems = scored.slice(start, start + l).map(s => ({ ...s.item, _score: s.score }));

  res.json({ total: scored.length, page: p, limit: l, results: pageItems });
});

module.exports = router;
