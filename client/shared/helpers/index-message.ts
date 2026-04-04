import { convertBooleanToNumber } from '../../../shared/helpers/convert-boolean-to-number';
import { convertNumberToBoolean } from '../../../shared/helpers/convert-number-to-boolean';
import { isEmpty } from '../../../shared/helpers/is-empty';

const indexMessageKey = 'index-message'  as const;
const isFirstLoginKey = 'is-first-login' as const;

export const setIndexMessage = (message: string): void => sessionStorage.setItem(indexMessageKey, message);
export const getIndexMessage = (): string | null => {
  const message = sessionStorage.getItem(indexMessageKey);
  sessionStorage.removeItem(indexMessageKey);
  return message;
};

export const setIsFirstLogin = (isFirstLogin: boolean): void => sessionStorage.setItem(isFirstLoginKey, String(convertBooleanToNumber(isFirstLogin)));
export const getIsFirstLogin = (): boolean => {
  const isFirstLoginString = sessionStorage.getItem(isFirstLoginKey);
  sessionStorage.removeItem(isFirstLoginKey);
  if(isEmpty(isFirstLoginString)) return false;
  return convertNumberToBoolean(Number(isFirstLoginString));
};
