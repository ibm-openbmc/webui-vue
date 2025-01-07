//TODO: Work Requird -->
import api from '@/store/api';
import { defineStore } from 'pinia';

const HOST_STATE = {
  on: 'xyz.openbmc_project.State.Host.HostState.Running',
  off: 'xyz.openbmc_project.State.Host.HostState.Off',
  error: 'xyz.openbmc_project.State.Host.HostState.Quiesced',
  diagnosticMode: 'xyz.openbmc_project.State.Host.HostState.DiagnosticMode',
};

const serverStateMapper = (hostState) => {
  switch (hostState) {
    case HOST_STATE.on:
    case 'On': // Redfish PowerState
      return 'on';
    case HOST_STATE.off:
    case 'Off': // Redfish PowerState
      return 'off';
    case HOST_STATE.error:
    case 'Quiesced': // Redfish Status
      return 'error';
    case HOST_STATE.diagnosticMode:
    case 'InTest': // Redfish Status
      return 'diagnosticMode';
    default:
      return 'unreachable';
  }
};

export const GlobalStore = defineStore('global', {
  state: () => ({
    assetTag: null,
    bmcTime: null,
    bootProgress: null,
    acfInstalled: false,
    expirationDate: null,
    modelType: localStorage.getItem('storedModelType') || '--',
    serialNumber: null,
    safeMode: null,
    serverStatus: 'unreachable',
    postCodeValue: null,
    languagePreference: localStorage.getItem('storedLanguage') || 'en-US',
    isUtcDisplay: localStorage.getItem('storedUtcDisplay')
      ? JSON.parse(localStorage.getItem('storedUtcDisplay'))
      : true,
    username: localStorage.getItem('storedUsername'),
    currentUser: JSON.parse(localStorage.getItem('storedCurrentUser')),
    isAuthorized: true,
    hmcManaged: localStorage.getItem('storedHmcManagedValue') || null,
    isServiceLoginEnabled: false,
  }),
  getters: {
    bootProgressGetter: (state) => state.bootProgress,
    isInPhypStandby: (state) =>
      // SystemHardwareInitializationComplete and after is "PHYP in standby"
      state.bootProgress === 'SystemHardwareInitializationComplete' ||
      state.bootProgress === 'SetupEntered' ||
      state.bootProgress === 'OSBootStarted' ||
      state.bootProgress === 'OSRunning',
    isOSRunningGetter: (state) => state.bootProgress === 'OSRunning',
    assetTagGetter: (state) => state.assetTag,
    modelTypeGetter: (state) => state.modelType,
    serialNumberGetter: (state) => state.serialNumber,
    getIsUtcDisplay: (state) => state.isUtcDisplay,
    safeModeGetter: (state) => state.safeMode,
    postCodeValueGetter: (state) => state.postCodeValue,
    bmcTimeGetter: (state) => state.bmcTime,
    acfInstalledGetter: (state) => state.acfInstalled,
    expirationDateGetter: (state) => state.expirationDate,
    languagePreferenceGetter: (state) => state.languagePreference,
    isUtcDisplayGetter: (state) => state.isUtcDisplay,
    serverStatusGetter: (state) => state.serverStatus,
    usernameGetter: (state) => state.username,
    hmcManagedGetter: (state) => state.hmcManaged,
    currentUserGetter: (state) => state.currentUser,
    isServiceUser: (state) =>
      state.currentUser?.RoleId === 'OemIBMServiceAgent' || !state.currentUser,
    isAdminUser: (state) =>
      state.currentUser?.RoleId === 'Administrator' || !state.currentUser,
    isReadOnlyUser: (state) =>
      state.currentUser?.RoleId === 'ReadOnly' || !state.currentUser,
    isAuthorizedGetter: (state) => state.isAuthorized,
    isServiceLoginEnabledGetter: (state) => state.isServiceLoginEnabled,
  },
  actions: {
    async getBmcTime() {
      return await api
        .get('/redfish/v1/Managers/bmc')
        .then((response) => {
          const bmcDateTime = response.data.DateTime;
          const date = new Date(bmcDateTime);
          this.bmcTime = date;
        })
        .catch((error) => console.log(error));
    },
    async getServiceLogin() {
      return await api
        .get('/redfish/v1/AccountService/Accounts/service')
        .then((response) => {
          this.acfInstalled = response.data.Oem.IBM.ACF.ACFInstalled;
          this.expirationDate = response.data.Oem.IBM.ACF.ExpirationDate;
          this.isServiceLoginEnabled = response.data.Enabled;
        })
        .catch((error) => console.log(error));
    },
    getCurrentUser(username = localStorage.getItem('storedUsername')) {
      if (localStorage.getItem('storedCurrentUser')) return;
      return api
        .get(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(({ data }) => {
          this.currentUser = data;
          localStorage.setItem(
            'storedCurrentUser',
            JSON.stringify(this.currentUser)
          );
        })
        .catch((error) => {
          console.log(error);
          this.getAccountService();
        });
    },
    getAccountService() {
      return api
        .get('/redfish/v1/AccountService')
        .then((response) => {
          if (response.data?.LDAP?.RemoteRoleMapping?.length > 0) {
            return Promise.resolve();
          }
        })
        .catch(() => {
          return Promise.reject();
        });
    },
    async getHmcManaged() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const hmcMananged = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_hmc_managed'
          );
          let hmcManangedValue = hmcMananged[0].CurrentValue;
          this.hmcManaged = hmcManangedValue;
          localStorage.setItem('storedHmcManagedValue', hmcManangedValue);
        })
        .catch((error) => console.log(error));
    },
    getSystemInfo() {
      api
        .get('/redfish/v1/Systems/system')
        .then(
          ({
            data: {
              AssetTag,
              Model,
              PowerState,
              SerialNumber,
              Oem: {
                IBM: { SafeMode },
              },
              Status: { State } = {},
            },
          } = {}) => {
            this.assetTag = AssetTag;
            this.serialNumber = SerialNumber;
            this.modelType = Model;
            localStorage.setItem('storedModelType', Model);
            this.safeMode = SafeMode;
            if (State === 'Quiesced' || State === 'InTest') {
              // OpenBMC's host state interface is mapped to 2 Redfish
              // properties "Status""State" and "PowerState". Look first
              // at State for certain cases.

              this.serverStatus = serverStateMapper(State);
            } else {
              this.serverStatus = serverStateMapper(PowerState);
            }
          }
        )
        .catch((error) => {
          console.log(error);
          return Promise.reject();
        });
    },
    async getBootProgress() {
      api
        .get('/redfish/v1/Systems/system')
        .then(({ data }) => {
          const bootProgress = data.BootProgress.LastState;
          this.bootProgress = bootProgress;
        })
        .catch((error) => {
          console.log(error);
          this.bootProgress = null;
        });
    },
    setUnauthorized() {
      this.isAuthorized = false;
      window.setTimeout(() => {
        this.isAuthorized = true;
      }, 100);
    },
    async getCurrentTask(task) {
      return await api.get(task).then(({ data }) => {
        return data;
      });
    },
  },
});

export default GlobalStore;
