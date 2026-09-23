import React, { useEffect, useRef, useState } from 'react';

function CoinFallback({ angle, id }) {
  const reverse = ((angle % 360) + 360) % 360 >= 90 && ((angle % 360) + 360) % 360 < 270;
  const maskId = `tongbao-cutout-${id}`;
  return <svg className="tongbao-model-fallback" viewBox="0 0 216 216" aria-hidden="true" focusable="false">
    <defs>
      <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="216" height="216">
        <circle cx="108" cy="108" r="102" fill="white" />
        <rect x="94.5" y="94.5" width="27" height="27" rx="1" fill="black" />
      </mask>
    </defs>
    <image href="/tongbao-reference.jpeg" x={reverse ? -244 : -11} y="-4" width="472" height="216"
      preserveAspectRatio="none" mask={`url(#${maskId})`} />
  </svg>;
}

export function TongbaoCoin3D({ angle, duration, id, resetKey, spinning = false, effect = '' }) {
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const animationRef = useRef({ angle, duration, resetKey, spinning });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!window.WebGL2RenderingContext) return undefined;
    let cancelled = false;
    let renderer;
    import('../utils/tongbaoModel.js')
      .then(module => cancelled ? null : module.createTongbaoRenderer(canvasRef.current))
      .then(instance => {
        if (!instance) return;
        if (cancelled) { instance.dispose(); return; }
        renderer = instance;
        rendererRef.current = instance;
        instance.turn(animationRef.current.angle, 0, true);
        if (animationRef.current.spinning) instance.turn(animationRef.current.angle, 0, false, true);
        setReady(true);
      })
      .catch(() => { /* Keep the reference visible if WebGL is unavailable. */ });
    return () => {
      cancelled = true;
      rendererRef.current = null;
      renderer?.dispose();
    };
  }, []);

  useEffect(() => {
    const snap = animationRef.current.resetKey !== resetKey;
    animationRef.current = { angle, duration, resetKey, spinning };
    rendererRef.current?.turn(angle, duration, snap, spinning);
  }, [angle, duration, resetKey, spinning]);

  return <span className={`tongbao-model ${ready ? 'is-3d' : ''} ${spinning ? 'is-spinning' : ''} ${effect ? `effect-${effect}` : ''}`} aria-hidden="true">
    <canvas ref={canvasRef} className="tongbao-model-canvas" />
    {!ready && <CoinFallback angle={angle} id={id} />}
    <span className="tongbao-fx">
      <i className="tongbao-fx-arc" /><i className="tongbao-fx-ring" />
      {Array.from({ length: 8 }, (_, index) => <i key={index} className="tongbao-fx-spark" style={{ '--spark': index }} />)}
    </span>
  </span>;
}
