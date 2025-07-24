import { useState } from 'react';
import type { ReactNode } from 'react';
import { WineContext } from './WineContext';
import type { Wine } from '../types';
import { FileStatus } from '../utils/constants';

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
