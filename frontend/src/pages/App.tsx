import { useWineContext } from '../hooks/useWineContext';
import { FileStatus } from '../utils/constants';
import '../styles/App.css';
import FormPage from './FormPage';
import FilterableWineList from './FilterableWineList';
import LoadingSVG from '../components/LoadingSVG';
// import { Routes, Route, Link } from 'react-router-dom';

function App() {
  const { fileStatus, setFileStatus, wineList } = useWineContext();
  const renderContent = () => {
    switch (fileStatus) {
      case FileStatus.PROCESSING:
        return (
          <>
            <LoadingSVG />
            <p className="text-center text-white font-bold text-xs md:text-sm xl:text-base 2xl:text-lg">
              Processing your file...
            </p>
          </>
        );
      case FileStatus.SUCCESS:
        return <FilterableWineList initialWinelist={wineList} />;
      case FileStatus.ERROR:
        return (
          <>
            <p>Error occurred during file processing.</p>
            <button onClick={() => setFileStatus(FileStatus.IDLE)}>Back</button>
          </>
        );
      case FileStatus.IDLE:
      default:
        return <FormPage />;
    }
  };
  return (
    <>
      <header className="flex bg-gray-800 place-content-center items-center h-16 md:h-20 lg:h-24 xl:h-28">
        <h1 className="text-4xl font-extrabold leading-none tracking-tight text-gray-900 md:text-5xl lg:text-6xl text-transparent bg-clip-text bg-gradient-to-r to-white from-yellow-100">
          Wine List Tool
        </h1>
      </header>
      <main className="w-9/10 md:w-4/5 xl:w-7/10 mt-4 mx-auto">
        {renderContent()}
      </main>
      <footer>{/* <p>----footer text----</p> */}</footer>
    </>
  );
}

export default App;
