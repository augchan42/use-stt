import type { STTErrorData, STTProvider } from './types';

export class STTError extends Error {
  code: string;
  provider?: STTProvider;

  constructor(data: STTErrorData) {
    super(data.message);
    this.name = 'STTError';
    this.code = data.code;
    this.provider = data.provider;
  }
}

export const STTErrorCodes = {
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NO_SPEECH: 'NO_SPEECH',
  NETWORK_ERROR: 'NETWORK_ERROR',
  SERVICE_ERROR: 'SERVICE_ERROR',
  ABORTED: 'ABORTED',
  INVALID_API_KEY: 'INVALID_API_KEY',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
} as const;

export type STTErrorCode = keyof typeof STTErrorCodes; 