import { pagePaths } from '../client/shared/constants/page-paths';
import app from '../server/index';
import { apiPaths } from '../shared/constants/api-paths';

const collectHonoRoutes = (honoRoutes: Array<{ path: string; method: string; }>): string => {
  /** ルート定義をまとめるオブジェクト・キーはパス・値はメソッドの配列とする */
  const routes: Record<string, Array<string>> = {};
  // Hono の `Array<RouterRoute>` を辿ってオブジェクトに入れていく
  honoRoutes.forEach(honoRoute => {
    if(honoRoute.method === 'ALL') return;
    if(Object.hasOwn(routes, honoRoute.path) && !routes[honoRoute.path].includes(honoRoute.method)) routes[honoRoute.path].push(honoRoute.method);
    else routes[honoRoute.path] = [honoRoute.method];
  });
  /** メソッドの並び順を決めるためのマップ */
  const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'].reduce((accumulator, methodName, index) => {
    accumulator[methodName] = index;
    return accumulator;
  }, {} as Record<string, number>);
  /** 縦位置を揃えて出力するためパスの最長文字列をカウントする */
  const pathMaxLength = Math.max(...Object.keys(routes).map(path => path.length));
  // メソッドの登場順を揃えつつルート定義を出力する
  return Object.entries(routes).map(([path, methods]) => `- ${path.padEnd(pathMaxLength)} : ${methods.sort((methodA, methodB) => methodOrder[methodA] - methodOrder[methodB]).join('・')}`).join('\n');
};

const collectRoutes = (paths: unknown): string => {
  const routes = new Set<string>();
  
  const visit = (object: unknown): void => {
    if(object != null && typeof object === 'object') {
      for(const key in object as Record<string, unknown>) {
        const value = (object as Record<string, unknown>)[key];
        if(key === 'route' && typeof value === 'string' && !routes.has(value)) routes.add(`- ${value}`);
        if(value != null && typeof value === 'object') visit(value);
      }
    }
  };
  
  visit(paths);
  return Array.from(routes).join('\n');
};

console.log(
  '\n'
  + '# Hono Routes :\n\n'
  + collectHonoRoutes(app.routes)
  + '\n\n'
  + '# API Endpoints :\n\n'
  + collectRoutes(apiPaths)
  + '\n\n'
  + '# Frontend Routes :\n\n'
  + collectRoutes(pagePaths)
);
