import { errorUuid } from '../constants/error-uuid';

export const convertTurnstileErrorUuidToLog = (turnstileErrorUuid: string): string => {
  switch(turnstileErrorUuid) {
    case errorUuid.noTurnstileSecretKey    : return '実装誤り : Turnstile シークレットキー未指定';
    case errorUuid.turnstileValidationError: return 'Turnstile 認証エラー';
    case errorUuid.turnstileNetworkError   : return 'Turnstile 認証中のネットワークエラー';
    default                                : return '実装誤り : Turnstile 認証中の未定義のエラー';  // この文言は出てはならない
  }
};
