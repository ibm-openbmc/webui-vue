import api from '@/store/api';
import Cookies from 'js-cookie';
import router from '@/router';

const AuthenticationStore = {
  namespaced: true,
  state: {
    loginPageDetails: {},
    authError: false,
    unauthError: false,
    xsrfCookie: localStorage.getItem('xAuthToken'),
    sessionURI: localStorage.getItem('sessionURI'),
    isAuthenticatedCookie: Cookies.get('IsAuthenticated'),
    isGenerateOtpRequired: false,
    isGlobalMfaEnabled: false,
    xAuthToken: null,
  },
  getters: {
    loginPageDetails: (state) => state.loginPageDetails,
    authError: (state) => state.authError,
    unauthError: (state) => state.unauthError,
    isGenerateOtpRequired: (state) => state.isGenerateOtpRequired,
    isGlobalMfaEnabled: (state) => state.isGlobalMfaEnabled,
    isLoggedIn: (state) => {
      return (
        state.xsrfCookie !== undefined ||
        state.isAuthenticatedCookie == 'true' ||
        state.xAuthToken !== null
      );
    },
    token: (state) => state.xsrfCookie,
  },
  mutations: {
    setIsGlobalMfaEnabled: (state, isGlobalMfaEnabled) =>
      (state.isGlobalMfaEnabled = isGlobalMfaEnabled),
    setIsGenerateOtpRequired: (state, isGenerateOtpRequired) =>
      (state.isGenerateOtpRequired = isGenerateOtpRequired),
    setLoginPageDetails: (state, loginPageDetails) =>
      (state.loginPageDetails = loginPageDetails),
    authSuccess(state, { session, token }) {
      state.authError = false;
      state.unauthError = false;
      localStorage.setItem('sessionURI', session);
      state.sessionURI = session;
      if (state.xsrfCookie === undefined) {
        localStorage.setItem('xAuthToken', token);
        api.set_auth_token(token);
        state.xAuthToken = token;
      }
    },
    authError(state, authError = true) {
      state.authError = authError;
    },
    unauthError(state, unauthError = true) {
      state.unauthError = unauthError;
    },
    logout(state) {
      localStorage.removeItem('xAuthToken');
      api.set_auth_token(undefined);
      localStorage.removeItem('sessionURI');
      state.sessionURI = null;
      state.xsrfCookie = undefined;
      Cookies.remove('IsAuthenticated');
      state.xAuthToken = null;
      localStorage.removeItem('storedModelType');
      localStorage.removeItem('storedUsername');
      localStorage.removeItem('storedCurrentUser');
      localStorage.removeItem('storedHmcManagedValue');
      localStorage.removeItem('storedLanguage');
      state.isAuthenticatedCookie = undefined;
    },
  },
  actions: {
    login({ state, commit }, { username, password, otpInfo }) {
      commit('setIsGenerateOtpRequired', false);
      commit('authError', false);
      commit('unauthError', false);
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
          state.xAuthToken = response.headers['x-auth-token'];
          if (
            response.data['@Message.ExtendedInfo'] &&
            response.data['@Message.ExtendedInfo'][0].MessageId.endsWith(
              'GenerateSecretKeyRequired'
            )
          ) {
            commit('setIsGenerateOtpRequired', true);
          }
          api.set_auth_token(response.headers['x-auth-token']);
          commit('authSuccess', {
            session: response.headers['location'],
            token: response.headers['x-auth-token'],
          });
        })
        .catch((error) => {
          commit('authError');
          throw new Error(error);
        });
    },
    unauthlogin({ commit }) {
      commit('unauthError');
    },
    logout({ commit }) {
      api
        .post('/logout', { data: [] })
        .then(() => commit('logout'))
        .then(() => router.replace('/login'))
        .catch((error) => console.log(error));
    },
    async checkPasswordChangeRequired(_, username) {
      return api
        .get(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(({ data: { PasswordChangeRequired } }) => {
          return PasswordChangeRequired;
        })
        .catch((error) => {
          console.log(error);
        });
    },
    async dateAndTime({ commit }) {
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
          commit('setLoginPageDetails', loginPageDetails);
          commit('setIsGlobalMfaEnabled', data.MultiFactorAuthEnabled);
        })
        .catch((error) => console.log(error));
    },
    resetStoreState({ state }) {
      state.authError = false;
      state.unauthError = false;
      state.xsrfCookie = undefined;
      state.isAuthenticatedCookie = Cookies.get('IsAuthenticated');
    },
  },
};

export default AuthenticationStore;
