import Axios from 'axios';
//Do not change store import.
//Exact match alias set to support
//dotenv customizations.
import stores from '@/store';
import router from '@/router';
import { buildApiPath } from '@/utilities/url';

Axios.defaults.headers.common['Accept'] = [
  'application/octet-stream',
  'application/json',
];
Axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const api = Axios.create({
  withCredentials: true,
});

const constructUrl = (path) => {
  if (import.meta.env.DEV) {
    return `/api${path}`;
  }

  return buildApiPath(path);
};

api.interceptors.response.use(undefined, (error) => {
  const globalStore = stores.GlobalStore();
  const authenticationStore = stores.AuthenticationStore();
  const response = error.response;

  if (response?.status == 401) {
    if (response.config.url != 'api/login') {
      router.replace('/login');
      authenticationStore.logoutRemove();
    }
  }

  if (response?.status == 403) {
    const notGetMethod = response.config.method !== 'get';
    if (notGetMethod) {
      globalStore.setUnauthorized();
    }
  }

  return Promise.reject(error);
});
export default {
  get(path, config) {
    return api.get(constructUrl(path), config);
  },
  delete(path, config) {
    return api.delete(constructUrl(path), config);
  },
  post(path, payload, config) {
    return api.post(constructUrl(path), payload, config);
  },
  patch(path, payload, config) {
    return api.patch(constructUrl(path), payload, config);
  },
  put(path, payload, config) {
    return api.put(constructUrl(path), payload, config);
  },
  all(promises) {
    return Axios.all(promises);
  },
  spread(callback) {
    return Axios.spread(callback);
  },
};

export const getResponseCount = (responses) => {
  let successCount = 0;
  let errorCount = 0;

  responses.forEach((response) => {
    if (response instanceof Error) errorCount++;
    else successCount++;
  });

  return {
    successCount,
    errorCount,
  };
};
