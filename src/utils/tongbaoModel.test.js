import { createTongbaoGeometry } from './tongbaoModel';

test('the reconstructed coin has relief, separate outward faces and an open square bore', () => {
  const sample = x => x > 0.3 ? [0.8, 0.7, 0.5] : [0.25, 0.2, 0.15];
  const front = createTongbaoGeometry(sample);
  const back = createTongbaoGeometry(sample, true);
  try {
    for (const [geometry, sign] of [[front, 1], [back, -1]]) {
      const position = geometry.getAttribute('position');
      const normal = geometry.getAttribute('normal');
      let minHeight = Infinity, maxHeight = -Infinity, nearestToBore = Infinity, normalZ = 0;
      for (let i = 0; i < position.count; i += 1) {
        const z = position.getZ(i) * sign;
        minHeight = Math.min(minHeight, z);
        maxHeight = Math.max(maxHeight, z);
        nearestToBore = Math.min(nearestToBore, Math.max(Math.abs(position.getX(i)), Math.abs(position.getY(i))));
        normalZ += normal.getZ(i) * sign;
      }
      expect(minHeight).toBeGreaterThan(0.05);
      expect(maxHeight - minHeight).toBeGreaterThan(0.03);
      expect(nearestToBore).toBeCloseTo(0.135, 5);
      expect(normalZ / normal.count).toBeGreaterThan(0.5);
    }
  } finally { front.dispose(); back.dispose(); }
});
