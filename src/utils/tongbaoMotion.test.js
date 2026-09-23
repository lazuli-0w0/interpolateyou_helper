import { COIN_ACCELERATION_MS, heldCoinMotion } from './tongbaoMotion';

test('a held coin accelerates smoothly to a capped speed and keeps turning at that speed', () => {
  const start = heldCoinMotion(0);
  const middle = heldCoinMotion(COIN_ACCELERATION_MS / 2);
  const maximum = heldCoinMotion(COIN_ACCELERATION_MS);
  const later = heldCoinMotion(COIN_ACCELERATION_MS + 1000);
  expect(start.angle).toBe(0);
  expect(middle.speed).toBeGreaterThan(start.speed);
  expect(maximum.speed).toBeGreaterThan(middle.speed);
  expect(later.speed).toBe(maximum.speed);
  expect(later.angle - maximum.angle).toBeCloseTo(maximum.speed * 1000);
});
