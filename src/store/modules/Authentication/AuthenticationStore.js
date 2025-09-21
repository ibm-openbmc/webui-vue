import { defineStore } from 'pinia';
import api from '@/store/api';
import { useCookies } from 'vue3-cookies';
import Cookies from 'js-cookie';
const { cookies } = useCookies();

export const AuthenticationStore = defineStore('authentication', {
  state: () => ({
    loginPageDetails: {},
    authError: false,
    unauthError: false,
    xsrfCookie: cookies.get('XSRF-TOKEN'),
    isAuthenticatedCookie: cookies.get('IsAuthenticated'),
  }),
  getters: {
    loginPageDetailsGetter: (state) => state.loginPageDetails,
    authErrorGetter: (state) => state.authError,
    unauthErrorGetter: (state) => state.unauthError,
    isLoggedIn: (state) => {
      //Change null to undefined once the cookies value able to get
      return state.xsrfCookie !== null || state.isAuthenticatedCookie == 'true';
    },
    token: (state) => state.xsrfCookie,
  },
  actions: {
    authSuccess() {
      this.authError = false;
      this.unauthError = false;
      this.xsrfCookie = Cookies.get('XSRF-TOKEN');
    },
    setLoginPageDetails(loginPageDetails) {
      this.loginPageDetails = loginPageDetails;
    },
    logoutRemove() {
      cookies.remove('XSRF-TOKEN');
      cookies.remove('IsAuthenticated');
      localStorage.removeItem('storedUsername');
      //Change null to undefined once the cookies value able to get
      this.xsrfCookie = null;
      this.isAuthenticatedCookie = undefined;
    },
    login({ username, password }) {
      this.authError = false;
      this.unauthError = false;
      return api
        .post('/login', { data: [username, password] })
        .then(() => this.authSuccess())
        .catch((error) => {
          this.authError = true;
          throw new Error(error);
        });
    },
    getUserInfo(username) {
      return api
        .get(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(({ data }) => data)
        .catch((error) => console.log(error));
    },
    unauthlogin() {
      this.unauthError = true;
    },
    logout() {
      const headers = {
        'X-Xsrf-Token': cookies.get('X-XSRF-TOKEN'),
      };
      return api
        .post('/logout', { data: [] }, { headers: headers })
        .then(() => {
          Cookies.remove('XSRF-TOKEN');
          Cookies.remove('IsAuthenticated');
          localStorage.removeItem('storedModelType');
          localStorage.removeItem('storedUsername');
          localStorage.removeItem('storedCurrentUser');
          localStorage.removeItem('storedHmcManagedValue');
          localStorage.removeItem('storedLanguage');
          this.xsrfCookie = undefined;
          this.isAuthenticatedCookie = undefined;
        })
        .then(() => {
          this.logoutRemove();
        })
        .catch((error) => {
          console.log(error);
          this.logoutRemove();
        });
    },
    async checkPasswordChangeRequired(username) {
      return api
        .get(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(({ data: { PasswordChangeRequired } }) => {
          return PasswordChangeRequired;
        })
        .catch((error) => {
          console.log(error);
        });
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
      this.unauthError = false;
      this.xsrfCookie = cookies.get('XSRF-TOKEN');
      this.isAuthenticatedCookie = cookies.get('IsAuthenticated');
    },
  },
});

export default AuthenticationStore;
