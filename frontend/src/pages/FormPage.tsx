import { useRef, useState } from 'react';
import { useWineContext } from '../hooks/useWineContext';
import { FileStatus, MAX_FILE_SIZE_BYTES } from '../utils/constants';
import { uploadFile } from '../services/api';

function FormPage() {
  const {
    setFileStatus,
    setWineList,
    errorMessage,
    setErrorMessage,
    setFileName,
  } = useWineContext();
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);
  const uploading = useRef(false);

  const handleFile = async (file: File | undefined) => {
    if (!file || uploading.current) return;
    setErrorMessage(null);
    // Some platforms supply no MIME type for local PDFs. This is a UX check,
    // not a security boundary; the server remains responsible for validation.
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setErrorMessage('Please upload a PDF file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage('File size exceeds 10MB limit.');
      return;
    }
    uploading.current = true;
    setFileName(file.name);
    setFileStatus(FileStatus.PROCESSING);
    try {
      setWineList(await uploadFile(file));
      setFileStatus(FileStatus.SUCCESS);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Error processing file.',
      );
      setFileStatus(FileStatus.ERROR);
    } finally {
      uploading.current = false;
    }
  };

  return (
    <form className="upload-form" onSubmit={(event) => event.preventDefault()}>
      <label
        htmlFor="dropzone-file"
        className={`dropzone${dragging ? ' is-dragging' : ''}`}
        onDragEnter={(event) => {
          event.preventDefault();
          dragDepth.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => {
          dragDepth.current = Math.max(0, dragDepth.current - 1);
          if (dragDepth.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          dragDepth.current = 0;
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <svg
          className="document-icon"
          aria-hidden="true"
          viewBox="0 0 32 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <path d="M5 1h14l8 8v29H5zM19 1v9h8M10 18h12M10 24h12M10 30h7" />
        </svg>
        <span className="button button-primary">Choose PDF</span>
        <span className="drop-prompt">
          {dragging ? 'Drop PDF here' : 'or drop a PDF here'}
        </span>
        <span id="upload-hint" className="fine-print">
          PDF only · up to 10 MB
        </span>
        <input
          id="dropzone-file"
          type="file"
          accept=".pdf"
          className="sr-only"
          aria-label="Choose PDF file"
          aria-describedby={`upload-hint${errorMessage ? ' upload-error' : ''}`}
          aria-invalid={Boolean(errorMessage)}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            void handleFile(file);
          }}
        />
      </label>
      {errorMessage && (
        <p id="upload-error" role="alert" className="error-message">
          {errorMessage}
        </p>
      )}
    </form>
  );
}

export default FormPage;
