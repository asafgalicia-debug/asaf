// Categorize failures without exposing raw messages, stacks, documents or connection URIs.
export function classifyError(error: unknown): string {
  if (!(error instanceof Error)) return 'unknown';
  const allowed: Record<string, string> = {
    MongoServerSelectionError: 'database_selection', MongoNetworkError: 'database_network',
    MongoNetworkTimeoutError: 'database_timeout', MongoServerError: 'database_server',
    CastError: 'database_cast', ValidationError: 'database_validation',
    MissingSchemaError: 'database_schema', TypeError: 'type_error', ReferenceError: 'reference_error'
  };
  return allowed[error.name] ?? 'unexpected';
}
