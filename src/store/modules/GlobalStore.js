import api from '@/store/api';
import { defineStore } from 'pinia';

export const HOST_STATE = {
  on: 'xyz.openbmc_project.State.Host.HostState.Running',
  off: 'xyz.openbmc_project.State.Host.HostState.Off',
  error: 'xyz.openbmc_project.State.Host.HostState.Quiesced',
  diagnosticMode: 'xyz.openbmc_project.State.Host.HostState.DiagnosticMode',
};

export const serverStateMapper = (hostState) => {
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
    firmwareSwitchInProgress: false,
    firmwareSwitchStartTime: null,
    firmwareSwitchCurrentStep: 1,
    firmwareUpdateInProgress: false,
    firmwareUpdateStartTime: null,
    firmwareUpdateCurrentStep: 1,
    bmcRebootInProgress: false,
    bmcRebootStartTime: null,
    bmcRebootCurrentStep: 1,
    dumpGenerationInProgress: false,
    dumpGenerationStartTime: null,
    dumpGenerationType: '',
    completedOperations: [],
    notificationsViewed: true,
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
    isReadOnlyUserGetter: (state) =>
      state.currentUser?.RoleId === 'ReadOnly' || !state.currentUser,
    isAdminUser: (state) =>
      state.currentUser?.RoleId === 'Administrator' || !state.currentUser,
    isReadOnlyUser: (state) =>
      state.currentUser?.RoleId === 'ReadOnly' || !state.currentUser,
    isAuthorizedGetter: (state) => state.isAuthorized,
    isServiceLoginEnabledGetter: (state) => state.isServiceLoginEnabled,
    firmwareSwitchInProgressGetter: (state) => state.firmwareSwitchInProgress,
    firmwareSwitchStartTimeGetter: (state) => state.firmwareSwitchStartTime,
    firmwareSwitchCurrentStepGetter: (state) => state.firmwareSwitchCurrentStep,
    firmwareUpdateInProgressGetter: (state) => state.firmwareUpdateInProgress,
    firmwareUpdateStartTimeGetter: (state) => state.firmwareUpdateStartTime,
    firmwareUpdateCurrentStepGetter: (state) => state.firmwareUpdateCurrentStep,
    bmcRebootInProgressGetter: (state) => state.bmcRebootInProgress,
    bmcRebootStartTimeGetter: (state) => state.bmcRebootStartTime,
    bmcRebootCurrentStepGetter: (state) => state.bmcRebootCurrentStep,
    dumpGenerationInProgressGetter: (state) => state.dumpGenerationInProgress,
    dumpGenerationStartTimeGetter: (state) => state.dumpGenerationStartTime,
    dumpGenerationTypeGetter: (state) => state.dumpGenerationType,
    hasActiveOperations: (state) =>
      state.firmwareSwitchInProgress ||
      state.firmwareUpdateInProgress ||
      state.bmcRebootInProgress ||
      state.dumpGenerationInProgress,
    completedOperationsGetter: (state) => state.completedOperations,
    notificationsViewedGetter: (state) => state.notificationsViewed,
    hasUnviewedNotifications: (state) =>
      state.completedOperations.length > 0 && !state.notificationsViewed,
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
      this.currentUser = null;
      return api
        .get(`/redfish/v1/AccountService/Accounts/${username}`)
        .then(({ data }) => {
          this.currentUser = data;
          localStorage.setItem(
            'storedCurrentUser',
            JSON.stringify(this.currentUser),
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
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const hmcMananged = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_hmc_managed',
          );
          let hmcManangedValue = hmcMananged[0].CurrentValue;
          this.hmcManaged = hmcManangedValue;
          localStorage.setItem('storedHmcManagedValue', hmcManangedValue);
        })
        .catch((error) => console.log(error));
    },
    async getSafeMode() {
      return api
        .get('/redfish/v1/Systems/system/Processors?$expand=.($levels=2)')
        .then(({ data }) => {
          this.safeMode = false;
          for (let member of data.Members) {
            if (
              member?.Throttled &&
              member?.ThrottleCauses.includes('ManagementDetectedFault')
            ) {
              this.safeMode = true;
              break;
            }
          }
        })
        .catch((error) => {
          console.log(error);
          return Promise.reject(error);
        });
    },
    async getSystemInfo() {
      return await api
        .get('/redfish/v1/Systems/system')
        .then(
          ({
            data: {
              AssetTag,
              Model,
              PowerState,
              SerialNumber,
              Status: { State } = {},
            },
          } = {}) => {
            this.assetTag = AssetTag;
            this.serialNumber = SerialNumber;
            this.modelType = Model;
            localStorage.setItem('storedModelType', Model);
            if (State === 'Quiesced' || State === 'InTest') {
              // OpenBMC's host state interface is mapped to 2 Redfish
              // properties "Status""State" and "PowerState". Look first
              // at State for certain cases.

              this.serverStatus = serverStateMapper(State);
            } else {
              this.serverStatus = serverStateMapper(PowerState);
            }
            this.getSafeMode();
            return Promise.resolve();
          },
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
    setUtcTime(isUtcDisplay) {
      this.isUtcDisplay = isUtcDisplay;
    },
    setFirmwareSwitchInProgress(payload) {
      const inProgress =
        typeof payload === 'boolean' ? payload : payload.inProgress;
      const success = typeof payload === 'boolean' ? true : payload.success;

      this.firmwareSwitchInProgress = inProgress;
      if (inProgress) {
        this.firmwareSwitchStartTime = Date.now();
        this.firmwareSwitchCurrentStep = 1;
      } else {
        // When operation completes successfully, add to completed operations
        if (this.firmwareSwitchStartTime && success) {
          const operation = {
            id: Date.now(),
            type: 'firmware-switch',
            title: 'Firmware Switch',
            message: 'BMC firmware switched successfully',
            status: 'success',
            timestamp: Date.now(),
            duration: Date.now() - this.firmwareSwitchStartTime,
          };
          this.completedOperations.unshift(operation);
          // Keep only last 10 completed operations
          if (this.completedOperations.length > 10) {
            this.completedOperations = this.completedOperations.slice(0, 10);
          }
          // Mark notifications as unviewed when new operation completes
          this.notificationsViewed = false;
        }
        this.firmwareSwitchStartTime = null;
        this.firmwareSwitchCurrentStep = 1;
      }
    },
    setFirmwareSwitchStep(step) {
      this.firmwareSwitchCurrentStep = step;
    },
    removeCompletedOperation(operationId) {
      this.completedOperations = this.completedOperations.filter(
        (op) => op.id !== operationId,
      );
    },
    markNotificationsAsViewed() {
      this.notificationsViewed = true;
    },
    setFirmwareUpdateInProgress(payload) {
      const inProgress =
        typeof payload === 'boolean' ? payload : payload.inProgress;
      const success = typeof payload === 'boolean' ? true : payload.success;

      this.firmwareUpdateInProgress = inProgress;
      if (inProgress) {
        this.firmwareUpdateStartTime = Date.now();
        this.firmwareUpdateCurrentStep = 1;
      } else {
        if (this.firmwareUpdateStartTime && success) {
          const operation = {
            id: Date.now(),
            type: 'firmware-update',
            title: 'Firmware Update',
            message: 'Firmware image updated successfully',
            status: 'success',
            timestamp: Date.now(),
            duration: Date.now() - this.firmwareUpdateStartTime,
          };
          this.completedOperations.unshift(operation);
          if (this.completedOperations.length > 10) {
            this.completedOperations = this.completedOperations.slice(0, 10);
          }
          this.notificationsViewed = false;
        }
        this.firmwareUpdateStartTime = null;
        this.firmwareUpdateCurrentStep = 1;
      }
    },
    setFirmwareUpdateStep(step) {
      this.firmwareUpdateCurrentStep = step;
    },
    setBmcRebootInProgress(payload) {
      const inProgress =
        typeof payload === 'boolean' ? payload : payload.inProgress;
      const success = typeof payload === 'boolean' ? true : payload.success;

      this.bmcRebootInProgress = inProgress;
      if (inProgress) {
        this.bmcRebootStartTime = Date.now();
        this.bmcRebootCurrentStep = 1;
      } else {
        if (this.bmcRebootStartTime && success) {
          const operation = {
            id: Date.now(),
            type: 'bmc-reboot',
            title: 'BMC Reboot',
            message: 'BMC reboot completed and system is reachable',
            status: 'success',
            timestamp: Date.now(),
            duration: Date.now() - this.bmcRebootStartTime,
          };
          this.completedOperations.unshift(operation);
          if (this.completedOperations.length > 10) {
            this.completedOperations = this.completedOperations.slice(0, 10);
          }
          this.notificationsViewed = false;
        }
        this.bmcRebootStartTime = null;
        this.bmcRebootCurrentStep = 1;
      }
    },
    setBmcRebootStep(step) {
      this.bmcRebootCurrentStep = step;
    },
    setDumpGenerationInProgress(payload) {
      const inProgress =
        typeof payload === 'boolean' ? payload : payload.inProgress;
      const success = typeof payload === 'boolean' ? true : payload.success;
      const dumpType = payload?.dumpType || this.dumpGenerationType || 'System';

      this.dumpGenerationInProgress = inProgress;
      if (inProgress) {
        this.dumpGenerationStartTime = Date.now();
        this.dumpGenerationType = dumpType;
      } else {
        if (this.dumpGenerationStartTime && success) {
          const operation = {
            id: Date.now(),
            type: 'dump-generation',
            title: `${this.dumpGenerationType} Dump`,
            message: `${this.dumpGenerationType} dump generated successfully`,
            status: 'success',
            timestamp: Date.now(),
            duration: Date.now() - this.dumpGenerationStartTime,
          };
          this.completedOperations.unshift(operation);
          if (this.completedOperations.length > 10) {
            this.completedOperations = this.completedOperations.slice(0, 10);
          }
          this.notificationsViewed = false;
        }
        this.dumpGenerationStartTime = null;
        this.dumpGenerationType = '';
      }
    },
  },
});

export default GlobalStore;
