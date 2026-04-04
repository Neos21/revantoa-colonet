import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UserState = {
  jwt: string | null;
  name: string | null;
  setAuth: (jwt: string, name: string) => void;
  logout: () => void;
};

export const useUserStore = create<UserState>()(
  persist(
    set => ({
      jwt: null,
      name: null,
      setAuth: (jwt, name): unknown => set({ jwt, name }),
      logout: (): unknown => set({ jwt: null, name: null })
    }),
    {
      name: 'user-store'  // LocalStorage のキー名・Zustand によってインメモリと LocalStorage をうまく同期してくれる
    }
  )
);
