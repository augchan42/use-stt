import { STTOptions, STTResult, STTError } from '../core/types';

export abstract class BaseAdapter {
  protected options: STTOptions;
  
  constructor(options: STTOptions) {
    this.options = options;
  }
  
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
  abstract pause(): Promise<void>;
  abstract resume(): Promise<void>;
  abstract abort(): void;
  
  abstract onResult(callback: (result: STTResult) => void): void;
  abstract onError(callback: (error: STTError) => void): void;
  abstract onStart(callback: () => void): void;
  abstract onEnd(callback: () => void): void;
}
