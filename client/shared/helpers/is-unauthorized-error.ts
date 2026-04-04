import { isHTTPError } from 'ky';

export const isUnauthorizedError = (error: unknown): boolean => isHTTPError(error) && error.response.status === 401;
