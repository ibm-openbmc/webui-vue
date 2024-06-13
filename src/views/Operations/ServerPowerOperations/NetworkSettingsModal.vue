<template>
  <b-modal
    id="modal-network-settings"
    ref="modal"
    size="xl"
    :title="$t('pageServerPowerOperations.modal.networkSettings.header')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
    @ok="okFormSubmit"
    @cancel="resetForm"
  >
    <b-form id="network-settings-form" novalidate @submit.prevent>
      <b-container fluid="xl">
        <h3>
          {{
            $t(
              'pageServerPowerOperations.modal.networkSettings.settingsHeading',
            )
          }}
        </h3>
        <span>
          {{
            $t(
              'pageServerPowerOperations.modal.networkSettings.settingsDescription',
            )
          }}
        </span>
        <!-- network-install-type -->
        <b-row v-if="attributesList !== null" class="mt-3 mb-3">
          <b-col>
            <b-col sm="6" xl="6">
              <b-form-group
                :label="
                  $t(
                    'pageServerPowerOperations.modal.networkSettings.networkTypeHeading',
                  )
                "
                class="mb-2"
              >
                <b-form-select
                  id="network-install-type"
                  v-model="attributesList['pvm_ibmi_network_install_type']"
                  :options="networkValuesArr"
                  size="sm"
                >
                </b-form-select>
              </b-form-group>
            </b-col>
            <!-- ipaddress-protocol -->
            <b-col sm="6" xl="6">
              <b-form-group
                v-if="
                  attributesList !== null &&
                  attributesList['pvm_ibmi_network_install_type'] !== 'Disabled'
                "
                :label="
                  $t(
                    'pageServerPowerOperations.modal.networkSettings.ipAddressProtocolHeading',
                  )
                "
                class="mb-2"
              >
                <b-form-select
                  id="ipaddress-protocol"
                  v-model="attributesList['pvm_ibmi_ipaddress_protocol']"
                  :options="computedIPAddressProtocolList"
                  sm="6"
                  xl="6"
                  size="sm"
                >
                </b-form-select>
              </b-form-group>
            </b-col>
            <template
              v-if="
                selectedIpProtocol &&
                selectedIpProtocol.server &&
                selectedIpProtocol.server.length > 0
              "
            >
              <h5
                v-if="
                  attributesList !== null &&
                  attributesList['pvm_ibmi_network_install_type'] !== 'Disabled'
                "
                class="mt-4"
              >
                {{
                  $t('pageServerPowerOperations.modal.networkSettings.server')
                }}:
              </h5>
              <b-row
                v-for="(server, index) in selectedIpProtocol.server"
                :key="server.property + index + 'row'"
              >
                <b-col :key="index + 'col'" sm="6" xl="6">
                  <b-form-group
                    v-if="
                      attributesList !== null &&
                      attributesList['pvm_ibmi_network_install_type'] !==
                        'Disabled'
                    "
                    :key="server.property + index"
                    :label="
                      server.validations.isRequired
                        ? $t(
                            `pageServerPowerOperations.modal.networkSettings.serverSettings.${server.property}`,
                          ) + ' *'
                        : $t(
                            `pageServerPowerOperations.modal.networkSettings.serverSettings.${server.property}`,
                          )
                    "
                    class="mb-2 ml-4"
                  >
                    <b-form-input
                      :id="server.property"
                      v-model="properties[server.attribute]"
                      :state="
                        getValidationState($v.properties[server.attribute])
                      "
                      :type="server.type"
                      size="sm"
                      @input="$v.properties[server.attribute].$touch()"
                    >
                    </b-form-input>
                    <b-form-invalid-feedback role="alert">
                      {{ generateErrorMsg(server) }}
                    </b-form-invalid-feedback>
                  </b-form-group>
                </b-col>
                <b-col :key="server.property + 'col'" sm="6" xl="6">
                  <b-button
                    v-if="server.property === 'initiatorName'"
                    :key="server.property + 'button'"
                    size="sm"
                    class="mt-4"
                    @click="restoreDefault()"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.modal.networkSettings.serverSettings.restoreDefault',
                      )
                    }}
                  </b-button>
                </b-col>
              </b-row>
            </template>
            <template
              v-if="
                selectedIpProtocol &&
                selectedIpProtocol.partition &&
                selectedIpProtocol.partition.length > 0
              "
            >
              <h5
                v-if="
                  attributesList !== null &&
                  attributesList['pvm_ibmi_network_install_type'] !== 'Disabled'
                "
                class="mt-4"
              >
                {{
                  $t(
                    'pageServerPowerOperations.modal.networkSettings.partition',
                  )
                }}:
              </h5>
              <b-row
                v-for="(partition, index) in selectedIpProtocol.partition"
                :key="partition.property + index + 'row'"
              >
                <b-col :key="partition.property + index" sm="6" xl="6">
                  <b-form-group
                    v-if="
                      attributesList !== null &&
                      attributesList['pvm_ibmi_network_install_type'] !==
                        'Disabled'
                    "
                    :key="partition.property + 'group'"
                    :label="
                      partition.validations.isRequired
                        ? $t(
                            `pageServerPowerOperations.modal.networkSettings.partitionSettings.${partition.property}`,
                          ) + ' *'
                        : $t(
                            `pageServerPowerOperations.modal.networkSettings.partitionSettings.${partition.property}`,
                          )
                    "
                    class="mb-2 ml-4"
                  >
                    <b-form-input
                      :id="partition.property + 'input'"
                      v-model="properties[partition.attribute]"
                      :type="partition.type"
                      sm="6"
                      xl="6"
                      size="sm"
                      :state="
                        getValidationState($v.properties[partition.attribute])
                      "
                      @input="$v.properties[partition.attribute].$touch()"
                    >
                    </b-form-input>
                    <b-form-invalid-feedback role="alert">
                      {{ generateErrorMsg(partition) }}
                    </b-form-invalid-feedback>
                  </b-form-group>
                </b-col>
              </b-row>
            </template>
            <template
              v-if="
                selectedIpProtocol &&
                selectedIpProtocol.advanced &&
                selectedIpProtocol.advanced.length > 0
              "
            >
              <h5
                v-if="
                  attributesList !== null &&
                  attributesList['pvm_ibmi_network_install_type'] !== 'Disabled'
                "
                class="mt-4"
              >
                {{
                  $t(
                    'pageServerPowerOperations.modal.networkSettings.advanced',
                  )
                }}:
              </h5>
              <b-row
                v-for="(advanced, index) in selectedIpProtocol.advanced"
                :key="advanced.property + index + 'row'"
              >
                <b-col :key="advanced.property + index" sm="6" xl="6">
                  <b-form-group
                    v-if="
                      attributesList !== null &&
                      attributesList['pvm_ibmi_network_install_type'] !==
                        'Disabled'
                    "
                    :key="advanced.property + 'group'"
                    :label="
                      $t(
                        `pageServerPowerOperations.modal.networkSettings.advancedSettings.${advanced.property}`,
                      )
                    "
                    class="mb-2 ml-4"
                  >
                    <b-form-select
                      v-if="advanced.type === 'dropdown'"
                      :id="advanced.property"
                      v-model="attributesList['pvm_ibmi_max_frame_size']"
                      :options="maxFrameSizeArr"
                      sm="6"
                      xl="6"
                      size="sm"
                    >
                    </b-form-select>
                    <template v-else>
                      <b-form-input
                        :id="advanced.property"
                        v-model="properties[advanced.attribute]"
                        :type="advanced.type"
                        sm="6"
                        xl="6"
                        size="sm"
                        :state="
                          getValidationState($v.properties[advanced.attribute])
                        "
                        @input="$v.properties[advanced.attribute].$touch()"
                      >
                      </b-form-input>
                      <b-form-invalid-feedback role="alert">
                        {{ generateErrorMsg(advanced) }}
                      </b-form-invalid-feedback>
                    </template>
                  </b-form-group>
                </b-col>
              </b-row>
            </template>
          </b-col>
        </b-row>
      </b-container>
    </b-form>
    <template #modal-footer="{ ok, cancel }">
      <b-button variant="secondary" size="sm" @click="cancel()">
        {{ $t('pageServerPowerOperations.modal.networkSettings.cancel') }}
      </b-button>
      <b-button
        form="network-settings-form"
        type="submit"
        variant="primary"
        data-test-id="network-settings-button-ok"
        size="sm"
        @click="ok()"
      >
        {{ $t('pageServerPowerOperations.modal.networkSettings.submit') }}
      </b-button>
    </template>
  </b-modal>
