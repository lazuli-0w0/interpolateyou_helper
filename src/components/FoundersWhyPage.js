import React from 'react';
import { convertContentForLocale } from '../i18n.js';
import './FoundersWhyPage.css';

const SECTIONS = [
  {
    number: '01',
    label: '距離',
    paragraphs: [
      '不論是曾經風靡一時的儒家學說《詩經》《論語》《大學》等，或是唐詩宋詞元曲，',
      '大家可以一句話「封建糟粕」來否定，可是我認為其中蘊含很多道理。'
    ],
    quote: '所謂道理，正正便是前人走過的「道路」整合的「理論」。'
  },
  {
    number: '02',
    label: '失真',
    paragraphs: [
      '可是現代的網絡發達，很多時候的資訊來自第二、三，甚至更多手的資訊時，',
      '有意無意好，都會某程度上把其中意思扭曲了。'
    ]
  },
  {
    number: '03',
    label: '初心',
    paragraphs: [
      '所以我想把中國文化原原本本的分享給大家。'
    ],
    purpose: true
  }
];

export function FoundersWhyPage({ locale }) {
  const localize = (text) => convertContentForLocale(text, locale);

  return (
    <main className="founders-why-page">
      <div className="founders-why-orb founders-why-orb-one" aria-hidden="true" />
      <div className="founders-why-orb founders-why-orb-two" aria-hidden="true" />

      <article className="founders-why-inner">
        <header className="founders-why-hero">
          <p className="founders-why-eyebrow">IL MOTIVO DEL FONDATORE · {localize('創辦人的話')}</p>
          <h1>
            <span>FOUNDER’S</span>
            <span>WHY</span>
          </h1>
          <p className="founders-why-lead">{localize('中國文化時常離我們很遠。')}</p>
          <div className="founders-why-seal" aria-hidden="true">{localize('知')}</div>
        </header>

        <div className="founders-why-story">
          {SECTIONS.map(section => (
            <section className="founders-why-section" key={section.number}>
              <div className="founders-why-section-index" aria-hidden="true">
                <span>{section.number}</span>
                <small>{localize(section.label)}</small>
              </div>

              <div className="founders-why-section-content">
                {section.paragraphs.map(paragraph => (
                  <p key={paragraph}>{localize(paragraph)}</p>
                ))}

                {section.quote && (
                  <blockquote>
                    <span className="founders-why-quote-mark" aria-hidden="true">「</span>
                    <p>{localize(section.quote)}</p>
                  </blockquote>
                )}

                {section.purpose && (
                  <div className="founders-why-purpose">
                    <p>{localize('於是開設了')}</p>
                    <strong>INTERPOLATE YOU</strong>
                    <small>BRAND · 覺知 你</small>
                    <p>{localize('旨在用中國文化讓大家更加了解我們自身。')}</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>

        <footer className="founders-why-closing">
          <span aria-hidden="true">—</span>
          <p>{localize('邯鄲學步，乞望輯正。')}</p>
        </footer>

        <aside className="founders-why-contribution" aria-label="Contribution">
          <p>CONTRIBUTION</p>
          <span>{localize('特別鳴謝 Gwen Ho 教導我建立 Vercel app。')}</span>
        </aside>
      </article>
    </main>
  );
}
