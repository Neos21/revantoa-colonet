/** 引数が `undefined`・`null`・文字列型とみなしてトリムして空文字か否かを判定する */
export const isEmpty = (value: unknown): boolean => value == null || value === '' || String(value).trim().length === 0;
