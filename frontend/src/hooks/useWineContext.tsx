import { useContext } from 'react';
import { WineContext } from '../contexts/WineContext';

export function useWineContext() {
  return useContext(WineContext);
}
