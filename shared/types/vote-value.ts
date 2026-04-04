export type VoteValueUpVote    = 1;
export type VoteValueDownVote  = -1;

/** DB にはこの値を記録しないが `SELECT` 時に「キャンセルされた評価がある」ことを示すために使用する */
export type VoteValueCancelled = 0;
