import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const BootSettingsStore = defineStore('bootSettings', {
  state: () => ({
    attributeKeys: [
      'pvm_system_operating_mode',
      'pvm_system_power_off_policy',
      'pvm_stop_at_standby',
      'pvm_default_os_type',
      'pvm_rpa_boot_mode',
      'pvm_os_boot_type',
      'pvm_sys_dump_active',
      'pvm_linux_kvm_memory',
    ],
    disabled: false,
    attributeValues: null,
    automaticRetryConfigValue: '',
    biosAttributes: null,
    bootFault: '',
    powerRestorePolicyValue: '',
    linuxKvmPercentageValue: null,
    linuxKvmPercentageInitialValue: null,
    pvm_ibmi_load_source: 'Current configuration',
    pvm_ibmi_alt_load_source: 'Current configuration',
    pvm_ibmi_console: 'Current configuration',
    linuxKvmPercentageCurrentValue: null,
    locationCodes: [],
  }),
  getters: {
    getAttributeValues: (state) => state.attributeValues,
    getAutomaticRetryConfigValue: (state) => state.automaticRetryConfigValue,
    getBiosAttributes: (state) => state.biosAttributes,
    getBootFaultValue: (state) => state.bootFault,
    getPowerRestorePolicyValue: (state) => state.powerRestorePolicyValue,
    getSystemDumpActive: (state) =>
      state.biosAttributes?.pvm_sys_dump_active === 'Enabled',
    getDisabled: (state) => state.disabled,
    getLinuxKvmPercentageValue: (state) => state.linuxKvmPercentageValue,
    getLinuxKvmPercentageInitialValue: (state) =>
      state.linuxKvmPercentageInitialValue,
    getLinuxKvmPercentageCurrentValue: (state) =>
      state.linuxKvmPercentageCurrentValue,
    getLocationCodes: (state) => state.locationCodes,
    getIbmiLoadSourceValue: (state) => state.pvm_ibmi_load_source,
    getIbmiAltLoadSourceValue: (state) => state.pvm_ibmi_alt_load_source,
    getIbmiConsoleValue: (state) => state.pvm_ibmi_console,
  },
  actions: {
    async getOperatingModeSettings() {
      // Action not tested. Remove this comment once the action is tested and verified.
      return await api
        .get('/redfish/v1/Systems/system')
        .then(({ data: { PowerRestorePolicy, Boot } }) => {
          this.powerRestorePolicyValue = PowerRestorePolicy;
          this.automaticRetryConfigValue = Boot.AutomaticRetryConfig;
          this.bootFault = Boot.StopBootOnFault;
        })
        .catch((error) => console.log(error));
    },
    async saveSettings({ biosSettings }) {
      // Action not tested. Remove this comment once the action is tested and verified.
      const promises = [];
      this.disabled = true;
      if (biosSettings) {
        promises.push(this.saveBiosSettings(biosSettings));
      }
      return await api.all(promises).then(
        api.spread((...responses) => {
          let message = i18n.global.t(
            'pageServerPowerOperations.toast.successSaveSettings',
          );
          responses.forEach((response) => {
            if (response instanceof Error) {
              throw new Error(
                i18n.global.t(
                  'pageServerPowerOperations.toast.errorSaveSettings',
                ),
              );
            }
          });
          return message;
        }),
      );
    },
    async fetchBiosAttributes() {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Attributes } }) => {
          const filteredAttributes = this.attributeKeys
            .filter((key) => Object.keys(Attributes).includes(key))
            .reduce((obj, key) => {
              return {
                ...obj,
                [key]: Attributes[key],
              };
            }, {});
          this.biosAttributes = filteredAttributes;
          this.disabled = false;
        })
        .catch((error) => {
          console.log(error);
          this.disabled = false;
        });
    },
    async fetchAttributeValues() {
      // Action not tested. Remove this comment once the action is tested and verified.
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(
          ({
            data: {
              RegistryEntries: { Attributes },
            },
          }) => {
            let linuxPercentObj = Attributes.find(
              (itm) => itm.AttributeName === 'pvm_linux_kvm_percentage',
            );
            let linuxPercentCurrentObj = Attributes.find(
              (itm) => itm.AttributeName === 'pvm_linux_kvm_percentage_current',
            );
            let linuxValue = linuxPercentObj?.CurrentValue / 10;
            let ibmi_load_source = Attributes.find(
              (itm) => itm.AttributeName === 'pvm_ibmi_load_source',
            );
            let ibmi_load_source_value = ibmi_load_source?.CurrentValue;
            let ibmi_alt_load_source = Attributes.find(
              (itm) => itm.AttributeName === 'pvm_ibmi_alt_load_source',
            );
            let ibmi_alt_load_source_value = ibmi_alt_load_source?.CurrentValue;
            let ibmi_console = Attributes.find(
              (itm) => itm.AttributeName === 'pvm_ibmi_console',
            );
            let ibmi_console_value = ibmi_console?.CurrentValue;
            let linuxPercentCurrentValue =
              linuxPercentCurrentObj?.CurrentValue / 10;
            this.linuxKvmPercentageValue = linuxValue;
            this.linuxKvmPercentageInitialValue = linuxValue;
            this.linuxKvmPercentageCurrentValue = linuxPercentCurrentValue;
            if (ibmi_load_source_value !== undefined) {
              this.pvm_ibmi_load_source = ibmi_load_source_value;
            }
            if (ibmi_alt_load_source_value !== undefined) {
              this.pvm_ibmi_alt_load_source = ibmi_alt_load_source_value;
            }
            if (ibmi_console_value !== undefined) {
              this.pvm_ibmi_console = ibmi_console_value;
            }
            // Array for state BIOS attributes is created
            const filteredAttributeValues = this.attributeKeys
              .reduce((arr, attriValue) => {
                return [
                  ...arr,
                  ...Attributes.filter((value) => {
                    return (
                      attriValue !== 'pvm_sys_dump_active' &&
                      attriValue === value.AttributeName
                    );
                  }),
                ];
              }, [])
              // Array of objects with the key as value and text is created
              .reduce((obj, attributeObj) => {
                return {
                  ...obj,
                  [attributeObj?.AttributeName]: attributeObj.Value.map(
                    (item) => {
                      return {
                        value: item.ValueName,
                        text:
                          [
                            'pvm_default_os_type',
                            'pvm_os_boot_type',
                            'pvm_rpa_boot_mode',
                            'pvm_stop_at_standby',
                            'pvm_system_operating_mode',
                            'pvm_linux_kvm_memory',
                          ].indexOf(attributeObj.AttributeName) >= 0
                            ? i18n.global.t(
                                `pageServerPowerOperations.biosSettings.attributeValues.${attributeObj.AttributeName}.${item.ValueName}`,
                              )
                            : item.ValueName,
                      };
                    },
                  ),
                };
              }, {});
            this.attributeValues = filteredAttributeValues;
          },
        )
        .catch((error) => console.log(error));
    },
    async fetchLocationCodes() {
      // Action not tested. Remove this comment once the action is tested and verified.
      let locationCodes = [];
      return await api
        .get('/redfish/v1/Chassis?$expand=.($levels=2)')
        .then(({ data }) => {
          data.Members.map((chassis) => {
            chassis.PCIeSlots.Slots.map((pcieSlot) => {
              if (
                pcieSlot?.Links?.PCIeDevice &&
                pcieSlot?.Links?.PCIeDevice.length > 0 &&
                pcieSlot?.Location?.PartLocation?.ServiceLabel
              ) {
                locationCodes.push(
                  pcieSlot?.Location?.PartLocation?.ServiceLabel,
                );
              }
            });
          });
          this.locationCodes = locationCodes;
        });
    },
    saveBiosSettings(biosSettings) {
      // Action not tested. Remove this comment once the action is tested and verified.
      return api
        .patch('/redfish/v1/Systems/system/Bios/Settings', {
          Attributes: biosSettings,
        })
        .then((response) => {
          this.saveOperatingModeSettings(biosSettings);
          this.disabled = false;
          return response;
        })
        .catch((error) => {
          console.log(error);
          this.disabled = false;
          return error;
        });
    },
    async standbyToRuntime() {
      // Action not tested. Remove this comment once the action is tested and verified.
      return await api
        .post('redfish/v1/Systems/hypervisor/Actions/ComputerSystem.Reset', {
          ResetType: 'On',
        })
        .then(() => {
          return i18n.global.tc(
            'pageServerPowerOperations.toast.successSaveSettings',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.tc('pageServerPowerOperations.toast.errorSaveSettings'),
          );
        });
    },
    saveOperatingModeSettings(biosSettings) {
      return api
        .patch('/redfish/v1/Systems/system', {
          PowerRestorePolicy: this.powerRestorePolicyValue,
          Boot: {
            AutomaticRetryConfig: this.automaticRetryConfigValue,
            StopBootOnFault: this.bootFault,
          },
        })
        .then((response) => {
          this.biosAttributes = biosSettings;
          return response;
        })
        .catch((error) => {
          console.log(error);
          this.disabled = false;
          return error;
        });
    },
    saveLinuxPercentageValue(value) {
      // Action not tested. Remove this comment once the action is tested and verified.
      this.linuxKvmPercentageValue = value;
    },
    saveTaggedSettingsValue({ key, value }) {
      // Action not tested. Remove this comment once the action is tested and verified.
      this[key] = value;
    },
  },
});

export default BootSettingsStore;
