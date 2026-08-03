export const FileStatus = Object.freeze({
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
});

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];

/** Slider position representing "no price limit" in the price filter. */
export const MAX_PRICE_SLIDER_VALUE = 3005;
