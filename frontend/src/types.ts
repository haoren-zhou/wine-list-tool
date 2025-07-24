import type { Dispatch, SetStateAction } from 'react';

export interface Wine {
  wine_name: string;
  vivino_match: string;
  rating_average: number;
  rating_count: number;
  type_id: number;
  style_id: number;
  grapes: number[];
  vintage: number;
  price: number;
  volume: number;
  type_name: string;
  style_name: string;
  grapes_name: string;
}

export interface WineContextType {
  wineList: Wine[];
  setWineList: Dispatch<SetStateAction<Wine[]>>;
  fileStatus: string;
  setFileStatus: Dispatch<SetStateAction<string>>;
}
