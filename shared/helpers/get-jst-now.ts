/** 現在日時について日本時間の `YYYY-MM-DD HH:mm:SS` や `YYYY-MM-DD` を取得する */
export const getJstNow = (dateOnly: boolean = false): string => {
  const jst = new Date(Date.now() + ((new Date().getTimezoneOffset() + (9 /* Hours */ * 60 /* Minutes */)) * 60 /* Seconds */ * 1000 /* Milliseconds */));
  
  const year  = jst.getFullYear();
  const month = String(jst.getMonth() + 1).padStart(2, '0');
  const date  = String(jst.getDate()     ).padStart(2, '0');
  
  if(dateOnly) return `${year}-${month}-${date}`;
  
  const hours   = String(jst.getHours()  ).padStart(2, '0');
  const minutes = String(jst.getMinutes()).padStart(2, '0');
  const seconds = String(jst.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${date} ${hours}:${minutes}:${seconds}`;
};
