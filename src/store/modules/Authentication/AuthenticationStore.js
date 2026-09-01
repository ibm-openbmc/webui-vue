import { defineStore } from 'pinia';
import api from '@/store/api';
import { useCookies } from 'vue3-cookies';
import Cookies from 'js-cookie';
import router from '@/router';
import { useQueryClient } from '@tanstack/vue-query';
const { cookies } = useCookies();

export const AuthenticationStore = defineStore('authentication', {
  state: () => ({
    loginPageDetails: {},
    authError: false,
    unauthError: false,
    xsrfCookie: cookies.get('XSRF-TOKEN'),
    isAuthenticatedCookie: cookies.get('IsAuthenticated'),
    isGenerateOtpRequired: false,
    isGlobalMfaEnabled: false,
    currentSessionUri: localStorage.getItem('currentSessionUri') || null,
  }),
  getters: {
    loginPageDetailsGetter: (state) => state.loginPageDetails,
    authErrorGetter: (state) => state.authError,
    unauthErrorGetter: (state) => state.unauthError,
    isLoggedIn: (state) => {
      //Change null to undefined once the cookies value able to get
      return state.xsrfCookie !== null || state.isAuthenticatedCookie == 'true';
    },
    isGlobalMfaEnabledGetter: (state) => state.isGlobalMfaEnabled,
    isGenerateOtpRequiredGetter: (state) => state.isGenerateOtpRequired,
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
      localStorage.removeItem('currentSessionUri');
      //Change null to undefined once the cookies value able to get
      this.xsrfCookie = null;
      this.isAuthenticatedCookie = undefined;
      this.currentSessionUri = null;
    },
    login({ username, password, otpInfo }) {
      this.isGenerateOtpRequired = false;
      this.authError = false;
      this.unauthError = false;
      let requestBody = {};
      if (otpInfo === '') {
        requestBody = { UserName: username, Password: password };
      } else {
        requestBody = {
          UserName: username,
          Password: password,
          Token: otpInfo,
        };
      }
      return api
        .post('/redfish/v1/SessionService/Sessions', requestBody)
        .then((response) => {
          if (
            response.data['@Message.ExtendedInfo'] &&
            response.data['@Message.ExtendedInfo'][0].MessageId.endsWith(
              'GenerateSecretKeyRequired',
            )
          ) {
            this.isGenerateOtpRequired = true;
          }
          // Store the current session URI from the response
          const sessionUri =
            response.headers?.location || response.data?.['@odata.id'];
          if (sessionUri) {
            this.currentSessionUri = sessionUri;
            localStorage.setItem('currentSessionUri', sessionUri);
          }
          this.authSuccess();
        })
        .catch((error) => {
          this.authError = true;
          throw new Error(error);
        });
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
          localStorage.removeItem('currentSessionUri');
          this.xsrfCookie = undefined;
          this.isAuthenticatedCookie = undefined;
          this.currentSessionUri = null;

          // Clear TanStack Query cache and sessionStorage for system info
          const queryClient = useQueryClient();
          queryClient.removeQueries({
            queryKey: ['redfish', 'system', 'info'],
          });
          sessionStorage.removeItem('systemInfoCache');
        })
        .then(() => {
          this.logoutRemove();
          router.replace('/login');
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
          this.isGlobalMfaEnabled = data.MultiFactorAuthEnabled;
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
