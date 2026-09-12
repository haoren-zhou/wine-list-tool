import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import WineContextProvider from '../contexts/WineContextProvider';
import { uploadFile } from '../services/api';
import { partialWines } from '../test/wines';
import type { Wine } from '../types';
import { MAX_FILE_SIZE_BYTES } from '../utils/constants';
import App from './App';

vi.mock('../services/api', () => ({ uploadFile: vi.fn() }));
const upload = vi.mocked(uploadFile);

function renderApp() {
  return render(
    <WineContextProvider>
      <App />
    </WineContextProvider>,
  );
}

async function selectFile(method: 'picker' | 'drop', file: File) {
  const input = screen.getByLabelText('Choose PDF file');
  if (method === 'picker') {
    await userEvent.setup({ applyAccept: false }).upload(input, file);
  } else {
    fireEvent.dragOver(input.closest('label')!);
    fireEvent.drop(input.closest('label')!, {
      dataTransfer: { files: [file] },
    });
  }
}

beforeEach(() => upload.mockReset());

describe.each(['picker', 'drop'] as const)('%s upload', (method) => {
  it('shares PDF validation and clears the error when retrying successfully', async () => {
    upload.mockResolvedValue(partialWines);
    renderApp();
    await selectFile(
      method,
      new File(['bad'], 'image.png', { type: 'image/png' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Please upload a PDF file.',
    );
    expect(screen.getByLabelText('Choose PDF file')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(upload).not.toHaveBeenCalled();

    const file = new File(['pdf'], 'wine.pdf', { type: 'application/pdf' });
    await selectFile(method, file);
    expect(
      await screen.findByRole('button', { name: 'Upload another file' }),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(upload).toHaveBeenCalledExactlyOnceWith(file);
  });

  it('rejects oversized PDFs inline', async () => {
    renderApp();
    const file = new File(['pdf'], 'large.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE_BYTES + 1 });
    await selectFile(method, file);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'File size exceeds 10MB limit.',
    );
    expect(upload).not.toHaveBeenCalled();
  });

  it('accepts a PDF at the size limit', async () => {
    upload.mockResolvedValue([]);
    renderApp();
    const file = new File(['pdf'], 'limit.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: MAX_FILE_SIZE_BYTES });
    await selectFile(method, file);
    expect(await screen.findByText(/No wines were extracted/)).toBeVisible();
    expect(upload).toHaveBeenCalledExactlyOnceWith(file);
  });
});

it('prevents browser navigation on drag/drop and ignores empty selections', () => {
  renderApp();
  const input = screen.getByLabelText('Choose PDF file');
  const dropzone = input.closest('label')!;
  expect(fireEvent.dragOver(dropzone)).toBe(false);
  expect(fireEvent.drop(dropzone, { dataTransfer: { files: [] } })).toBe(false);
  fireEvent.change(input, { target: { files: [] } });
  expect(upload).not.toHaveBeenCalled();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});

it('provides a keyboard-focusable native file picker', async () => {
  renderApp();
  await userEvent.tab();
  const input = screen.getByLabelText('Choose PDF file');
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute('type', 'file');
  expect(input).not.toHaveClass('hidden');
});

it('announces processing and failures, then clears old errors on retry', async () => {
  let rejectUpload!: (error: Error) => void;
  upload.mockReturnValue(
    new Promise<Wine[]>((_resolve, reject) => {
      rejectUpload = reject;
    }),
  );
  renderApp();
  await selectFile(
    'picker',
    new File(['pdf'], 'wine.pdf', { type: 'application/pdf' }),
  );
  expect(screen.getByRole('status')).toHaveTextContent(
    'Processing your file...',
  );
  await act(async () => {
    rejectUpload(new Error('Service unavailable'));
    await Promise.resolve();
  });
  expect(screen.getByRole('alert')).toHaveTextContent('Service unavailable');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  upload.mockResolvedValue(partialWines);
  await selectFile(
    'picker',
    new File(['pdf'], 'wine.pdf', { type: 'application/pdf' }),
  );
  expect(await screen.findByText(/Extracted: 3/)).toBeVisible();
});

it('clears results and filters when uploading another file', async () => {
  upload.mockResolvedValueOnce(partialWines).mockResolvedValueOnce([]);
  renderApp();
  const file = new File(['pdf'], 'wine.pdf', { type: 'application/pdf' });
  await selectFile('picker', file);
  await screen.findByRole('button', { name: 'Upload another file' });
  fireEvent.change(screen.getByLabelText('Min. Rating'), {
    target: { value: '5' },
  });
  await userEvent.click(
    screen.getByRole('button', { name: 'Upload another file' }),
  );
  expect(screen.queryByText(/Extracted:/)).not.toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await selectFile('picker', file);
  expect(await screen.findByText(/No wines were extracted/)).toBeVisible();
  expect(screen.getByLabelText('Min. Rating')).toHaveValue('0');
  expect(
    screen.getByText(/Extracted: 0 · Matched: 0 · Visible: 0/),
  ).toBeVisible();
  expect(screen.queryByLabelText('Per page')).not.toBeInTheDocument();
});
