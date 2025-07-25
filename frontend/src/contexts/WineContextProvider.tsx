import type { ReactNode } from 'react';
import { useState } from 'react';
import type { Wine } from '../types';
import { FileStatus } from '../utils/constants';
import { WineContext } from './WineContext';

interface WineContextProviderProps {
  children: ReactNode;
}

function WineContextProvider({ children }: WineContextProviderProps) {
  const [fileStatus, setFileStatus] = useState<string>(FileStatus.IDLE);
  const [wineList, setWineList] = useState<Wine[]>([]);

  return (
    <WineContext.Provider
      value={{ fileStatus, setFileStatus, wineList, setWineList }}
    >
      {children}
    </WineContext.Provider>
  );
}

export default WineContextProvider;
