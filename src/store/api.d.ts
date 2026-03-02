import type { AxiosInstance } from 'axios';

declare const api: AxiosInstance & {
  all: <T>(promises: Promise<T>[]) => Promise<T[]>;
  spread: <T, R>(callback: (...args: T[]) => R) => (array: T[]) => R;
};

export default api;
