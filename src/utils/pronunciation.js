export function formatQieyunForWord(word, readingsByCharacter) {
  if (!word || !readingsByCharacter) return '';

  const readings = Array.from(word).map(character => readingsByCharacter[character] || '');
  return readings.length > 0 && readings.every(Boolean) ? readings.join(' · ') : '';
}

export function getPrimaryPronunciation(reading) {
  return (reading || '').split(/[／/]/)[0].trim();
}
