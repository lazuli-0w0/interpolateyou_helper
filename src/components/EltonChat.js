import React, { useEffect, useRef, useState } from 'react';
import './EltonChat.css';

export function EltonChat({ t }) {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('checking');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);
  const controllerRef = useRef(null);
  const busyRef = useRef(false);

  async function checkConnection(signal) {
    setStatus('checking');
    try {
      const response = await fetch('/api/elton', { cache: 'no-store', signal });
      const data = await response.json();
      setStatus(response.ok && data.available ? 'online' : 'offline');
    } catch (failure) {
      if (failure.name !== 'AbortError') setStatus('offline');
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    checkConnection(controller.signal);
    return () => { controller.abort(); controllerRef.current?.abort(); };
  }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo?.({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  async function send(event) {
    event.preventDefault();
    const content = draft.trim();
    if (!content || busyRef.current) return;
    busyRef.current = true;
    setSending(true); setError('');
    const outgoing = [...messages, { role: 'user', content }].slice(-10);
    const controller = new AbortController(); controllerRef.current = controller;
    try {
      const response = await fetch('/api/elton', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: outgoing }), signal: controller.signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.code || 'unavailable');
      if (typeof data.reply !== 'string' || !data.reply.trim()) throw new Error('unavailable');
      setMessages([...outgoing, { role: 'assistant', content: data.reply }]);
      setDraft(''); setStatus('online');
    } catch (failure) {
      if (failure.name !== 'AbortError') {
        setError(failure.message === 'busy' || failure.message === 'rate_limit' ? t('elton.busy') : t('elton.error'));
        if (failure.message === 'unavailable') setStatus('offline');
      }
    } finally { busyRef.current = false; setSending(false); }
  }

  return (
    <main className="product-page elton-page">
      <section className="elton-shell" aria-labelledby="elton-title">
        <header className="elton-header">
          <div><p className="product-page-eyebrow">ELTON · INTERPOLATE YOU</p>
            <h1 id="elton-title">{t('product.elton.label')}<span aria-hidden="true">。</span></h1>
            <p>{t('elton.subtitle')}</p>
          </div>
          <button type="button" disabled={sending || !messages.length} onClick={() => { setMessages([]); setError(''); }}>{t('elton.new')} ＋</button>
        </header>
        <p className="elton-disclosure">{t('elton.disclosure')}</p>
        <div className="elton-connection" role="status"><span className={`elton-dot ${status}`} />{t(`elton.${status}`)}
          {status === 'offline' && <button type="button" onClick={() => checkConnection()}>{t('elton.retry')}</button>}
        </div>
        <div className="elton-messages" ref={scrollRef} role="log" aria-live="polite" aria-relevant="additions">
          {!messages.length && <div className="elton-empty"><span aria-hidden="true">我</span><h2>{t('elton.empty')}</h2>
            <div className="elton-prompts">{['One', 'Two', 'Three'].map(key => <button key={key} type="button" disabled={sending} onClick={() => setDraft(t(`elton.prompt${key}`))}>{t(`elton.prompt${key}`)}</button>)}</div>
          </div>}
          {messages.map((message, index) => <article key={index} className={`elton-message ${message.role}`}><small>{message.role === 'user' ? t('elton.you') : t('elton.assistantLabel')}</small><p>{message.content}</p>{message.role === 'assistant' && <span className="elton-reply-notice">{t('elton.replyNotice')}</span>}</article>)}
          {sending && <p className="elton-thinking" role="status">{t('elton.wait')}</p>}
        </div>
        <form className="elton-composer" onSubmit={send}>
          {error && <p className="elton-error" role="alert">{error}</p>}
          <label className="elton-input-label" htmlFor="elton-message">{t('elton.placeholder')}</label>
          <textarea id="elton-message" rows="2" maxLength="1500" value={draft} placeholder={t('elton.placeholder')} disabled={sending}
            onChange={event => setDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing && !window.matchMedia('(pointer: coarse)').matches) send(event); }} />
          <div className="elton-send-row"><span>Elton</span><button type="submit" disabled={sending || !draft.trim()}>{sending ? t('elton.wait') : t('elton.send')} ↗</button></div>
        </form>
        <p className="elton-note">{t('elton.note')}</p>
      </section>
    </main>
  );
}
