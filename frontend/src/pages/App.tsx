import { useEffect, useRef } from 'react';
import LoadingSVG from '../components/LoadingSVG';
import { useWineContext } from '../hooks/useWineContext';
import { FileStatus } from '../utils/constants';
import FilterableWineList from './FilterableWineList';
import FormPage from './FormPage';

function App() {
  const {
    fileStatus,
    setFileStatus,
    wineList,
    setWineList,
    errorMessage,
    setErrorMessage,
    fileName,
    setFileName,
  } = useWineContext();
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStatus = useRef(fileStatus);

  useEffect(() => {
    // The upload control disappears after selection. Keep keyboard users oriented.
    if (
      previousStatus.current !== fileStatus &&
      fileStatus !== FileStatus.PROCESSING
    ) {
      heading.current?.focus();
    }
    previousStatus.current = fileStatus;
  }, [fileStatus]);

  const resetUpload = () => {
    setWineList([]);
    setFileName('');
    setErrorMessage(null);
    setFileStatus(FileStatus.IDLE);
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <span className="wordmark">Wine List Tool</span>
        {fileStatus === FileStatus.SUCCESS && (
          <button className="button button-secondary" onClick={resetUpload}>
            Upload another file
          </button>
        )}
      </header>
      <main>
        {fileStatus === FileStatus.IDLE && (
          <section className="upload-page" aria-labelledby="upload-title">
            <div className="intro">
              <h1 id="upload-title" ref={heading} tabIndex={-1}>
                Upload a wine list
              </h1>
            </div>
            <FormPage />
          </section>
        )}
        {fileStatus === FileStatus.PROCESSING && (
          <section className="state-panel" aria-labelledby="processing-title">
            <LoadingSVG />
            <div role="status">
              <h1 id="processing-title" ref={heading} tabIndex={-1}>
                Processing your file...
              </h1>
              <p className="file-name">{fileName}</p>
            </div>
          </section>
        )}
        {fileStatus === FileStatus.ERROR && (
          <section className="state-panel" aria-labelledby="error-title">
            <h1 id="error-title" ref={heading} tabIndex={-1}>
              We couldn’t read this list.
            </h1>
            <p className="file-name">{fileName}</p>
            <p role="alert" className="error-message">
              {errorMessage ?? 'Error occurred during file processing.'}
            </p>
            <button className="button button-primary" onClick={resetUpload}>
              Try again
            </button>
          </section>
        )}
        {fileStatus === FileStatus.SUCCESS && (
          <section className="results-page" aria-labelledby="results-title">
            <h1
              id="results-title"
              className="sr-only"
              ref={heading}
              tabIndex={-1}
            >
              Wine results
            </h1>
            <FilterableWineList initialWinelist={wineList} />
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
