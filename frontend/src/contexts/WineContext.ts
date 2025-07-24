import { createContext } from 'react';
import type { WineContextType } from '../types';

export const WineContext = createContext<WineContextType | null>(null);
