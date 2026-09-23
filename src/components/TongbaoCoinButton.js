import React, { useCallback, useEffect, useRef, useState } from 'react';
import { TongbaoCoin3D } from './TongbaoCoin3D.js';
import { COIN_ACCELERATION_MS, COIN_HOLD_DELAY_MS, COIN_SETTLE_MS } from '../utils/tongbaoMotion.js';

export function TongbaoCoinButton({ angle, duration, id, resetKey, onFlip, onRandom, onHoldingChange, randomizing, children, disabled, ...buttonProps }) {
  const [holding, setHolding] = useState(false);
  const [charged, setCharged] = useState(false);
  const [settling, setSettling] = useState(false);
  const [randomOutcome, setRandomOutcome] = useState(false);
  const [landed, setLanded] = useState(false);
  const press = useRef(null);
  const settleTimer = useRef(null);
  const landingTimer = useRef(null);
  const previousRandomizing = useRef(false);
  const suppressClick = useRef(false);
  const callbacks = useRef({ onFlip, onRandom, onHoldingChange });
  callbacks.current = { onFlip, onRandom, onHoldingChange };

  const showLanding = useCallback(() => {
    clearTimeout(landingTimer.current);
    setLanded(true);
    landingTimer.current = setTimeout(() => setLanded(false), 450);
  }, []);

  const finish = useCallback((commit = false) => {
    const active = press.current;
    if (!active) return;
    clearTimeout(active.timer);
    clearTimeout(active.chargeTimer);
    press.current = null;
    if (active.holding) {
      suppressClick.current = true;
      setHolding(false);
      setCharged(false);
      if (commit) {
        setSettling(true);
        setRandomOutcome(active.charged);
        if (active.charged) callbacks.current.onRandom();
        else callbacks.current.onFlip();
        settleTimer.current = setTimeout(() => {
          setSettling(false);
          suppressClick.current = false;
          callbacks.current.onHoldingChange(false);
          if (active.charged) showLanding();
        }, COIN_SETTLE_MS);
      } else callbacks.current.onHoldingChange(false);
    }
    return active.holding;
  }, [showLanding]);

  const begin = (pointerId, keyboard = false) => {
    if (disabled || settling || press.current) return;
    suppressClick.current = false;
    setLanded(false);
    const active = { pointerId, keyboard, holding: false, charged: false };
    active.timer = setTimeout(() => {
      active.holding = true;
      setHolding(true);
      callbacks.current.onHoldingChange(true);
      active.chargeTimer = setTimeout(() => {
        active.charged = true;
        setCharged(true);
      }, COIN_ACCELERATION_MS);
    }, COIN_HOLD_DELAY_MS);
    press.current = active;
  };

  useEffect(() => {
    const cancel = () => finish(false);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('blur', cancel);
      clearTimeout(press.current?.timer);
      clearTimeout(press.current?.chargeTimer);
      clearTimeout(settleTimer.current);
      clearTimeout(landingTimer.current);
    };
  }, [finish]);

  useEffect(() => { if (disabled) finish(false); }, [disabled, finish]);
  useEffect(() => { finish(false); }, [resetKey, finish]);
  useEffect(() => {
    if (previousRandomizing.current && !randomizing) showLanding();
    if (randomizing) setLanded(false);
    previousRandomizing.current = randomizing;
  }, [randomizing, showLanding]);

  const effect = randomizing || (settling && randomOutcome) ? 'casting'
    : charged ? 'charged' : holding ? 'charging' : landed ? 'landed' : '';

  return <button {...buttonProps} type="button" disabled={disabled || settling} aria-busy={holding || settling}
    onPointerDown={event => {
      if (event.button !== 0 || !event.isPrimary) return;
      begin(event.pointerId);
      event.currentTarget.setPointerCapture?.(event.pointerId);
    }}
    onPointerUp={event => {
      if (press.current?.pointerId !== event.pointerId) return;
      finish(true);
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    }}
    onPointerCancel={() => finish(false)}
    onLostPointerCapture={() => finish(false)}
    onContextMenu={event => event.preventDefault()}
    onKeyDown={event => {
      if (event.key !== ' ' && event.key !== 'Enter') return;
      event.preventDefault();
      if (!event.repeat) begin(null, true);
    }}
    onKeyUp={event => {
      if ((event.key !== ' ' && event.key !== 'Enter') || !press.current?.keyboard) return;
      event.preventDefault();
      const wasHolding = finish(true);
      if (!wasHolding) onFlip();
    }}
    onBlur={() => finish(false)}
    onClick={() => {
      if (suppressClick.current) { suppressClick.current = false; return; }
      onFlip();
    }}>
    <TongbaoCoin3D angle={angle} duration={duration} id={id} resetKey={resetKey} spinning={holding} effect={effect} />
    {children}
  </button>;
}
