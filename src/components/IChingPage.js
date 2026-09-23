import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  COIN_REVERSE,
  COIN_TEXT,
  lineFromValue,
  lineValueFromCoins,
  randomCoinFaces
} from '../utils/iching.js';
import { readingFromValues, zhuXiSelections } from '../utils/ichingTexts.js';
import { ichingParaphrase } from '../data/ichingParaphrases.js';
import { referenceUrl } from '../data/references.js';
import { downloadIChingReport } from '../utils/ichingReport.js';
import { TongbaoCoinButton } from './TongbaoCoinButton.js';
import './IChingPage.css';

const INITIAL_FACES = [COIN_TEXT, COIN_TEXT, COIN_TEXT];
const INITIAL_ROTATIONS = [0, 0, 0];
const RANDOM_SPIN_MS = 500;
const MANUAL_SPIN_MS = 720;
const LINE_POSITIONS = ['initial', 'second', 'third', 'fourth', 'fifth', 'top'];
const COIN_HINT_STORAGE_KEY = 'interpolateyou:iching-coin-hint:v1';

function linePosition(t, position) {
  return t(`iching.position.${LINE_POSITIONS[position - 1]}`);
}

function LineGlyph({ isYang, value, label }) {
  const mark = value === 6 ? 'X' : value === 9 ? 'O' : isYang ? '‘' : '‘’';
  return <span className="iching-line-glyph" aria-label={label} aria-hidden={label ? undefined : true}>{mark}</span>;
}

function FigureLine({ isYang, value, t }) {
  const moving = value === 6 || value === 9;
  return <span className="iching-figure-line-wrap">
    <span className={`iching-figure-line ${isYang ? 'yang' : 'yin'}`} role="img"
      aria-label={t(isYang ? 'iching.yang' : 'iching.yin')}>
      <i /><i />
    </span>
    {moving && <span className="iching-figure-moving" aria-label={t(`iching.value.${value}`)}>{value === 6 ? 'X' : 'O'}</span>}
  </span>;
}

function Hexagram({ title, entry, lines, values, t }) {
  return <section className="iching-hexagram" aria-label={title}>
    <h3>{title}</h3>
    <p className="iching-hexagram-name">{t('iching.hexagramName', { number: entry.number, name: entry.fullName })}</p>
    <div className="iching-hexagram-lines">
      {lines.map((isYang, index) => {
        const position = 6 - index;
        return <div className="iching-hexagram-row" key={position}>
          <span>{linePosition(t, position)}</span>
          <FigureLine isYang={isYang} value={values?.[index]} t={t} />
        </div>;
      })}
    </div>
  </section>;
}

function Paraphrase({ hexagramNumber, position = 0, t }) {
  const paraphrase = ichingParaphrase(hexagramNumber, position);
  if (!paraphrase) return null;
  return <div className="iching-paraphrase">
    <span className="iching-paraphrase-label">{t('iching.paraphrase')}</span>
    <p>{paraphrase}</p>
  </div>;
}

function ZhuXiEntry({ entry, showParaphrase, t }) {
  const heading = `${t(`iching.${entry.source}`)} · ${entry.hexagramName}`;
  return <article className="iching-zhu-entry">
    <div className="iching-zhu-entry-heading">
      <h3>{entry.kind === 'judgement' ? heading : `${entry.line?.label || linePosition(t, entry.position)} · ${heading}`}</h3>
      {entry.primary && <span className="iching-zhu-primary">{t('iching.primaryText')}</span>}
    </div>
    <p>{entry.kind === 'judgement' ? entry.text : entry.line?.text || t('iching.sourceMissing')}</p>
    {entry.line?.supplemental && <a className="iching-supplemental"
      href={referenceUrl('ichingArticle', { hexagramNumber: entry.hexagramNumber })} target="_blank" rel="noopener noreferrer">
      {t('iching.supplemental')} ↗
    </a>}
    {showParaphrase && <Paraphrase hexagramNumber={entry.hexagramNumber} position={entry.position} t={t} />}
  </article>;
}

