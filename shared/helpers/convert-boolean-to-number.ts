import { booleanNumber } from '../constants/boolean-number';

export const convertBooleanToNumber = (value: number | boolean | null | undefined): number => {
  if(value == null) return booleanNumber.false;
  if(typeof value === 'boolean') return value ? booleanNumber.true : booleanNumber.false;
  if(typeof value === 'number') return value === booleanNumber.true ? booleanNumber.true : booleanNumber.false;
  return booleanNumber.false;
};
