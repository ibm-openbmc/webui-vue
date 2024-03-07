import api from '@/store/api';
import i18n from '@/i18n';

const ResourceMemoryStore = {
  namespaced: true,
  state: {
    logicalMemorySizeOptions: [],
    logicalMemorySize: null,
    ioAdapterCapacity: null,
    dynamicIoDrawerCapacity: null,
    dynamicIoDrawerDefaultCapacity: null,
    maxNumHugePages: null,
    numHugePages: null,
    hmcManaged: null,
    memoryMirroringMode: null,
  },
  getters: {
    logicalMemorySizeOptions: (state) => state.logicalMemorySizeOptions,
    logicalMemorySize: (state) => state.logicalMemorySize,
    ioAdapterCapacity: (state) => state.ioAdapterCapacity,
    dynamicIoDrawerCapacity: (state) => state.dynamicIoDrawerCapacity,
    dynamicIoDrawerDefaultCapacity: (state) =>
      state.dynamicIoDrawerDefaultCapacity,
    maxNumHugePages: (state) => state.maxNumHugePages,
    numHugePages: (state) => state.numHugePages,
    hmcManaged: (state) => state.hmcManaged,
    memoryMirroringMode: (state) => state.memoryMirroringMode,
  },
  mutations: {
    setLogicalMemorySizeOptions: (state, logicalMemorySizeOptions) =>
      (state.logicalMemorySizeOptions = logicalMemorySizeOptions),
    setLogicalMemorySize: (state, logicalMemorySize) =>
      (state.logicalMemorySize = logicalMemorySize),
    setIoAdapterCapacity: (state, ioAdapterCapacity) =>
      (state.ioAdapterCapacity = ioAdapterCapacity),
    setDynamicIoDrawerDefaultCapacity: (
      state,
      dynamicIoDrawerDefaultCapacity
    ) =>
      (state.dynamicIoDrawerDefaultCapacity = dynamicIoDrawerDefaultCapacity),
    setDynamicIoDrawerCapacity: (state, dynamicIoDrawerCapacity) =>
      (state.dynamicIoDrawerCapacity = dynamicIoDrawerCapacity),
    setMaxNumHugePages: (state, maxNumHugePages) =>
      (state.maxNumHugePages = maxNumHugePages),
    setNumHugePages: (state, numHugePages) =>
      (state.numHugePages = numHugePages),
    setHmcManaged: (state, hmcManaged) => (state.hmcManaged = hmcManaged),
    setMemoryMirroringMode: (state, memoryMirroringMode) =>
      (state.memoryMirroringMode = memoryMirroringMode),
  },
  actions: {
    async getMemorySizeOptions({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const memorySize = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_memory_region_size'
          );
          let memorySizeOptions = memorySize[0].Value.map(
            ({ ValueName }) => ValueName
          );
          commit('setLogicalMemorySizeOptions', memorySizeOptions);
        })
        .catch((error) => console.log(error));
    },
    async getLogicalMemorySize({ commit }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios/')
        .then(({ data: { Attributes: { hb_memory_region_size } } }) =>
          commit('setLogicalMemorySize', hb_memory_region_size)
        )
        .catch((error) => console.log(error));
    },
    async getHmcManaged({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const hmcMananged = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'pvm_hmc_managed'
          );
          let hmcManangedValue = hmcMananged[0].CurrentValue;
          commit('setHmcManaged', hmcManangedValue);
        })
        .catch((error) => console.log(error));
    },
    async getIoAdapterCapacity({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const ioAdapterCapacity = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName == 'hb_ioadapter_enlarged_capacity'
          );
          let ioEnlargedAdapterCapacity = ioAdapterCapacity[0].CurrentValue;
          commit('setIoAdapterCapacity', ioEnlargedAdapterCapacity);

          const dynamicIoDrawerCapacity = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName ==
              'hb_storage_preallocation_for_drawer_attach'
          );
          if (dynamicIoDrawerCapacity.length > 0) {
            let dynamicIoDrawerAttachmentCapacity =
              dynamicIoDrawerCapacity[0].CurrentValue;
            commit(
              'setDynamicIoDrawerCapacity',
              dynamicIoDrawerAttachmentCapacity
            );
          }

          const dynamicIoDrawerDefaultCapacity = RegistryEntries.Attributes.filter(
            (Attribute) =>
              Attribute.AttributeName ==
              'hb_storage_preallocation_for_drawer_attach'
          );
          if (dynamicIoDrawerDefaultCapacity.length > 0) {
            let dynamicIoDrawerAttachmentDefaultCapacity =
              dynamicIoDrawerDefaultCapacity[0].DefaultValue;
            commit(
              'setDynamicIoDrawerDefaultCapacity',
              dynamicIoDrawerAttachmentDefaultCapacity
            );
          }
        })
        .catch((error) => console.log(error));
    },

    async getMaxNumHugePages({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const maxNumberHugePages = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_max_number_huge_pages'
          );
          let maxNumberHugePagesLimit = maxNumberHugePages[0].CurrentValue;
          commit('setMaxNumHugePages', maxNumberHugePagesLimit);
        })
        .catch((error) => console.log(error));
    },
    async getNumHugePages({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const numberHugePages = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_number_huge_pages'
          );
          let systemMemoryPageSetup = numberHugePages[0].CurrentValue;
          commit('setNumHugePages', systemMemoryPageSetup);
        })
        .catch((error) => console.log(error));
    },
    async getActiveMemoryMirroring({ commit }) {
      return await api
        .get(
          '/redfish/v1/Registries/BiosAttributeRegistry/BiosAttributeRegistry'
        )
        .then(({ data: { RegistryEntries } }) => {
          const activeMemoryMirroringMode = RegistryEntries.Attributes.filter(
            (Attribute) => Attribute.AttributeName == 'hb_memory_mirror_mode'
          );
          if (activeMemoryMirroringMode.length > 0) {
            let activeMemoryMirroringModeValue =
              activeMemoryMirroringMode[0].CurrentValue;
            let mirroringModeValue =
              activeMemoryMirroringModeValue == 'Enabled' ? true : false;
            commit('setMemoryMirroringMode', mirroringModeValue);
          }
        })
        .catch((error) => console.log(error));
    },
    async saveActiveMemoryMirroringMode(
      { commit },
      activeMemoryMirroringModeValue
    ) {
      let updatedMirroringModeValue = activeMemoryMirroringModeValue
        ? 'Enabled'
        : 'Disabled';
      commit('setMemoryMirroringMode', activeMemoryMirroringModeValue);
      const updatedMirroringMode = {
        Attributes: { hb_memory_mirror_mode: updatedMirroringModeValue },
      };
      return api
        .patch('/redfish/v1/Systems/system/Bios/Settings', updatedMirroringMode)
        .then(() => {
          return i18n.t(
            'pageMemory.toast.successSavingActiveMemoryMirroringMode'
          );
        })
        .catch((error) => {
          console.log(error);
          commit('setMemoryMirroringMode', !activeMemoryMirroringModeValue);
          throw new Error(
            i18n.t('pageMemory.toast.errorSavingActiveMemoryMirroringMode')
          );
        });
    },
    async savePageSetup({ commit }) {
      const updatedNumHugePages = {
        Attributes: {
          hb_number_huge_pages: this.state.resourceMemory.numHugePages,
        },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', updatedNumHugePages)
        .then(() => {
          commit(
            'setNumHugePages',
            updatedNumHugePages.Attributes.hb_number_huge_pages
          );
          return i18n.t('pageMemory.toast.successSavingPageSetup');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(i18n.t('pageMemory.toast.errorSavingPageSetup'));
        });
    },
    async saveEnlargedCapacity({ commit }) {
      const updatedIoEnlargedCapacity = {
        Attributes: {
          hb_ioadapter_enlarged_capacity: this.state.resourceMemory
            .ioAdapterCapacity,
        },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedIoEnlargedCapacity
        )
        .then(() => {
          commit(
            'setIoAdapterCapacity',
            updatedIoEnlargedCapacity.Attributes.hb_ioadapter_enlarged_capacity
          );
          return i18n.t(
            'pageMemory.toast.successSavingAdapterEnlargedCapacity'
          );
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(
            i18n.t('pageMemory.toast.errorSavingAdapterEnlargedCapacity')
          );
        });
    },
    async saveDynamicCapacity({ commit }) {
      const updatedIoDynamicCapacity = {
        Attributes: {
          hb_storage_preallocation_for_drawer_attach: this.state.resourceMemory
            .dynamicIoDrawerCapacity,
        },
      };
      return await api
        .patch(
          '/redfish/v1/Systems/system/Bios/Settings',
          updatedIoDynamicCapacity
        )
        .then(() => {
          commit(
            'setDynamicIoDrawerCapacity',
            updatedIoDynamicCapacity.Attributes
              .hb_storage_preallocation_for_drawer_attach
          );
          return i18n.t('pageMemory.toast.successSavingAdapterDynamicCapacity');
        })
        .catch((error) => {
          console.log(error);
          throw new Error(
            i18n.t('pageMemory.toast.errorSavingAdapterDynamicCapacity')
          );
        });
    },
    async saveSettings({ commit }, logicalMemorySize) {
      const updatedMemorySize = {
        Attributes: { hb_memory_region_size: logicalMemorySize },
      };
      return await api
        .patch('/redfish/v1/Systems/system/Bios/Settings', updatedMemorySize)
        .then(() => {
          commit(
            'setLogicalMemorySize',
            updatedMemorySize.Attributes.hb_memory_region_size
          );
          return i18n.t('pageMemory.toast.successSavingLogicalMemory');
        })
        .catch((error) => {
          console.log('error', error);
          throw new Error(i18n.t('pageMemory.toast.errorSavingLogicalMemory'));
        });
    },
  },
};

export default ResourceMemoryStore;
