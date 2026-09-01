import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createTranslator } from '../i18n.js';
import { ReadingNotesPage } from './ReadingNotesPage.js';

const note = {
  id: 'note-1',
  text: '綺美',
  annotation: 'A saved thought.',
  source: {
    literatureId: 17,
    type: 'poetry',
    title: '一七令',
    author: '白居易'
  },
  createdAt: '2026-09-01T05:00:00.000Z'
};

describe('ReadingNotesPage', () => {
  test('opens the source entry when the note is pressed', async () => {
    const onOpen = jest.fn().mockResolvedValue(undefined);
    render(
      <ReadingNotesPage
        notes={[note]}
        locale="en"
        t={createTranslator('en')}
        onOpen={onOpen}
        onDelete={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Return to “一七令 · 白居易”' }));
    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(note));
  });

  test('requires confirmation before deleting a note', () => {
    const onDelete = jest.fn();
    render(
      <ReadingNotesPage
        notes={[note]}
        locale="en"
        t={createTranslator('en')}
        onOpen={jest.fn()}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete note from “一七令 · 白居易”' }));
    expect(screen.getByRole('alertdialog', { name: 'Delete this note?' })).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete note from “一七令 · 白居易”' }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete note' }));
    expect(onDelete).toHaveBeenCalledWith(note.id);
  });
});
