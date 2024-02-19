import api from '@/store/api';
// import i18n from '@/i18n';

const NetworkSettingsStore = {
  namespaced: true,
  state: {
    biosAttributes: null,
    requiredAttributes: [
      'pvm_ibmi_network_install_type',
      'pvm_ibmi_ipaddress_protocol',
      'pvm_ibmi_server_ipaddress',
      'pvm_ibmi_nfs_image_directory',
      'pvm_ibmi_local_ipaddress',
      'pvm_ibmi_subnet_mask',
      'pvm_ibmi_gateway_ipaddress',
      'pvm_ibmi_vlan_tag_id',
      'pvm_ibmi_iscsi_target_name',
      'pvm_ibmi_iscsi_initiator_name',
      'pvm_ibmi_iscsi_target_port',
      'pvm_ibmi_max_frame_size',
    ],
  },
  getters: {
    biosAttributes: (state) => state.biosAttributes,
  },
  mutations: {
    setBiosAttributes: (state, biosAttributes) =>
      (state.biosAttributes = biosAttributes),
  },
  actions: {
    async getBiosAttributes({ commit, state }) {
      return await api
        .get('/redfish/v1/Systems/system/Bios')
        .then(({ data: { Attributes } }) => {
          const filteredAttributes = state.requiredAttributes
            .filter((key) => Object.keys(Attributes).includes(key))
            .reduce((obj, key) => {
              return {
                ...obj,
                [key]: Attributes[key],
              };
            }, {});
          commit('setBiosAttributes', filteredAttributes);
        })
        .catch((error) => {
          console.log(error);
        });
    },
  },
};

export default NetworkSettingsStore;
