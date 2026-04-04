import { booleanNumber } from '../constants/boolean-number';

export const convertNumberToBoolean = (value: number | boolean | null | undefined): boolean => {
  if(value == null) return false;
  if(typeof value === 'boolean') return value;
  return value === booleanNumber.true;
};
