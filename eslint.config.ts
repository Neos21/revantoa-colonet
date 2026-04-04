import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import pluginReact from 'eslint-plugin-react';
import tailwindcss from 'eslint-plugin-tailwindcss';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    plugins: {
      js,  // 標準ルール
      import: importPlugin
    },
    extends: ['js/recommended'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      // TypeScript ルールを厳格化した時に `@typescript-eslint/await-thenable` 絡みでエラーが出るのを回避する https://stackoverflow.com/questions/58510287/parseroptions-project-has-been-set-for-typescript-eslint-parser
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      // `import` 文を整理する
      'import/order': [
        'error',
        {
          groups: [
            ['builtin', 'external'],
            ['internal'],
            ['parent', 'sibling', 'index'],
            ['type']
          ],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true }
        }
      ]
    }
  },
  tseslint.configs.recommended,  // TypeScript 用の推奨ルール
  //tseslint.configs.recommendedTypeChecked,  // TypeScript 用の推奨ルールをベースに、型チェックを厳格化したルール
  //tseslint.configs.strictTypeChecked,  // TypeScript 用の超厳格ルール
  //tseslint.configs.stylisticTypeChecked,  // TypeScript 用のスタイル関連のルール
  {
    rules: {
      // 関数の戻り値の定義を必須化する
      '@typescript-eslint/explicit-function-return-type': ['error', {
        // 即時関数は型定義の省略を許可する
        allowIIFEs: true
      }]
    }
  },
  {
    ...pluginReact.configs.flat.recommended,  // React 向けルール
    rules: {
      'react/react-in-jsx-scope': 'off'  // `'React' must be in scope when using JSX` エラーを無視する
    },
    settings: {
      react: {
        version: 'detect'  // `React version not specified in eslint-plugin-react settings` ワーニングを非表示にするための指定
      }
    }
  },
  ...tailwindcss.configs['flat/recommended'],  // Tailwind CSS のクラス名を検証する
  {
    settings: {
      tailwindcss: {
        config: false  // `Cannot resolve default tailwindcss config path. Please manually set the config option.` ワーニングを無視する (`eslint-plugin-tailwindcss` が v3 系で存在した `tailwind.config.js` を探しに行ってしまうのを無視する)
      }
    },
    rules: {
      'tailwindcss/classnames-order': 'off',  // 自動整列をオフにする (VSCode 拡張機能 Headwind に任せる)
      'tailwindcss/no-custom-classname': 'off'  // カスタム CSS 名を許可する
    }
  },
  {
    ignores: ['node_modules/**', '.wrangler/**', '.react-router/**', 'build/**', 'report/**', 'worker-configuration.d.ts']  // チェックしないディレクトリ・ファイルを指定する
  }
]);
