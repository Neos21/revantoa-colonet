import { isEmpty } from '../../../../shared/helpers/is-empty';

const adminJwtKey     = 'admin-jwt'     as const;
const adminMessageKey = 'admin-message' as const;

export const saveJwt = (jwt: string): void => localStorage.setItem(adminJwtKey, jwt);
export const getJwt = (): string | null => localStorage.getItem(adminJwtKey);
export const removeJwt = (): void => localStorage.removeItem(adminJwtKey);
export const isAuthenticated = (): boolean => !isEmpty(getJwt());
export const setUnauthorizedMessage = (): void => sessionStorage.setItem(adminMessageKey, 'ログインし直してください');
export const getUnauthorizedMessage = (): string | null => {
  const message = sessionStorage.getItem(adminMessageKey);
  sessionStorage.removeItem(adminMessageKey);
  return message;
};
