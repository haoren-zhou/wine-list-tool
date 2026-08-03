import type { Dispatch, SetStateAction } from 'react';
import type { FileStatus } from './utils/constants';

export interface Wine {
  wine_name: string;
  vivino_match: string;
  rating_average: number;
  rating_count: number;
  vintage: number | string | null;
  price: number;
  volume: number;
  type_id: number;
  style_id: number;
  grapes: number[] | null;
  type_name: string;
  style_name: string;
  grapes_name: string;
  match_coefficient: number;
}

export interface WineContextType {
  wineList: Wine[];
  setWineList: Dispatch<SetStateAction<Wine[]>>;
  fileStatus: FileStatus;
  setFileStatus: Dispatch<SetStateAction<FileStatus>>;
  errorMessage: string | null;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
}
