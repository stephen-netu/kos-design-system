// Transport error types

export enum TransportErrorCode {
  InvokeFailed = 'INVOKE_FAILED',
  ConnectionLost = 'CONNECTION_LOST',
  Timeout = 'TIMEOUT',
  NotAvailable = 'NOT_AVAILABLE',
}

export class TransportError extends Error {
  constructor(
    public code: TransportErrorCode,
    message: string,
    public original?: unknown
  ) {
    super(message);
    this.name = 'TransportError';
  }
}

export function toTransportError(error: unknown): TransportError {
  if (error instanceof TransportError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('timeout') || message.includes('Timeout')) {
    return new TransportError(TransportErrorCode.Timeout, message, error);
  }

  if (message.includes('connection') || message.includes('Connection')) {
    return new TransportError(TransportErrorCode.ConnectionLost, message, error);
  }

  return new TransportError(TransportErrorCode.InvokeFailed, message, error);
}
