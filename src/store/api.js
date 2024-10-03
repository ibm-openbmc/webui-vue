// TODO: Work Requird -->
import Axios from 'axios';
//Do not change store import.
//Exact match alias set to support
//dotenv customizations.
import { GlobalStore, AuthenticationStore } from '@/store';

Axios.defaults.headers.common['Accept'] = [
  'application/octet-stream',
  'application/json',
];
Axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const api = Axios.create({
  withCredentials: true,
});

api.interceptors.response.use(undefined, (error) => {
  const globalStore = GlobalStore();
  const authenticationStore = AuthenticationStore();
  let response = error.response;
  // TODO: Provide user with a notification and way to keep system active
  if (response.status == 401) {
    if (response.config.url != 'api/login') {
      window.location = '/login';
      // Commit logout to remove XSRF-TOKEN cookie
      authenticationStore.logoutRemove();
    }
  }

  if (response.status == 403) {
    // Check if action is unauthorized.
    // Toast error message will appear on screen
    // when the action is unauthorized.
    // Hardware deconfiguration is an exception to this
    const url = response.config.url;
    const notGetMethod = response.config.method !== 'get';
    const coreUrl = 'redfish/v1/Systems/system/Processors';
    const memoryUrl = 'redfish/v1/Systems/system/Memory';
    if (!(url.includes(coreUrl) || url.includes(memoryUrl)) && notGetMethod)
      globalStore.setUnauthorized();
  }

  return Promise.reject(error);
});
const constructUrl = (path) => {
  const basePath = '/api'; // The base path for your API
  return `${basePath}${path}`;
};
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