export function IChingPage({ t }) {
  const [showCoinHint, setShowCoinHint] = useState(() => {
    try { return window.localStorage.getItem(COIN_HINT_STORAGE_KEY) !== 'acknowledged'; }
    catch (error) { return true; }
  });
  const coinHintCloseRef = useRef(null);
  const randomTimerRef = useRef(null);
  const [faces, setFaces] = useState(INITIAL_FACES);
  const [rotations, setRotations] = useState(INITIAL_ROTATIONS);
  const [spinGeneration, setSpinGeneration] = useState(0);
  const [casting, setCasting] = useState(false);
  const [heldCoin, setHeldCoin] = useState(null);
  const [values, setValues] = useState([]);
  const [error, setError] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [showParaphrase, setShowParaphrase] = useState(false);
  const [readingMethod, setReadingMethod] = useState('record');
  const complete = values.length === 6;
  const result = complete ? readingFromValues(values) : null;
  const zhuXi = result ? zhuXiSelections(result) : null;
  const currentValue = lineValueFromCoins(faces);

  const acknowledgeCoinHint = useCallback(() => {
    try { window.localStorage.setItem(COIN_HINT_STORAGE_KEY, 'acknowledged'); }
    catch (error) { /* Continue without persistence when storage is unavailable. */ }
    setShowCoinHint(false);
  }, []);

  useEffect(() => {
    if (!showCoinHint) return undefined;
    coinHintCloseRef.current?.focus();
    const onKeyDown = event => {
      if (event.key === 'Escape') acknowledgeCoinHint();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showCoinHint, acknowledgeCoinHint]);

  useEffect(() => () => {
    if (randomTimerRef.current) window.clearTimeout(randomTimerRef.current);
  }, []);

  const flipCoin = index => {
    if (complete || casting) return;
    setFaces(current => current.map((face, coinIndex) => coinIndex === index
      ? face === COIN_TEXT ? COIN_REVERSE : COIN_TEXT
      : face));
    // A full turn plus a half turn exposes the other face.
    setRotations(current => current.map((angle, coinIndex) => coinIndex === index ? angle + 540 : angle));
    setError('');
  };

  const castRandomly = () => {
    if (complete || casting) return;
    try {
      const nextFaces = randomCoinFaces();
      setCasting(true);
      setFaces(nextFaces);
      setRotations(current => current.map((angle, index) => {
        const currentFaceAngle = ((angle % 360) + 360) % 360;
        const finalFaceAngle = nextFaces[index] === COIN_REVERSE ? 180 : 0;
        return angle + 1080 + ((finalFaceAngle - currentFaceAngle + 360) % 360);
      }));
      setError('');
      randomTimerRef.current = window.setTimeout(() => {
        setValues(current => [...current, lineValueFromCoins(nextFaces)]);
        setCasting(false);
        randomTimerRef.current = null;
      }, RANDOM_SPIN_MS);
    } catch (failure) {
      setError(t('iching.randomUnavailable'));
    }
  };

  const randomizeCoin = index => {
    if (complete || casting) return;
    try {
      const nextFace = randomCoinFaces()[index];
      setFaces(current => current.map((face, coinIndex) => coinIndex === index ? nextFace : face));
      setRotations(current => current.map((angle, coinIndex) => coinIndex === index
        ? angle + 720 + (((nextFace === COIN_REVERSE ? 180 : 0) - angle % 360 + 360) % 360)
        : angle));
      setError('');
    } catch (failure) { setError(t('iching.randomUnavailable')); }
  };

  const confirmLine = () => {
    if (complete || casting) return;
    setValues(current => [...current, currentValue]);
    setFaces(INITIAL_FACES);
    setRotations(INITIAL_ROTATIONS);
    setSpinGeneration(current => current + 1);
    setError('');
  };

  const undoLine = () => {
    setValues(current => current.slice(0, -1));
    setReportError('');
  };

  const restart = () => {
    if (randomTimerRef.current) window.clearTimeout(randomTimerRef.current);
    randomTimerRef.current = null;
    setCasting(false);
    setValues([]);
    setFaces(INITIAL_FACES);
    setRotations(INITIAL_ROTATIONS);
    setSpinGeneration(current => current + 1);
    setError('');
    setReportError('');
  };

  const downloadReport = async format => {
    if (!result || reportBusy) return;
    setReportBusy(true);
    setReportError('');
    try {
      await downloadIChingReport(format, {
        values, reading: result, t
      });
    } catch (failure) {
      setReportError(t('iching.reportError'));
    } finally {
      setReportBusy(false);
    }
  };

  return <main className="iching-page">
    {showCoinHint && <div className="iching-coin-hint-backdrop">
      <section className="iching-coin-hint" role="dialog" aria-modal="true"
        aria-labelledby="iching-coin-hint-title" aria-describedby="iching-coin-hint-body">
        <button ref={coinHintCloseRef} type="button" className="iching-coin-hint-close"
          onClick={acknowledgeCoinHint} aria-label={t('iching.coinHintClose')}>×</button>
        <span className="iching-coin-hint-mark" aria-hidden="true">◉</span>
        <h2 id="iching-coin-hint-title">{t('iching.coinHintTitle')}</h2>
        <p id="iching-coin-hint-body">{t('iching.coinHintBody')}</p>
        <button type="button" className="iching-button primary" onClick={acknowledgeCoinHint}>
          {t('iching.coinHintGotIt')}
        </button>
      </section>
    </div>}
    <div className="iching-page-inner">
      <header className="iching-header">
        <p className="iching-eyebrow">{t('iching.eyebrow')}</p>
        <h1>{t('iching.title')}</h1>
        <p>{t('iching.description')}</p>
      </header>

      <div className="iching-workspace">
        <section className="iching-paper iching-casting" aria-labelledby="iching-casting-title">
          <div className="iching-section-heading">
            <span className="iching-section-number">01</span>
            <div>
              <h2 id="iching-casting-title">{t('iching.castTitle')}</h2>
            </div>
          </div>

          <div className="iching-coins" role="group" aria-label={t('iching.threeCoins')}>
            {faces.map((face, index) => <TongbaoCoinButton
              key={index}
              className={`iching-coin ${face === COIN_REVERSE ? 'reverse' : 'text'} ${casting ? 'rolling' : ''}`}
              disabled={complete || casting || (heldCoin !== null && heldCoin !== index)}
              aria-label={t('iching.coinToggle', {
                number: index + 1,
                face: t(face === COIN_TEXT ? 'iching.textFace' : 'iching.reverseFace')
              })}
              aria-pressed={face === COIN_REVERSE}
              onFlip={() => flipCoin(index)}
              onRandom={() => randomizeCoin(index)} randomizing={casting}
              onHoldingChange={isHolding => setHeldCoin(isHolding ? index : null)}
              id={`coin-${index}`} resetKey={spinGeneration}
              angle={rotations[index]} duration={casting ? RANDOM_SPIN_MS : MANUAL_SPIN_MS}
            >
              <small>{t(face === COIN_TEXT ? 'iching.textFace' : 'iching.reverseFace')}</small>
            </TongbaoCoinButton>)}
          </div>

          <div className="iching-cast-readout" aria-live="polite">
            <span>{casting ? t('iching.randomSpinning') : complete ? t('iching.castComplete')
              : t('iching.nextLine', { position: linePosition(t, values.length + 1) })}</span>
            {!complete && !casting && <strong>{t(`iching.value.${currentValue}`)}</strong>}
          </div>
          <div className="iching-actions">
            <button className="iching-button secondary" type="button" disabled={complete || casting || heldCoin !== null} onClick={castRandomly}>{t('iching.random')}</button>
            <button className="iching-button primary" type="button" disabled={complete || casting || heldCoin !== null} onClick={confirmLine}>{t('iching.confirm')}</button>
          </div>
          {error && <p className="iching-error" role="alert">{error}</p>}
        </section>

        <section className="iching-paper iching-record" aria-labelledby="iching-record-title">
          <div className="iching-section-heading">
            <div>
              <h2 id="iching-record-title">{t('iching.recordTitle')}</h2>
            </div>
          </div>
          <ul className="iching-record-list">
            {Array.from({ length: 6 }, (_, visualIndex) => {
              const index = 5 - visualIndex;
              const line = values[index] == null ? null : lineFromValue(values[index]);
              return <li key={index} className={line ? 'filled' : ''}>
                <span className="iching-record-position">{linePosition(t, index + 1)}</span>
                {line ? <><LineGlyph isYang={line.isYang} value={line.value} /><span>{t(`iching.value.${line.value}`)}</span></>
                  : <span className="iching-empty-line" aria-hidden="true" />}
              </li>;
            })}
          </ul>
          <div className="iching-record-actions">
            <button type="button" disabled={!values.length || casting || heldCoin !== null} onClick={undoLine}>{t('iching.undo')}</button>
            <button type="button" disabled={!values.length || casting || heldCoin !== null} onClick={restart}>{t('iching.restart')}</button>
          </div>
        </section>
      </div>

      {result && <section className="iching-paper iching-result" aria-labelledby="iching-result-title">
        <div className="iching-section-heading">
          <span className="iching-section-number">02</span>
          <div>
            <h2 id="iching-result-title">{result.movingPositions.length ? t('iching.resultTitle') : t('iching.original')}</h2>
          </div>
        </div>
        <div className="iching-results">
          <Hexagram title={t('iching.original')} entry={result.originalHexagram} lines={[...result.original].reverse()} values={[...values].reverse()} t={t} />
          {result.movingPositions.length > 0 && <>
            <span className="iching-result-arrow" aria-hidden="true">→</span>
            <Hexagram title={t('iching.changed')} entry={result.changedHexagram} lines={[...result.changed].reverse()} t={t} />
          </>}
        </div>
        <p className="iching-moving-summary">{result.movingPositions.length
          ? t('iching.movingLines', { positions: result.movingPositions.map(position => linePosition(t, position)).join('、') })
          : t('iching.noMovingLines')}</p>
      </section>}

      {result && <section className="iching-paper iching-reading" aria-labelledby="iching-reading-title">
        <div className="iching-section-heading">
          <span className="iching-section-number">03</span>
          <div>
            <h2 id="iching-reading-title">{t('iching.readingTitle')}</h2>
          </div>
        </div>
        <div className="iching-translation-toolbar iching-method-toolbar">
          <span>{t('iching.methodMode')}</span>
          <div className="iching-translation-tabs" role="group" aria-label={t('iching.methodMode')}>
            <button type="button" aria-pressed={readingMethod === 'record'}
              className={readingMethod === 'record' ? 'active' : ''} onClick={() => setReadingMethod('record')}>
              {t('iching.recordMethod')}
            </button>
            <button type="button" aria-pressed={readingMethod === 'zhu'}
              className={readingMethod === 'zhu' ? 'active' : ''} onClick={() => setReadingMethod('zhu')}>
              {t('iching.zhuMethod')}
            </button>
          </div>
        </div>
        <div className="iching-translation-toolbar">
          <span>{t('iching.displayMode')}</span>
          <div className="iching-translation-tabs" role="tablist" aria-label={t('iching.displayMode')}>
            <button type="button" role="tab" aria-selected={!showParaphrase}
              className={!showParaphrase ? 'active' : ''} onClick={() => setShowParaphrase(false)}>
              {t('iching.textMode')}
            </button>
            <button type="button" role="tab" aria-selected={showParaphrase}
              className={showParaphrase ? 'active' : ''} onClick={() => setShowParaphrase(true)}>
              {t('iching.paraphraseMode')}
            </button>
          </div>
        </div>
        {readingMethod === 'record' ? <><div className="iching-judgements">
          <article>
            <h3>{t('iching.original')} · {result.originalHexagram.fullName}</h3>
            <p>{result.originalHexagram.judgement}</p>
            {showParaphrase && <Paraphrase hexagramNumber={result.originalHexagram.number} t={t} />}
          </article>
          {result.changedHexagram.number !== result.originalHexagram.number && <article>
            <h3>{t('iching.changed')} · {result.changedHexagram.fullName}</h3>
            <p>{result.changedHexagram.judgement}</p>
            {showParaphrase && <Paraphrase hexagramNumber={result.changedHexagram.number} t={t} />}
          </article>}
        </div>
        <ul className="iching-reading-lines">
          {[...result.selectedLines].reverse().map(selected => <li key={selected.position}>
            <span className="iching-reading-position">{linePosition(t, selected.position)}</span>
            <div>
              <div className="iching-reading-line-heading">
                <strong>{selected.line?.label || linePosition(t, selected.position)}</strong>
                <span>{selected.moving ? t('iching.changed') : t('iching.original')} · {selected.hexagramName}</span>
              </div>
              <p>{selected.line?.text || t('iching.sourceMissing')}</p>
              {selected.line?.supplemental && <a className="iching-supplemental"
                href={referenceUrl('ichingArticle', { hexagramNumber: selected.hexagramNumber })} target="_blank" rel="noopener noreferrer">
                {t('iching.supplemental')} ↗
              </a>}
              {showParaphrase && <Paraphrase hexagramNumber={selected.hexagramNumber} position={selected.position} t={t} />}
            </div>
          </li>)}
        </ul></> : <div className="iching-zhu-list">
          {zhuXi.entries.map(entry => <ZhuXiEntry key={`${entry.kind}-${entry.source}-${entry.position}`}
            entry={entry} showParaphrase={showParaphrase} t={t} />)}
          <p className="iching-zhu-source">{t('iching.zhuSource')} <a href={referenceUrl('zhuXiRules')}
            target="_blank" rel="noopener noreferrer">{t('iching.zhuSourceLink')} ↗</a></p>
        </div>}
        {showParaphrase && <p className="iching-translation-note">{t('iching.translationNote')}</p>}
      </section>}

      {result && <section className="iching-paper iching-report" aria-labelledby="iching-report-title">
        <div className="iching-section-heading">
          <span className="iching-section-number">04</span>
          <div>
            <h2 id="iching-report-title">{t('iching.reportTitle')}</h2>
          </div>
        </div>
        <div className="iching-report-actions">
          <button className="iching-button primary" type="button" disabled={reportBusy} onClick={() => downloadReport('pdf')}>
            {reportBusy ? t('iching.reportBusy') : t('iching.reportPdf')}
          </button>
          <button className="iching-button secondary" type="button" disabled={reportBusy} onClick={() => downloadReport('png')}>
            {reportBusy ? t('iching.reportBusy') : t('iching.reportPng')}
          </button>
        </div>
        {reportError && <p className="iching-error" role="alert">{reportError}</p>}
      </section>}
    </div>
  </main>;
}
