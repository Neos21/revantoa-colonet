export const isConstraintError = (error: unknown): boolean => {
  return (error as { message?: string; }).message?.includes?.('SQLITE_CONSTRAINT') ?? false;
};
