import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const PowerSupplyStore = defineStore('powerSupplyStore', {
  state: () => ({
    powerSupplies: [],
  }),
  getters: {
    powerSuppliesGetter: (state) => state.powerSupplies,
  },
  actions: {
    setPowerSupply(data) {
      this.powerSupplies = data.map((powerSupply) => {
        const {
          FirmwareVersion,
          Location,
          LocationIndicatorActive,
          Id,
          Model,
          Name,
          PartNumber,
          SerialNumber,
          SparePartNumber,
          Status = {},
        } = powerSupply;
        return {
          id: Id,
          health: Status.Health,
          partNumber: PartNumber,
          serialNumber: SerialNumber,
          firmwareVersion: FirmwareVersion,
          identifyLed: LocationIndicatorActive,
          locationNumber: Location?.PartLocation?.ServiceLabel,
          model: Model,
          name: Name,
          sparePartNumber: SparePartNumber,
          status: Status?.State === 'Enabled' ? 'Present' : Status?.State,
          uri: powerSupply['@odata.id'],
        };
      });
    },
    async getAllPowerSupplies(requestBody) {
      this.setPowerSupply([]);
      // If a direct powerSubsystemUri is supplied, skip the chassis GET hop.
      // Otherwise fall back to fetching the chassis to discover the URI.
      const psRequest = requestBody.powerSubsystemUri
        ? Promise.resolve(requestBody.powerSubsystemUri)
        : api
            .get(`${requestBody.uri}`)
            .then((response) => response.data.PowerSubsystem['@odata.id']);
      return await psRequest
        .then((powerUri) =>
          api.get(`${powerUri}/PowerSupplies?$expand=.($levels=1)`),
        )
        .then(({ data: { Members } }) => {
          this.setPowerSupply(Members);
        })
        .catch((error) => console.log(error));
    },
    async updateIdentifyLedValue(led) {
      const uri = led.uri;
      const updatedIdentifyLedValue = {
        LocationIndicatorActive: led.identifyLed,
      };
      return await api
        .patch(uri, updatedIdentifyLedValue)
        .then(() => {
          if (led.identifyLed) {
            return i18n.global.t(
              'pageInventory.toast.successEnableIdentifyLed',
            );
          } else {
            return i18n.global.t(
              'pageInventory.toast.successDisableIdentifyLed',
            );
          }
        })
        .catch((error) => {
          const chassisUri = uri.split('/PowerSubsystem').shift();
          this.getAllPowerSupplies({
            uri: chassisUri,
          });
          console.log(error);
          if (led.identifyLed) {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorEnableIdentifyLed'),
            );
          } else {
            throw new Error(
              i18n.global.t('pageInventory.toast.errorDisableIdentifyLed'),
            );
          }
        });
    },
  },
});

export default PowerSupplyStore;
