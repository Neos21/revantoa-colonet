import { customAlphabet } from 'nanoid';

/** 数字のみ20桁を出力する */
const generateRecoveryCode = customAlphabet('0123456789', 20);

// 出力個数の指定があればそれに合わせて出力する・未指定時は1件だけ出力する
const arg = Number(process.argv[2]);
const number = Number.isNaN(arg) || arg <= 0 ? 1 : arg;

for(let index = 0; index < number; index++) {
  const rawRecoveryCode = generateRecoveryCode();
  /** 4桁ごとにハイフンを付与する (DB 登録はハイフンありで行っておいて検証時は除去する) */
  const formattedRecoveryCode = rawRecoveryCode.match((/.{1,4}/g))!.join('-');
  console.log(formattedRecoveryCode);
}
