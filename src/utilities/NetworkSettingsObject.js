export const NETWORK_OBJECT = {
  disabled: {},
  nfs: {
    ipv4: {
      server: [
        {
          attribute: 'pvm_ibmi_server_ipaddress',
          property: 'bootServerIPAddress',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_nfs_image_directory',
          property: 'imageDirectoryPath',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
      partition: [
        {
          attribute: 'pvm_ibmi_local_ipaddress',
          property: 'ipAddress',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_subnet_mask',
          property: 'subnetMask',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_gateway_ipaddress',
          property: 'gateway',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
      advanced: [
        {
          attribute: 'pvm_ibmi_vlan_tag_id',
          property: 'vlanTagId',
          type: 'text',
          value: '',
          validations: {
            isRequired: false,
          },
        },
        {
          attribute: 'pvm_ibmi_max_frame_size',
          property: 'maxFrameSize',
          type: 'dropdown',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
    },
    ipv6: {
      server: [
        {
          attribute: 'pvm_ibmi_server_ipaddress',
          property: 'bootServerIPAddress',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_nfs_image_directory',
          property: 'imageDirectoryPath',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
      partition: [
        {
          attribute: 'pvm_ibmi_local_ipaddress',
          property: 'ipAddress',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_gateway_ipaddress',
          property: 'gateway',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
      advanced: [
        {
          attribute: 'pvm_ibmi_vlan_tag_id',
          property: 'vlanTagId',
          type: 'text',
          value: '',
          validations: {
            isRequired: false,
          },
        },
        {
          attribute: 'pvm_ibmi_max_frame_size',
          property: 'maxFrameSize',
          type: 'dropdown',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
    },
  },
  iscsi: {
    ipv4: {
      server: [
        {
          attribute: 'pvm_ibmi_server_ipaddress',
          property: 'targetIpAddress',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_iscsi_target_name',
          property: 'targetName',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_iscsi_initiator_name',
          property: 'initiatorName',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_iscsi_target_port',
          property: 'targetPort',
          type: 'text',
          value: '',
          validations: {
            isRequired: false,
          },
        },
        {
          attribute: 'chapName',
          property: 'chapName',
          type: 'text',
          value: '',
          validations: {
            isRequired: false,
          },
        },
        {
          attribute: 'chapSecret',
          property: 'chapSecret',
          type: 'password',
          value: '',
          validations: {
            isRequired: false,
          },
        },
      ],
      partition: [
        {
          attribute: 'pvm_ibmi_local_ipaddress',
          property: 'ipAddress',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_subnet_mask',
          property: 'subnetMask',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
        {
          attribute: 'pvm_ibmi_gateway_ipaddress',
          property: 'gateway',
          type: 'text',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
      advanced: [
        {
          attribute: 'pvm_ibmi_vlan_tag_id',
          property: 'vlanTagId',
          type: 'text',
          value: '',
          validations: {
            isRequired: false,
          },
        },
        {
          attribute: 'pvm_ibmi_max_frame_size',
          property: 'maxFrameSize',
          type: 'dropdown',
          value: '',
          validations: {
            isRequired: true,
          },
        },
      ],
    },
  },
};
