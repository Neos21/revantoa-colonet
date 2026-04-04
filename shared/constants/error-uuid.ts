/** 削除フラグが立っており評価を更新できないようになっている (タイムライン初期表示時は `votes.is_deleted = 0` なレコードは除外しているため評価ボタンが活性化しているが、押下してサーバエラーを検知したら以降活性化させない) */
export const sharedErrorUuidCannotVote = '0cdf5132-dc0f-d6b4-62a9-cdbae7beb246' as const;
