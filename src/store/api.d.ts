import type { AxiosInstance } from 'axios';

declare const api: AxiosInstance & {
  all: <T>(promises: Promise<T>[]) => Promise<T[]>;
};

export default api;
