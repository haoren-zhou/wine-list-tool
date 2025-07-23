import { useState } from 'react';
import { WineContext } from './WineContext';
import { FileStatus } from '../utils/constants';

function WineContextProvider({ children }) {
  const [fileStatus, setFileStatus] = useState(FileStatus.IDLE);
  const [wineList, setWineList] = useState([]);

  return (
    <WineContext.Provider
      value={{ fileStatus, setFileStatus, wineList, setWineList }}
    >
      {children}
    </WineContext.Provider>
  );
}

export default WineContextProvider;
