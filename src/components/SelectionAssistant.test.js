import React, { useRef } from 'react';
import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SelectionAssistant } from './SelectionAssistant.js';
import { dataManager } from '../services/DataManager.js';
import { translateEntryLive } from '../services/liveTranslation.js';

jest.mock('../services/DataManager.js', () => ({
  dataManager: {
    loadWordsData: jest.fn(),
    loadCharacterPronunciations: jest.fn(),
    generateSearchVariants: jest.fn(query => [query])
  }
}));

jest.mock('../services/liveTranslation.js', () => ({
  translateEntryLive: jest.fn()
}));

const labels = {
  'selection.toolbar': 'Selected text tools',
  'selection.search': 'Search',
  'selection.meaning': 'Meaning',
  'selection.copy': 'Copy',
  'selection.notes': 'Notes',
  'selection.translate': 'Translate',
  'selection.close': 'Close',
  'selection.searchInput': 'Search selected text',
  'selection.loading': 'Loading',
  'selection.unavailable': 'Unavailable',
  'selection.noDefinition': 'No definition',
  'selection.jyutping': 'Jyutping',
  'selection.mandarin': 'Pinyin',
  'selection.copied': 'Copied',
  'selection.copyFailed': 'Copy failed',
  'selection.annotationLabel': 'Your annotation',
  'selection.annotationPlaceholder': 'Write here',
  'selection.annotationOptional': 'Optional',
  'selection.saveNote': 'Save note',
  'selection.noteSaved': 'Saved',
  'selection.translationTarget': 'Language',
  'selection.chooseLanguage': 'Choose a language',
  'selection.translating': 'Translating',
  'selection.translationUnavailable': 'Translation unavailable',
  'notes.title': 'Reading notes'
};

function Harness({ onSaveReadingNote }) {
  const scopeRef = useRef(null);
  return (
    <div>
      <article ref={scopeRef}>明月照故鄉</article>
      <SelectionAssistant
        scopeRef={scopeRef}
        t={key => labels[key] || key}
        convertText={text => text}
        source={{ type: 'poetry', title: '靜夜思', author: '李白' }}
        onSaveReadingNote={onSaveReadingNote}
      />
    </div>
  );
}

describe('SelectionAssistant', () => {
  beforeEach(() => {
    dataManager.loadWordsData.mockResolvedValue([{
      id: 1,
      type: 'word',
      text: '明月',
      jyutPinyin: 'ming4 jyut6',
      mandarinPinyin: 'míng yuè',
      meanings: ['明亮的月亮']
    }]);
    dataManager.loadCharacterPronunciations.mockResolvedValue({
      明: { j: 'ming4', p: 'míng' },
      月: { j: 'jyut6', p: 'yuè' }
    });
    translateEntryLive.mockResolvedValue('bright moon');
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: jest.fn().mockResolvedValue(undefined) }
    });
  });

  test('keeps the reader mounted while lookup, notes, copy and translation run in place', async () => {
    const onSaveReadingNote = jest.fn();
    render(<Harness onSaveReadingNote={onSaveReadingNote} />);
    const content = screen.getByText('明月照故鄉');
    const range = {
      commonAncestorContainer: content.firstChild,
      getBoundingClientRect: () => ({ left: 100, top: 100, bottom: 120, width: 60, height: 20 })
    };
    const selection = {
      isCollapsed: false,
      rangeCount: 1,
      getRangeAt: () => range,
      toString: () => '明月'
    };
    jest.spyOn(window, 'getSelection').mockReturnValue(selection);

    fireEvent(document, new Event('selectionchange'));
    expect(await screen.findByRole('toolbar', { name: 'Selected text tools' })).toBeInTheDocument();
    await act(() => new Promise(resolve => setTimeout(resolve, 340)));

    fireEvent.click(screen.getByRole('button', { name: /Search/ }));
    const searchDialog = await screen.findByRole('dialog', { name: 'Search' });
    expect(searchDialog).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search selected text' })).toHaveValue('明月');
    expect(content).toBeInTheDocument();

    fireEvent.scroll(searchDialog);
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Selected text tools' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Copy/ }));
    await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalledWith('明月'));

    fireEvent.click(screen.getByRole('button', { name: /Notes/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your annotation' }), { target: { value: 'My own thought' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save note' }));
    expect(onSaveReadingNote).toHaveBeenCalledWith(expect.objectContaining({
      text: '明月',
      annotation: 'My own thought'
    }));

    fireEvent.click(screen.getByRole('button', { name: /Translate/ }));
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    await waitFor(() => expect(translateEntryLive).toHaveBeenCalledWith('明月', 'en'));
    expect(await screen.findByText('bright moon')).toBeInTheDocument();
    expect(content).toBeInTheDocument();

    fireEvent.scroll(content);
    expect(screen.queryByRole('toolbar', { name: 'Selected text tools' })).not.toBeInTheDocument();
  });
});
