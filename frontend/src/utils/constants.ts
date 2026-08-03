export const FileStatus = Object.freeze({
  IDLE: 'IDLE',
  PROCESSING: 'PROCESSING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
});

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];
