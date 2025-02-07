//TODO: Work Requird -->
import { defineStore } from 'pinia';
import api from '@/store/api';
import { useCookies } from 'vue3-cookies';
// import { useRouter } from 'vue-router';
import Cookies from 'js-cookie';
const { cookies } = useCookies();
// const router = useRouter();

export const AuthenticationStore = defineStore('authentication', {
  state: () => ({
    loginPageDetails: {},
    consoleWindow: null,
    authError: null,
    xsrfCookie: cookies.get('XSRF-TOKEN'),
    isAuthenticatedCookie: cookies.get('IsAuthenticated'),
    bmcTime: '',
  }),
  getters: {
    loginPageDetailsGetter: (state) => state.loginPageDetails,
    getConsoleWindow: (state) => state.consoleWindow,
    getAuthError: (state) => state.authError,
    isLoggedIn: (state) => {
      //Change null to undefined once the cookies value able to get
      return state.xsrfCookie !== null || state.isAuthenticatedCookie == 'true';
    },
    token: (state) => state.xsrfCookie,
  },
  actions: {
    authSuccess() {
      this.authError = false;
      this.xsrfCookie = Cookies.get('XSRF-TOKEN');
    },
    setLoginPageDetails(loginPageDetails) {
      this.loginPageDetails = loginPageDetails;
    },
    setauthError(authError = true) {
      this.authError = authError;
    },
    logoutRemove() {
      cookies.remove('XSRF-TOKEN');
      cookies.remove('IsAuthenticated');
      localStorage.removeItem('storedUsername');
      //Change null to undefined once the cookies value able to get
      this.xsrfCookie = null;
      this.isAuthenticatedCookie = undefined;
    },
    setConsoleWindow(window) {
      this.consoleWindow = window;
    },
    login(username, password) {
      this.$state.authError = false;
      return api
        .post('/login', {
          data: [username, password],
        })
        .then((response) => {
          this.authSuccess();
          this.$state.authError = false;
        })
        .catch((error) => {
          this.$state.authError = true;
          throw new Error(error);
        });
    },
    logout() {
      const headers = {
        'X-Xsrf-Token': cookies.get('X-XSRF-TOKEN'),
      };
      Cookies.remove('XSRF-TOKEN');
      Cookies.remove('IsAuthenticated');
      localStorage.removeItem('storedModelType');
      localStorage.removeItem('storedUsername');
      localStorage.removeItem('storedCurrentUser');
      localStorage.removeItem('storedHmcManagedValue');
      localStorage.removeItem('storedLanguage');
      this.xsrfCookie = undefined;
      this.isAuthenticatedCookie = undefined;
      return api
        .post('/logout', { data: [] }, { headers: headers })
        .then(() => {
          this.setConsoleWindow(false);
          this.logoutRemove();
          // router.push('/login');
        })
        .catch((error) => {
          console.log(error);
          this.logoutRemove();
        });
    },
    getUserInfo(username) {
      return api
        .get(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(({ data }) => data)
        .catch((error) => console.log(error));
    },
    async getBmcTime() {
      return await api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          this.$state.bmcTime = response.data.DateTime;
          const cookie = Cookies.get('XSRF-TOKEN');
        })
        .catch((error) => console.log(error));
    },
    async dateAndTime() {
      return api
        .get(`/redfish/v1/`)
        .then((response) => response.data.Oem.IBM)
        .then((data) => {
          const loginPageDetails = {
            dateTime: new Date(data.DateTime),
            model: data.Model,
            serial: data.SerialNumber,
            acfWindowActive: data.ACFWindowActive,
          };
          this.setLoginPageDetails(loginPageDetails);
        })
        .catch((error) => console.log(error));
    },
    resetStoreState() {
      this.authError = false;
      this.xsrfCookie = cookies.get('XSRF-TOKEN');
      this.isAuthenticatedCookie = cookies.get('IsAuthenticated');
    },
  },
});

export default AuthenticationStore;
