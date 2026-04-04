export type Result<T> = { result: T; error?: undefined; } | { result?: undefined; error: string; };
