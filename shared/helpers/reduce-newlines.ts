/**
 * 3つ以上連続する改行を2つに置換する
 * 
 * CR・CRLF を LF に統一してから処理する
 */
export const reduceNewlines = (value: string): string => value.replace((/\r\n|\r/g), '\n').replace((/\n{3,}/g), '\n\n');
