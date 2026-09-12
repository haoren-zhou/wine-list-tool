import type { ReactNode } from 'react';
import { useState } from 'react';
import type { Wine } from '../types';
import { FileStatus } from '../utils/constants';
import { WineContext } from './WineContext';

interface WineContextProviderProps {
  children: ReactNode;
}

function WineContextProvider({ children }: WineContextProviderProps) {
  const [fileName, setFileName] = useState('');
  const [fileStatus, setFileStatus] = useState<FileStatus>(FileStatus.IDLE);
  const [wineList, setWineList] = useState<Wine[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  return (
    <WineContext.Provider
      value={{
        fileName,
        setFileName,
        fileStatus,
        setFileStatus,
        wineList,
        setWineList,
        errorMessage,
        setErrorMessage,
      }}
    >
      {children}
    </WineContext.Provider>
  );
}

export default WineContextProvider;
