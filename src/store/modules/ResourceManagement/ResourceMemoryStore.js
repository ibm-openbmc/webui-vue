import api from '@/store/api';
import i18n from '@/i18n';
import { defineStore } from 'pinia';

export const ResourceMemoryStore = defineStore('resourceMemory', {
  state: () => ({
    logicalMemorySizeOptions: [],
    logicalMemorySize: null,
    ioAdapterCapacity: null,
    dynamicIoDrawerCapacity: null,
    dynamicIoDrawerDefaultCapacity: null,
    maxNumHugePages: null,
    numHugePages: null,
    hmcManaged: null,
    memoryMirroringMode: null,
    predictiveMemoryGuard: null,
  }),
  getters: {
    logicalMemorySizeOptionsGetter: (state) => state.logicalMemorySizeOptions,
    logicalMemorySizeGetter: (state) => state.logicalMemorySize,
    ioAdapterCapacityGetter: (state) => state.ioAdapterCapacity,
    dynamicIoDrawerCapacityGetter: (state) => state.dynamicIoDrawerCapacity,
    dynamicIoDrawerDefaultCapacityGetter: (state) =>
      state.dynamicIoDrawerDefaultCapacity,
    maxNumHugePagesGetter: (state) => state.maxNumHugePages,
    numHugePagesGetter: (state) => state.numHugePages,
    hmcManagedGetter: (state) => state.hmcManaged,
    memoryMirroringModeGetter: (state) => state.memoryMirroringMode,
    predictiveMemoryGuardGetter: (state) => state.predictiveMemoryGuard,
  },
  actions: {
    async getMemorySizeOptions() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const memorySize = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_memory_region_size',
          );
          let memorySizeOptions = memorySize[0].Value.map(
            ({ ValueName }) => ValueName,
          );
          this.logicalMemorySizeOptions = memorySizeOptions;
        })
        .catch((error) => console.log(error));
    },
    async getLogicalMemorySize() {
      return await api
        .get('/redfish/v1/Systems/system/Bios/')
        .then(
          ({
            data: {
              Attributes: { hb_memory_region_size },
            },
          }) => (this.logicalMemorySize = hb_memory_region_size),
        )
        .catch((error) => console.log(error));
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
        })
        .catch((error) => console.log(error));
    },
    async getIoAdapterCapacity() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const ioAdapterCapacity = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'hb_ioadapter_enlarged_capacity',
          );
          let ioEnlargedAdapterCapacity = ioAdapterCapacity[0].CurrentValue;
          this.ioAdapterCapacity = ioEnlargedAdapterCapacity;

          const dynamicIoDrawerCapacity = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName ==
              'hb_storage_preallocation_for_drawer_attach',
          );
          if (dynamicIoDrawerCapacity.length > 0) {
            let dynamicIoDrawerAttachmentCapacity =
              dynamicIoDrawerCapacity[0].CurrentValue;
            this.dynamicIoDrawerCapacity = dynamicIoDrawerAttachmentCapacity;
          }

          const dynamicIoDrawerDefaultCapacity =
            RegistryEntries.Attributes.filter(
              (Attribute) =>
                Attribute.AttributeName ==
                'hb_storage_preallocation_for_drawer_attach',
            );
          if (dynamicIoDrawerDefaultCapacity.length > 0) {
            let dynamicIoDrawerAttachmentDefaultCapacity =
              dynamicIoDrawerDefaultCapacity[0].DefaultValue;
            this.dynamicIoDrawerDefaultCapacity =
              dynamicIoDrawerAttachmentDefaultCapacity;
          }
        })
        .catch((error) => console.log(error));
    },
    async getMaxNumHugePages() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const maxNumberHugePages = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'hb_max_number_huge_pages',
          );
          let maxNumberHugePagesLimit = maxNumberHugePages[0].CurrentValue;
          this.maxNumHugePages = maxNumberHugePagesLimit;
        })
        .catch((error) => console.log(error));
    },
    async getNumHugePages() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const numberHugePages = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_number_huge_pages',
          );
          let systemMemoryPageSetup = numberHugePages[0].CurrentValue;
          this.numHugePages = systemMemoryPageSetup;
        })
        .catch((error) => console.log(error));
    },
    async getActiveMemoryMirroring() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const activeMemoryMirroringMode = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_memory_mirror_mode',
          );
          if (activeMemoryMirroringMode.length > 0) {
            let activeMemoryMirroringModeValue =
              activeMemoryMirroringMode[0].CurrentValue;
            let mirroringModeValue =
              activeMemoryMirroringModeValue == 'Enabled' ? true : false;
            this.memoryMirroringMode = mirroringModeValue;
          }
        })
        .catch((error) => console.log(error));
    },
    async saveActiveMemoryMirroringMode(activeMemoryMirroringModeValue) {
      let updatedMirroringModeValue = activeMemoryMirroringModeValue
        ? 'Enabled'
        : 'Disabled';
      this.memoryMirroringMode = activeMemoryMirroringModeValue;
      const updatedMirroringMode = {
        Attributes: { hb_memory_mirror_mode: updatedMirroringModeValue },
      };
      return api
        .patch('/redfish/v1/Systems/system/Bios/Settings', updatedMirroringMode)
        .then(() => {
          return i18n.global.t(
            'pageMemory.toast.successSavingActiveMemoryMirroringMode',
          );
        })
        .catch((error) => {
          console.log(error);
          this.memoryMirroringMode = !activeMemoryMirroringModeValue;
          throw new Error(
            i18n.global.t(
              'pageMemory.toast.errorSavingActiveMemoryMirroringMode',
            ),
          );
        });
    },
    async getPredictiveMemoryGuard() {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry',
        )
        .then(({ data: { RegistryEntries } }) => {
          const predictiveMemoryGuard = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_predictive_mem_guard',
          );
          if (predictiveMemoryGuard.length > 0) {
            let predictiveMemoryGuardValue =
              predictiveMemoryGuard[0].CurrentValue;
            let predictiveMemValue =
              predictiveMemoryGuardValue == 'Enabled' ? true : false;
            this.predictiveMemoryGuard = predictiveMemValue;
          }
        })
        .catch((error) => console.log(error));
    },
    async savePredictiveMemoryGuard(activePredictiveMemoryGuardValue) {
      let updatedMirroringModeValue = activePredictiveMemoryGuardValue
        ? 'Enabled'
        : 'Disabled';
      this.predictiveMemoryGuard = activePredictiveMemoryGuardValue;
      const updatedPredictiveMemoryGuard = {
        Attributes: { hb_predictive_mem_guard: updatedMirroringModeValue },
      };
      return api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedPredictiveMemoryGuard,
        )
        .then(() => {
          return i18n.global.t(
            'pageMemory.toast.successSavingPredictiveMemoryGuard',
          );
        })
        .catch((error) => {
          console.log(error);
          this.predictiveMemoryGuard = !activePredictiveMemoryGuardValue;
          throw new Error(
            i18n.global.t('pageMemory.toast.errorSavingPredictiveMemoryGuard'),
          );
        });
    },
    async savePageSetup() {
      const updatedNumHugePages = {
        Attributes: {
          hb_number_huge_pages: this.numHugePages,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', updatedNumHugePages)
        .then(() => {
          this.setNumHugePages =
            updatedNumHugePages.Attributes.hb_number_huge_pages;
          return i18n.global.t('pageMemory.toast.successSavingPageSetup');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.global.t('pageMemory.toast.errorSavingPageSetup'),
          );
        });
    },
    async saveEnlargedCapacity() {
      const updatedIoEnlargedCapacity = {
        Attributes: {
          hb_ioadapter_enlarged_capacity: this.ioAdapterCapacity,
        },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedIoEnlargedCapacity,
        )
        .then(() => {
          this.ioAdapterCapacity =
            updatedIoEnlargedCapacity.Attributes.hb_ioadapter_enlarged_capacity;
          return i18n.global.t(
            'pageMemory.toast.successSavingAdapterEnlargedCapacity',
          );
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.global.t(
              'pageMemory.toast.errorSavingAdapterEnlargedCapacity',
            ),
          );
        });
    },
    async saveDynamicCapacity() {
      const updatedIoDynamicCapacity = {
        Attributes: {
          hb_storage_preallocation_for_drawer_attach:
            this.dynamicIoDrawerCapacity,
        },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedIoDynamicCapacity,
        )
        .then(() => {
          this.dynamicIoDrawerCapacity =
            updatedIoDynamicCapacity.Attributes.hb_storage_preallocation_for_drawer_attach;
          return i18n.global.t(
            'pageMemory.toast.successSavingAdapterDynamicCapacity',
          );
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.global.t('pageMemory.toast.errorSavingAdapterDynamicCapacity'),
          );
        });
    },
    async saveSettings(logicalMemorySize) {
      const updatedMemorySize = {
        Attributes: { hb_memory_region_size: logicalMemorySize },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', updatedMemorySize)
        .then(() => {
          this.logicalMemorySize =
            updatedMemorySize.Attributes.hb_memory_region_size;
          return i18n.global.t('pageMemory.toast.successSavingLogicalMemory');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.global.t('pageMemory.toast.errorSavingLogicalMemory'),
          );
        });
    },
  },
});

export default ResourceMemoryStore;