</template>
<script>
import {
  required,
  ipAddress,
  helpers,
  between,
  minLength,
  maxLength,
  requiredIf,
} from 'vuelidate/lib/validators';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import { NETWORK_OBJECT } from '@/utilities/NetworkSettingsObject';
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants.js';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
export default {
  mixins: [BVToastMixin, VuelidateMixin],
  data() {
    return {
      networkValuesArr: ['Disabled', 'NFS', 'iSCSI'],
      maxFrameSizeArr: ['MTU1500', 'MTU9000'],
      selectedNetwork: null,
      selectedIpProtocol: null,
      networkObject: null,
      properties: {
        pvm_ibmi_server_ipaddress: '',
        pvm_ibmi_nfs_image_directory: '',
        pvm_ibmi_local_ipaddress: '',
        pvm_ibmi_subnet_mask: '',
        pvm_ibmi_gateway_ipaddress: '',
        pvm_ibmi_vlan_tag_id: '',
        pvm_ibmi_iscsi_target_name: '',
        pvm_ibmi_iscsi_initiator_name: '',
        pvm_ibmi_iscsi_target_port: '',
        chapName: '',
        chapSecret: '',
      },
    };
  },
  validations() {
    if (this.attributesList['pvm_ibmi_network_install_type'] === 'NFS') {
      if (this.attributesList['pvm_ibmi_ipaddress_protocol'] === 'IPv4') {
        return {
          properties: {
            pvm_ibmi_server_ipaddress: {
              required,
              ipAddress,
            },
            pvm_ibmi_nfs_image_directory: {
              required,
              imageDirectory: helpers.regex(
                'imageDir',
                REGEX_MAPPINGS.imageDirectory,
              ),
              maxLength: maxLength(this.nfsImageDirMaxLength),
            },
            pvm_ibmi_local_ipaddress: {
              required,
              ipAddress,
            },
            pvm_ibmi_subnet_mask: {
              required,
              ipAddress,
            },
            pvm_ibmi_gateway_ipaddress: {
              required,
              ipAddress,
            },
            pvm_ibmi_vlan_tag_id: {
              between: between(1, this.vlanTagIdUpperBound),
            },
          },
        };
      } else {
        return {
          properties: {
            pvm_ibmi_server_ipaddress: {
              required,
              ipAddress: helpers.regex('ipv6', REGEX_MAPPINGS.ipv6Address),
            },
            pvm_ibmi_nfs_image_directory: {
              required,
              imageDirectory: helpers.regex(
                'imageDir',
                REGEX_MAPPINGS.imageDirectory,
              ),
              maxLength: maxLength(this.nfsImageDirMaxLength),
            },
            pvm_ibmi_local_ipaddress: {
              required,
              ipAddress: helpers.regex('ipv6', REGEX_MAPPINGS.ipv6Address),
            },
            pvm_ibmi_gateway_ipaddress: {
              required,
              ipAddress: helpers.regex('ipv6', REGEX_MAPPINGS.ipv6Address),
            },
            pvm_ibmi_vlan_tag_id: {
              between: between(1, this.vlanTagIdUpperBound),
            },
          },
        };
      }
    } else if (
      this.attributesList['pvm_ibmi_network_install_type'] === 'iSCSI'
    ) {
      return {
        properties: {
          pvm_ibmi_server_ipaddress: {
            required,
            ipAddress,
          },
          pvm_ibmi_local_ipaddress: {
            required,
            ipAddress,
          },
          pvm_ibmi_subnet_mask: {
            required,
            ipAddress,
          },
          pvm_ibmi_gateway_ipaddress: {
            required,
            ipAddress,
          },
          pvm_ibmi_vlan_tag_id: {
            between: between(1, this.vlanTagIdUpperBound),
          },
          pvm_ibmi_iscsi_target_name: {
            required,
            maxLength: maxLength(this.targetNameMaxLength),
          },
          pvm_ibmi_iscsi_initiator_name: {
            required,
            maxLength: maxLength(this.initiatorNameMaxLength),
          },
          pvm_ibmi_iscsi_target_port: {
            between: between(1, this.targetPortUpperBound),
          },
          chapName: {
            requiredIf: requiredIf('chapSecret'),
            maxLength: maxLength(32),
          },
          chapSecret: {
            requiredIf: requiredIf('chapName'),
            minLength: minLength(12),
            maxLength: maxLength(32),
          },
        },
      };
    } else {
      return {
        properties: {},
      };
    }
  },
  computed: {
    attributesList() {
      return this.$store.getters['networkSettings/biosAttributes'];
    },
    computedIPAddressProtocolList() {
      if (this.attributesList['pvm_ibmi_network_install_type'] === 'NFS')
        return ['IPv4', 'IPv6'];
      else return ['IPv4'];
    },
    nfsImageDirMaxLength() {
      return this.$store.getters['networkSettings/nfsImageDirMaxLength'];
    },
    initiatorNameMaxLength() {
      return this.$store.getters['networkSettings/initiatorNameMaxLength'];
    },
    targetNameMaxLength() {
      return this.$store.getters['networkSettings/targetNameMaxLength'];
    },
    targetPortUpperBound() {
      return this.$store.getters['networkSettings/targetPortUpperBound'];
    },
    vlanTagIdUpperBound() {
      return this.$store.getters['networkSettings/vlanTagIdUpperBound'];
    },
  },
  watch: {
    attributesList: {
      handler() {
        if (this.attributesList['pvm_ibmi_network_install_type'] === 'NFS') {
          this.selectedNetwork = this.networkObject.nfs;
          if (this.attributesList['pvm_ibmi_ipaddress_protocol'] === 'IPv4') {
            this.selectedIpProtocol = this.networkObject.nfs.ipv4;
          } else {
            this.selectedIpProtocol = this.networkObject.nfs.ipv6;
          }
        } else if (
          this.attributesList['pvm_ibmi_network_install_type'] === 'iSCSI'
        ) {
          this.attributesList['pvm_ibmi_ipaddress_protocol'] = 'IPv4';
          this.selectedNetwork = this.networkObject.iscsi;
          this.selectedIpProtocol = this.networkObject.iscsi.ipv4;
          if (
            this.selectedIpProtocol &&
            this.selectedIpProtocol?.server &&
            this.selectedIpProtocol.server.length > 0
          ) {
            let initiatorName = this.selectedIpProtocol.server.find(
              (element) => element.property === 'initiatorName',
            );
            initiatorName.value =
              this.attributesList['pvm_ibmi_iscsi_initiator_name'];
            this.properties.pvm_ibmi_iscsi_initiator_name =
              this.attributesList['pvm_ibmi_iscsi_initiator_name'];
          }
        } else {
          this.selectedNetwork = this.networkObject.disabled;
          this.selectedIpProtocol = this.networkObject.disabled;
        }
        if (
          this.selectedIpProtocol &&
          this.selectedIpProtocol?.advanced &&
          this.selectedIpProtocol.advanced.length > 0
        ) {
          let maxFrame = this.selectedIpProtocol.advanced.find(
            (element) => element.property === 'maxFrameSize',
          );
          maxFrame.value = this.attributesList['pvm_ibmi_max_frame_size'];
        }
      },
      deep: true,
    },
  },
  created() {
    this.getCurrentValues();
  },
  methods: {
    getCurrentValues() {
      this.$store.dispatch('networkSettings/getBiosAttributes');
      this.$store.dispatch('networkSettings/getPropertyLimits');
      this.networkObject = Object.assign({}, NETWORK_OBJECT);
    },
    okFormSubmit(bvModalEvt) {
      // prevent modal close
      bvModalEvt.preventDefault();
      this.handleSubmit();
    },
    resetForm() {
      this.properties = {
        pvm_ibmi_server_ipaddress: '',
        pvm_ibmi_nfs_image_directory: '',
        pvm_ibmi_local_ipaddress: '',
        pvm_ibmi_subnet_mask: '',
        pvm_ibmi_gateway_ipaddress: '',
        pvm_ibmi_vlan_tag_id: '',
        pvm_ibmi_iscsi_target_name: '',
        pvm_ibmi_iscsi_initiator_name: '',
        pvm_ibmi_iscsi_target_port: '',
        chapName: '',
        chapSecret: '',
      };
      this.getCurrentValues();
      this.$v.$reset();
    },
    handleSubmit() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      let form = {};
      let chapData = {};
      if (this.attributesList['pvm_ibmi_network_install_type'] === 'NFS') {
        if (this.attributesList['pvm_ibmi_ipaddress_protocol'] === 'IPv4') {
          form = {
            pvm_ibmi_network_install_type:
              this.attributesList['pvm_ibmi_network_install_type'],
            pvm_ibmi_ipaddress_protocol:
              this.attributesList['pvm_ibmi_ipaddress_protocol'],
            pvm_ibmi_server_ipaddress:
              this.properties.pvm_ibmi_server_ipaddress,
            pvm_ibmi_nfs_image_directory:
              this.properties.pvm_ibmi_nfs_image_directory,
            pvm_ibmi_local_ipaddress: this.properties.pvm_ibmi_local_ipaddress,
            pvm_ibmi_subnet_mask: this.properties.pvm_ibmi_subnet_mask,
            pvm_ibmi_gateway_ipaddress:
              this.properties.pvm_ibmi_gateway_ipaddress,
            pvm_ibmi_max_frame_size:
              this.attributesList['pvm_ibmi_max_frame_size'],
          };
          if (this.properties.pvm_ibmi_vlan_tag_id !== '') {
            form = {
              ...form,
              pvm_ibmi_vlan_tag_id: Number(
                this.properties.pvm_ibmi_vlan_tag_id,
              ),
            };
          }
        } else {
          form = {
            pvm_ibmi_network_install_type:
              this.attributesList['pvm_ibmi_network_install_type'],
            pvm_ibmi_ipaddress_protocol:
              this.attributesList['pvm_ibmi_ipaddress_protocol'],
            pvm_ibmi_server_ipaddress:
              this.properties.pvm_ibmi_server_ipaddress,
            pvm_ibmi_nfs_image_directory:
              this.properties.pvm_ibmi_nfs_image_directory,
            pvm_ibmi_local_ipaddress: this.properties.pvm_ibmi_local_ipaddress,
            pvm_ibmi_gateway_ipaddress:
              this.properties.pvm_ibmi_gateway_ipaddress,
            pvm_ibmi_max_frame_size:
              this.attributesList['pvm_ibmi_max_frame_size'],
          };
          if (this.properties.pvm_ibmi_vlan_tag_id !== '') {
            form = {
              ...form,
              pvm_ibmi_vlan_tag_id: Number(
                this.properties.pvm_ibmi_vlan_tag_id,
              ),
            };
          }
        }
      } else if (
        this.attributesList['pvm_ibmi_network_install_type'] === 'iSCSI'
      ) {
        form = {
          pvm_ibmi_network_install_type:
            this.attributesList['pvm_ibmi_network_install_type'],
          pvm_ibmi_ipaddress_protocol:
            this.attributesList['pvm_ibmi_ipaddress_protocol'],
          pvm_ibmi_server_ipaddress: this.properties.pvm_ibmi_server_ipaddress,
          pvm_ibmi_local_ipaddress: this.properties.pvm_ibmi_local_ipaddress,
          pvm_ibmi_subnet_mask: this.properties.pvm_ibmi_subnet_mask,
          pvm_ibmi_gateway_ipaddress:
            this.properties.pvm_ibmi_gateway_ipaddress,
          pvm_ibmi_iscsi_target_name:
            this.properties.pvm_ibmi_iscsi_target_name,
          pvm_ibmi_iscsi_initiator_name:
            this.properties.pvm_ibmi_iscsi_initiator_name,
          pvm_ibmi_max_frame_size:
            this.attributesList['pvm_ibmi_max_frame_size'],
        };
        chapData = {
          chapName: this.properties.chapName,
          chapSecret: this.properties.chapSecret,
        };
        if (this.properties.pvm_ibmi_vlan_tag_id !== '') {
          form = {
            ...form,
            pvm_ibmi_vlan_tag_id: Number(this.properties.pvm_ibmi_vlan_tag_id),
          };
        }
        if (this.properties.pvm_ibmi_iscsi_target_port !== '') {
          form = {
            ...form,
            pvm_ibmi_iscsi_target_port: Number(
              this.properties.pvm_ibmi_iscsi_target_port,
            ),
          };
        }
      } else {
        form = {
          pvm_ibmi_network_install_type:
            this.attributesList['pvm_ibmi_network_install_type'],
        };
      }
      //Set IBM i partition boot mode to 'D_mode'
      this.$store
        .dispatch('networkSettings/setDMode')
        .then(() => {
          this.$store
            .dispatch('networkSettings/saveBiosSettings', { form })
            .then((msg) => {
              if (
                form.pvm_ibmi_network_install_type === 'iSCSI' &&
                chapData.chapName !== '' &&
                chapData.chapSecret !== ''
              ) {
                this.$store
                  .dispatch('networkSettings/updateChapData', { chapData })
                  .then((msge) => {
                    this.$bvModal.hide('modal-network-settings');
                    this.successToast(msge);
                    this.resetForm();
                  })
                  .catch((msge) => this.errorToast(msge.message));
              } else {
                this.$bvModal.hide('modal-network-settings');
                this.successToast(msg);
                this.resetForm();
              }
            })
            .catch((msg) => this.errorToast(msg.message));
        })
        .catch(({ message }) => this.errorToast(message));
    },
    restoreDefault() {
      this.$store
        .dispatch('networkSettings/restoreDefault')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    isInvalid(attributeValue, validationValue) {
      return (
        Object.hasOwn(attributeValue, validationValue) &&
        !attributeValue[validationValue]
      );
    },
    generateErrorMsg(value) {
      const validationAttribute = this.$v.properties[value.attribute];
      const attribute = value.attribute;
      if (this.isInvalid(validationAttribute, 'required')) {
        return this.$t('global.form.fieldRequired');
      } else if (this.isInvalid(validationAttribute, 'ipAddress')) {
        if (validationAttribute.$params.ipAddress.type === 'ipv6') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidIpv6',
          );
        }
        return this.$t(
          'pageServerPowerOperations.modal.networkSettings.validators.invalidIpv4',
        );
      } else if (this.isInvalid(validationAttribute, 'imageDirectory'))
        return this.$t(
          'pageServerPowerOperations.modal.networkSettings.validators.invalidImageDirectory',
        );
      else if (this.isInvalid(validationAttribute, 'requiredIf')) {
        if (attribute === 'chapName') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.chapNameRequired',
          );
        }
        return this.$t(
          'pageServerPowerOperations.modal.networkSettings.validators.chapSecretRequired',
        );
      } else if (
        this.isInvalid(validationAttribute, 'minLength') ||
        this.isInvalid(validationAttribute, 'maxLength')
      ) {
        if (attribute === 'chapName') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
            {
              field: this.$t(
                'pageServerPowerOperations.modal.networkSettings.serverSettings.chapName',
              ),
              max: 32,
            },
          );
        } else if (attribute === 'chapSecret') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidChapSecretLength',
            {
              min: 12,
              max: 32,
            },
          );
        } else if (attribute === 'pvm_ibmi_iscsi_target_name') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
            {
              field: this.$t(
                'pageServerPowerOperations.modal.networkSettings.serverSettings.targetName',
              ),
              max: this.targetNameMaxLength,
            },
          );
        } else if (attribute === 'pvm_ibmi_iscsi_initiator_name') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
            {
              field: this.$t(
                'pageServerPowerOperations.modal.networkSettings.serverSettings.initiatorName',
              ),
              max: this.initiatorNameMaxLength,
            },
          );
        } else if (attribute === 'pvm_ibmi_nfs_image_directory') {
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
            {
              field: this.$t(
                'pageServerPowerOperations.modal.networkSettings.serverSettings.imageDirectoryPath',
              ),
              max: this.nfsImageDirMaxLength,
            },
          );
        }
      } else if (this.isInvalid(validationAttribute, 'between')) {
        if (attribute === 'pvm_ibmi_vlan_tag_id')
          return this.$t(
            'pageServerPowerOperations.modal.networkSettings.validators.invalidVlanTagId',
            {
              min: 1,
              max: this.vlanTagIdUpperBound,
            },
          );
        else if (attribute === 'pvm_ibmi_iscsi_target_port');
        return this.$t(
          'pageServerPowerOperations.modal.networkSettings.validators.invalidIsciTargetPort',
          {
            min: 1,
            max: this.targetPortUpperBound,
          },
        );
      }
    },
  },
};
</script>
