import Axios from 'axios';
//Do not change store import.
//Exact match alias set to support
//dotenv customizations.
import store from '../store';
import router from '@/router';

Axios.defaults.headers.common['Accept'] = [
  'application/octet-stream',
  'application/json',
];
Axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const api = Axios.create({
  baseURL: window.location.origin + window.location.pathname,
  withCredentials: true,
});

api.interceptors.response.use(undefined, (error) => {
  let response = error.response;

  // TODO: Provide user with a notification and way to keep system active
  if (response.status == 401) {
    if (response.config.url !== '/login') {
      // Commit logout to remove XSRF-TOKEN cookie
      store.commit('authentication/logout');
      router.replace('/login');
    }
  }

  if (response.status == 403) {
    // Check if action is unauthorized.
    // Toast error message will appear on screen
    // when the action is unauthorized.
    // Hardware deconfiguration is an exception to this
    const url = response.config.url;
    const coreUrl = 'redfish/v1/Systems/system/Processors';
    const memoryUrl = 'redfish/v1/Systems/system/Memory';
    if (!(url.includes(coreUrl) || url.includes(memoryUrl)))
      store.commit('global/setUnauthorized');
  }

  return Promise.reject(error);
});

export default {
  get(path) {
    return api.get(path);
  },
  delete(path, payload) {
    return api.delete(path, payload);
  },
  post(path, payload, config) {
    return api.post(path, payload, config);
  },
  patch(path, payload) {
    return api.patch(path, payload);
  },
  put(path, payload) {
    return api.put(path, payload);
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
