/**
 * 日本語を1文字以上含んでいるか否かをチェックする正規表現
 * 
 * `Script=` (`sc`) よりも `Script_extensions=` (`scx`) の方が、約物なども含んでチェックしてくれる
 * `\p{Script=Common}` も約物を含んでいるが入れなくて大丈夫になる
 * `/s` フラグにより改行を含んでも良いものとする
 */
export const containsJapaneseRegExp = (/^.*[\p{Script_Extensions=Hiragana}\p{Script_Extensions=Katakana}\p{Script_Extensions=Han}]+.*$/su);
