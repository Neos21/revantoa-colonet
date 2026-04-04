import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { PencilLine } from 'lucide-react';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';

import { apiPaths } from '../../../../shared/constants/api-paths';
import { isEmpty } from '../../../../shared/helpers/is-empty';
import { mergeIssues } from '../../../../shared/helpers/merge-issues';
import { contentMaxLength, newPostSchema, type NewPost } from '../../../../shared/schemas/new-post';
import { turnstileSiteKey } from '../../../shared/constants/turnstile';
import { extractApiErrorMessage } from '../../../shared/helpers/extract-api-error-message';
import { isUnauthorizedError } from '../../../shared/helpers/is-unauthorized-error';
import { userApi } from '../../../shared/helpers/user-api';

type Props = {
  /** 投稿が成功したことを親要素に知らせる */
  onSubmitted: () => void;
};

export default function PostForm({ onSubmitted }: Props): ReactNode {
  const selectPlaceholder = (): string => {
    const messages = [
      '今、何を考えてる？',
      'ふと浮かんだこと…',
      'いまの気分をひとこと。',
      '言葉になりかけのもの',
      '特に意味はなくても…',
      'この時間の気配',
      '少し前から考えてたこと',
      '今日の途中経過'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };
  const [placeholder, setPlaceholder] = useState<string>(selectPlaceholder());
  
  const [form, setForm] = useState<NewPost>({ content: '' });
  
  const [isShowTurnstile, setIsShowTurnstile] = useState<boolean>(false);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const onSubmit = async (event: FormEvent): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    
    const parsed = newPostSchema.safeParse(form);
    if(!parsed.success) {
      setErrorMessage(mergeIssues(parsed.error));
      return setIsSubmitting(false);
    }
    
    try {
      const requestBody = {
        content        : parsed.data.content,
        turnstile_token: turnstileToken
      };
      await userApi.post(apiPaths.posts.route, { json: requestBody }).json();
      
      onSubmitted();  // 成功メッセージを表示してタイムラインを再読込する
      setPlaceholder(selectPlaceholder());
      setForm({ content: '' });  // フォームをリセットする
    }
    catch(error) {
      if(isUnauthorizedError(error)) {
        setErrorMessage('トークンの有効期限が切れています。ログアウトしてから再度ログインしてください');
      }
      else {
        const errorMessage = await extractApiErrorMessage(error, '投稿に失敗しました');
        setErrorMessage(errorMessage);
      }
    }
    finally {
      setTurnstileToken('');  // Turnstile ウィジェット周りをリセットする
      turnstileRef.current?.reset();
      setIsShowTurnstile(false);
      
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="border rounded mt-14 border-base-content/30">
      <div className="flex p-3 rounded gap-x-2"><PencilLine className="text-base-content/65" /> 投稿する</div>
      <div className="px-3 pb-4">
        <form onSubmit={onSubmit}>
          {/* `grid` と `order` を組み合わせて画面幅が狭い場合のレイアウトを調整している */}
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="order-2 mt-2 sm:order-1 sm:col-span-2 sm:mt-auto">
              <textarea rows={3} className="w-full textarea" placeholder={placeholder} maxLength={contentMaxLength} disabled={isSubmitting}
                value={form.content} onChange={event => setForm(prevForm => ({ ...prevForm, content: event.target.value }))}
                onFocus={() => setIsShowTurnstile(true)}/>
            </div>
            <div className="sm:order-2 order-3 mt-3 min-h-[65px]">
              <div className="w-[300px] h-[65px] bg-[#232323] leading-[65px] text-sm text-neutral-content/90 text-center">
                {!isShowTurnstile && '投稿前に一呼吸……'}
                {isShowTurnstile && <Turnstile siteKey={turnstileSiteKey} options={{ language: 'ja' }} ref={turnstileRef} onSuccess={setTurnstileToken} />}
              </div>
            </div>
            <div className="order-1 mt-auto text-right sm:order-3 sm:mt-2 place-content-end">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || isEmpty(turnstileToken) || isEmpty(form.content)}>書いてみる</button>
            </div>
          </div>
          
          {!isEmpty(errorMessage) && <div className="mt-2 text-error">{errorMessage}</div>}
        </form>
      </div>
    </div>
  );
}
