import { useContext } from 'react';
import { WineContext } from '../contexts/WineContext';
import type { WineContextType } from '../types';

export function useWineContext(): WineContextType {
  const context = useContext(WineContext);

  if (context === null) {
    throw new Error('useWineContext must be used within a WineContextProvider');
  }

  return context;
}
