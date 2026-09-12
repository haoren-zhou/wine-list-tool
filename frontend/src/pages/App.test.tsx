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

it.each(['', 'application/octet-stream'])(
  'accepts a PDF extension when the MIME type is %j',
  async (type) => {
    upload.mockResolvedValue(partialWines);
    renderApp();
    const file = new File(['pdf'], 'menu.PDF', { type });
    await selectFile('drop', file);
    expect(await screen.findByText('Showing 3 of 3 wines')).toBeVisible();
    expect(upload).toHaveBeenCalledExactlyOnceWith(file);
  },
);

it('highlights the dropzone until the final nested drag leaves', () => {
  renderApp();
  const zone = screen.getByLabelText('Choose PDF file').closest('label')!;
  fireEvent.dragEnter(zone);
  fireEvent.dragEnter(zone.querySelector('svg')!);
  fireEvent.dragLeave(zone.querySelector('svg')!);
  expect(zone).toHaveClass('is-dragging');
  fireEvent.dragLeave(zone);
  expect(zone).not.toHaveClass('is-dragging');
});

it('provides a keyboard-focusable native file picker', async () => {
  renderApp();
  await userEvent.tab();
  const input = screen.getByLabelText('Choose PDF file');
  expect(input).toHaveFocus();
  expect(input).toHaveAttribute('type', 'file');
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
  expect(screen.getByText('wine.pdf')).toBeVisible();
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
  expect(await screen.findByText('Showing 3 of 3 wines')).toBeVisible();
  const resultHeading = screen.getByRole('heading', { level: 1 });
  expect(resultHeading).toHaveFocus();
  await userEvent.tab();
  expect(screen.getByRole('searchbox')).toHaveFocus();
});

it('clears results and filters when uploading another file', async () => {
  upload
    .mockResolvedValueOnce(partialWines)
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(partialWines);
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
  expect(screen.queryByText(/Showing .* wines/)).not.toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  await selectFile('picker', file);
  expect(await screen.findByText(/No wines were extracted/)).toBeVisible();
  expect(screen.queryByLabelText('Min. Rating')).not.toBeInTheDocument();
  expect(screen.queryByLabelText('Per page')).not.toBeInTheDocument();
  await userEvent.click(
    screen.getByRole('button', { name: 'Upload another file' }),
  );
  await selectFile('picker', file);
  expect(await screen.findByText('Showing 3 of 3 wines')).toBeVisible();
  expect(screen.getByLabelText('Min. Rating')).toHaveValue('0');
});
