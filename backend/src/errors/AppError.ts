export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly friendlyMessage: string;
  public readonly errorId: string;
  public readonly details?: Record<string, unknown>;

  constructor({
    code,
    message,
    friendlyMessage,
    statusCode,
    errorId = cryptoRandomId(),
    details
  }: {
    code: ErrorCode;
    message: string;
    friendlyMessage: string;
    statusCode: number;
    errorId?: string;
    details?: Record<string, unknown>;
  }) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.friendlyMessage = friendlyMessage;
    this.errorId = errorId;
    this.details = details;
  }
}

function cryptoRandomId(): string {
  return `err_${Math.random().toString(36).slice(2, 10)}`;
}
