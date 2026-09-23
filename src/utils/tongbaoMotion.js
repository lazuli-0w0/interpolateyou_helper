export const COIN_HOLD_DELAY_MS = 220;
export const COIN_ACCELERATION_MS = 1200;
export const COIN_SETTLE_MS = 500;
const START_SPEED = 0.24;
const MAX_SPEED = 2.16;

export function heldCoinMotion(elapsed) {
  const time = Math.max(0, elapsed);
  const t = Math.min(1, time / COIN_ACCELERATION_MS);
  const speed = START_SPEED + (MAX_SPEED - START_SPEED) * (3 * t * t - 2 * t * t * t);
  const rampDistance = START_SPEED * Math.min(time, COIN_ACCELERATION_MS)
    + (MAX_SPEED - START_SPEED) * COIN_ACCELERATION_MS * (t ** 3 - 0.5 * t ** 4);
  return { speed, angle: rampDistance + Math.max(0, time - COIN_ACCELERATION_MS) * MAX_SPEED };
}
