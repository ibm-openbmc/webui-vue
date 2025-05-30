<template>
  <BModal
    id="modal-network-settings"
    v-model="modal"
    size="xl"
    :title="$t('pageServerPowerOperations.modal.networkSettings.header')"
    title-tag="h2"
    scrollable
    centered
    no-close-on-esc
    no-close-on-backdrop
    ok-title="Submit"
    @ok="okFormSubmit"
    @cancel="resetForm"
  >
    <BForm id="network-settings-form" novalidate @submit.prevent>
      <BContainer fluid="xl">
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
        <BRow v-if="attributesList !== null" class="mt-3 mb-3">
          <BCol>
            <BCol sm="6" xl="6">
              <BFormGroup
                :label="
                  $t(
                    'pageServerPowerOperations.modal.networkSettings.networkTypeHeading',
                  )
                "
                class="mb-2"
              >
                <BFormSelect
                  id="network-install-type"
                  v-model="attributesList['pvm_ibmi_network_install_type']"
                  :options="networkValuesArr"
                  size="sm"
                >
                </BFormSelect>
              </BFormGroup>
            </BCol>
            <!-- ipaddress-protocol -->
            <BCol sm="6" xl="6">
              <BFormGroup
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
                <BFormSelect
                  id="ipaddress-protocol"
                  v-model="attributesList['pvm_ibmi_ipaddress_protocol']"
                  :options="computedIPAddressProtocolList"
                  sm="6"
                  xl="6"
                  size="sm"
                >
                </BFormSelect>
              </BFormGroup>
            </BCol>
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
              <BRow
                v-for="(server, index) in selectedIpProtocol.server"
                :key="server.property + index + 'row'"
              >
                <BCol :key="index + 'col'" sm="6" xl="6">
                  <BFormGroup
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
                    <BFormInput
                      :id="server.property"
                      v-model="properties[server.attribute]"
                      :state="
                        getValidationState(v$.properties[server.attribute])
                      "
                      :type="server.type"
                      size="sm"
                      @input="v$.properties[server.attribute].$touch()"
                    >
                    </BFormInput>
                    <BFormInvalidFeedback role="alert">
                      {{ generateErrorMsg(server) }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
                <BCol :key="server.property + 'col'" sm="6" xl="6">
                  <BButton
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
                  </BButton>
                </BCol>
              </BRow>
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
              <BRow
                v-for="(partition, index) in selectedIpProtocol.partition"
                :key="partition.property + index + 'row'"
              >
                <BCol :key="partition.property + index" sm="6" xl="6">
                  <BFormGroup
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
                    <BFormInput
                      :id="partition.property + 'input'"
                      v-model="properties[partition.attribute]"
                      :type="partition.type"
                      sm="6"
                      xl="6"
                      size="sm"
                      :state="
                        getValidationState(v$.properties[partition.attribute])
                      "
                      @input="v$.properties[partition.attribute].$touch()"
                    >
                    </BFormInput>
                    <BFormInvalidFeedback role="alert">
                      {{ generateErrorMsg(partition) }}
                    </BFormInvalidFeedback>
                  </BFormGroup>
                </BCol>
              </BRow>
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
              <BRow
                v-for="(advanced, index) in selectedIpProtocol.advanced"
                :key="advanced.property + index + 'row'"
              >
                <BCol :key="advanced.property + index" sm="6" xl="6">
                  <BFormGroup
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
                    <BFormSelect
                      v-if="advanced.type === 'dropdown'"
                      :id="advanced.property"
                      v-model="attributesList['pvm_ibmi_max_frame_size']"
                      :options="maxFrameSizeArr"
                      sm="6"
                      xl="6"
                      size="sm"
                    >
                    </BFormSelect>
                    <template v-else>
                      <BFormInput
                        :id="advanced.property"
                        v-model="properties[advanced.attribute]"
                        :type="advanced.type"
                        sm="6"
                        xl="6"
                        size="sm"
                        :state="
                          getValidationState(v$.properties[advanced.attribute])
                        "
                        @input="v$.properties[advanced.attribute].$touch()"
                      >
                      </BFormInput>
                      <BFormInvalidFeedback role="alert">
                        {{ generateErrorMsg(advanced) }}
                      </BFormInvalidFeedback>
                    </template>
                  </BFormGroup>
                </BCol>
              </BRow>
            </template>
          </BCol>
        </BRow>
      </BContainer>
    </BForm>
    <template #modal-footer="{ ok, cancel }">
      <BButton variant="secondary" size="sm" @click="cancel()">
        {{ $t('pageServerPowerOperations.modal.networkSettings.cancel') }}
      </BButton>
      <BButton
        form="network-settings-form"
        type="submit"
        variant="primary"
        data-test-id="network-settings-button-ok"
        size="sm"
        @click="ok()"
      >
        {{ $t('pageServerPowerOperations.modal.networkSettings.submit') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import i18n from '@/i18n';
import eventBus from '@/eventBus';
import {
  required,
  ipAddress,
  helpers,
  between,
  minLength,
  maxLength,
  requiredIf,
} from '@vuelidate/validators';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { NETWORK_OBJECT } from '@/utilities/NetworkSettingsObject.js';
import { REGEX_MAPPINGS } from '@/utilities/GlobalConstants.js';
import { NetworkSettingsStore } from '@/store';

const { getValidationState } = useVuelidateComposable();

const networkSettingsStore = NetworkSettingsStore();

const { successToast, errorToast } = useToast();

const modal = ref(false);

eventBus.on('modal-network-settings', () => {
  modal.value = true;
});

const networkValuesArr = ref(['Disabled', 'NFS', 'iSCSI']);
const maxFrameSizeArr = ref(['MTU1500', 'MTU9000']);
const selectedNetwork = ref(null);
const selectedIpProtocol = ref(null);
const networkObject = ref(null);
const properties = ref({
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
});

const attributesList = computed(() => {
  return networkSettingsStore.biosAttributesGetter;
});

const computedIPAddressProtocolList = computed(() => {
  if (attributesList.value?.['pvm_ibmi_network_install_type'] === 'NFS')
    return ['IPv4', 'IPv6'];
  else return ['IPv4'];
});

const nfsImageDirMaxLength = computed(() => {
  return networkSettingsStore.nfsImageDirMaxLengthGetter;
});

const initiatorNameMaxLength = computed(() => {
  return networkSettingsStore.initiatorNameMaxLengthGetter;
});

const targetNameMaxLength = computed(() => {
  return networkSettingsStore.targetNameMaxLengthGetter;
});

const targetPortUpperBound = computed(() => {
  return networkSettingsStore.targetPortUpperBoundGetter;
});

const vlanTagIdUpperBound = computed(() => {
  return networkSettingsStore.vlanTagIdUpperBoundGetter;
});

watch(
  () => attributesList,
  () => {
    if (attributesList.value['pvm_ibmi_network_install_type'] === 'NFS') {
      selectedNetwork.value = networkObject.value.nfs;
      if (attributesList.value['pvm_ibmi_ipaddress_protocol'] === 'IPv4') {
        selectedIpProtocol.value = networkObject.value.nfs.ipv4;
      } else {
        selectedIpProtocol.value = networkObject.value.nfs.ipv6;
      }
    } else if (
      attributesList.value['pvm_ibmi_network_install_type'] === 'iSCSI'
    ) {
      attributesList.value['pvm_ibmi_ipaddress_protocol'] = 'IPv4';
      selectedNetwork.value = networkObject.value.iscsi;
      selectedIpProtocol.value = networkObject.value.iscsi.ipv4;
      if (
        selectedIpProtocol.value &&
        selectedIpProtocol.value?.server &&
        selectedIpProtocol.value.server.length > 0
      ) {
        let initiatorName = selectedIpProtocol.value.server.find(
          (element) => element.property === 'initiatorName',
        );
        initiatorName.value =
          attributesList.value['pvm_ibmi_iscsi_initiator_name'];
        properties.value.pvm_ibmi_iscsi_initiator_name =
          attributesList.value['pvm_ibmi_iscsi_initiator_name'];
      }
    } else {
      selectedNetwork.value = networkObject.value.disabled;
      selectedIpProtocol.value = networkObject.value.disabled;
    }
    if (
      selectedIpProtocol.value &&
      selectedIpProtocol.value.advanced &&
      selectedIpProtocol.value.advanced.length > 0
    ) {
      let maxFrame = selectedIpProtocol.value.advanced.find(
        (element) => element.property === 'maxFrameSize',
      );
      maxFrame.value = attributesList.value['pvm_ibmi_max_frame_size'];
    }
  },
  { deep: true },
);

const rules = computed(() => {
  if (attributesList.value?.['pvm_ibmi_network_install_type'] === 'NFS') {
    if (attributesList.value['pvm_ibmi_ipaddress_protocol'] === 'IPv4') {
      return {
        properties: {
          pvm_ibmi_server_ipaddress: {
            required,
            ipAddress,
          },
          pvm_ibmi_nfs_image_directory: {
            required,
            imageDirectory: helpers.regex(REGEX_MAPPINGS.imageDirectory),
            maxLength: maxLength(nfsImageDirMaxLength.value),
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
            between: between(1, vlanTagIdUpperBound.value),
          },
        },
      };
    } else {
      return {
        properties: {
          pvm_ibmi_server_ipaddress: {
            required,
            ipAddressV6: helpers.regex(REGEX_MAPPINGS.ipv6Address),
          },
          pvm_ibmi_nfs_image_directory: {
            required,
            imageDirectory: helpers.regex(REGEX_MAPPINGS.imageDirectory),
            maxLength: maxLength(nfsImageDirMaxLength.value),
          },
          pvm_ibmi_local_ipaddress: {
            required,
            ipAddressV6: helpers.regex(REGEX_MAPPINGS.ipv6Address),
          },
          pvm_ibmi_gateway_ipaddress: {
            required,
            ipAddressV6: helpers.regex(REGEX_MAPPINGS.ipv6Address),
          },
          pvm_ibmi_vlan_tag_id: {
            between: between(1, vlanTagIdUpperBound.value),
          },
        },
      };
    }
  } else if (
    attributesList.value?.['pvm_ibmi_network_install_type'] === 'iSCSI'
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
          between: between(1, vlanTagIdUpperBound.value),
        },
        pvm_ibmi_iscsi_target_name: {
          required,
          maxLength: maxLength(targetNameMaxLength.value),
        },
        pvm_ibmi_iscsi_initiator_name: {
          required,
          maxLength: maxLength(initiatorNameMaxLength.value),
        },
        pvm_ibmi_iscsi_target_port: {
          between: between(1, targetPortUpperBound.value),
        },
        chapName: {
          requiredIf: requiredIf(function (_, form) {
            return form.chapSecret;
          }),
          maxLength: maxLength(32),
        },
        chapSecret: {
          requiredIf: requiredIf(function (_, form) {
            return form.chapName;
          }),
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
});

const v$ = useVuelidate(rules, {
  properties,
});

function getCurrentValues() {
  networkSettingsStore.getBiosAttributes();
  networkSettingsStore.getPropertyLimits();
  networkObject.value = Object.assign({}, NETWORK_OBJECT);
}

function okFormSubmit(bvModalEvt) {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
}

function resetForm() {
  properties.value = {
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
  getCurrentValues();
  v$.value.$reset();
}

function handleSubmit() {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  let form = {};
  let chapData = {};
  if (attributesList.value['pvm_ibmi_network_install_type'] === 'NFS') {
    if (attributesList.value['pvm_ibmi_ipaddress_protocol'] === 'IPv4') {
      form = {
        pvm_ibmi_network_install_type:
          attributesList.value['pvm_ibmi_network_install_type'],
        pvm_ibmi_ipaddress_protocol:
          attributesList.value['pvm_ibmi_ipaddress_protocol'],
        pvm_ibmi_server_ipaddress: properties.value.pvm_ibmi_server_ipaddress,
        pvm_ibmi_nfs_image_directory:
          properties.value.pvm_ibmi_nfs_image_directory,
        pvm_ibmi_local_ipaddress: properties.value.pvm_ibmi_local_ipaddress,
        pvm_ibmi_subnet_mask: properties.value.pvm_ibmi_subnet_mask,
        pvm_ibmi_gateway_ipaddress: properties.value.pvm_ibmi_gateway_ipaddress,
        pvm_ibmi_max_frame_size:
          attributesList.value['pvm_ibmi_max_frame_size'],
      };
      if (properties.value.pvm_ibmi_vlan_tag_id !== '') {
        form = {
          ...form,
          pvm_ibmi_vlan_tag_id: Number(properties.value.pvm_ibmi_vlan_tag_id),
        };
      }
    } else {
      form = {
        pvm_ibmi_network_install_type:
          attributesList.value['pvm_ibmi_network_install_type'],
        pvm_ibmi_ipaddress_protocol:
          attributesList.value['pvm_ibmi_ipaddress_protocol'],
        pvm_ibmi_server_ipaddress: properties.value.pvm_ibmi_server_ipaddress,
        pvm_ibmi_nfs_image_directory:
          properties.value.pvm_ibmi_nfs_image_directory,
        pvm_ibmi_local_ipaddress: properties.value.pvm_ibmi_local_ipaddress,
        pvm_ibmi_gateway_ipaddress: properties.value.pvm_ibmi_gateway_ipaddress,
        pvm_ibmi_max_frame_size:
          attributesList.value['pvm_ibmi_max_frame_size'],
      };
      if (properties.value.pvm_ibmi_vlan_tag_id !== '') {
        form = {
          ...form,
          pvm_ibmi_vlan_tag_id: Number(properties.value.pvm_ibmi_vlan_tag_id),
        };
      }
    }
  } else if (
    attributesList.value['pvm_ibmi_network_install_type'] === 'iSCSI'
  ) {
    form = {
      pvm_ibmi_network_install_type:
        attributesList.value['pvm_ibmi_network_install_type'],
      pvm_ibmi_ipaddress_protocol:
        attributesList.value['pvm_ibmi_ipaddress_protocol'],
      pvm_ibmi_server_ipaddress: properties.value.pvm_ibmi_server_ipaddress,
      pvm_ibmi_local_ipaddress: properties.value.pvm_ibmi_local_ipaddress,
      pvm_ibmi_subnet_mask: properties.value.pvm_ibmi_subnet_mask,
      pvm_ibmi_gateway_ipaddress: properties.value.pvm_ibmi_gateway_ipaddress,
      pvm_ibmi_iscsi_target_name: properties.value.pvm_ibmi_iscsi_target_name,
      pvm_ibmi_iscsi_initiator_name:
        properties.value.pvm_ibmi_iscsi_initiator_name,
      pvm_ibmi_max_frame_size: attributesList.value['pvm_ibmi_max_frame_size'],
    };
    chapData = {
      chapName: properties.value.chapName,
      chapSecret: properties.value.chapSecret,
    };
    if (properties.value.pvm_ibmi_vlan_tag_id !== '') {
      form = {
        ...form,
        pvm_ibmi_vlan_tag_id: Number(properties.value.pvm_ibmi_vlan_tag_id),
      };
    }
    if (properties.value.pvm_ibmi_iscsi_target_port !== '') {
      form = {
        ...form,
        pvm_ibmi_iscsi_target_port: Number(
          properties.value.pvm_ibmi_iscsi_target_port,
        ),
      };
    }
  } else {
    form = {
      pvm_ibmi_network_install_type:
        attributesList.value['pvm_ibmi_network_install_type'],
    };
  }
  //Set IBM i partition boot mode to 'D_mode'
  networkSettingsStore
    .setDMode()
    .then(() => {
      networkSettingsStore
        .saveBiosSettings({ form })
        .then((msg) => {
          if (
            form.pvm_ibmi_network_install_type === 'iSCSI' &&
            chapData.chapName !== '' &&
            chapData.chapSecret !== ''
          ) {
            networkSettingsStore
              .updateChapData({ chapData })
              .then((msge) => {
                modal.value = false;
                successToast(msge);
                resetForm();
              })
              .catch((msge) => errorToast(msge.message));
          } else {
            modal.value = false;
            successToast(msg);
            resetForm();
          }
        })
        .catch((msg) => errorToast(msg.message));
    })
    .catch(({ message }) => errorToast(message));
}

function restoreDefault() {
  networkSettingsStore
    .restoreDefault()
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function isInvalid(attributeValue, validationValue) {
  return (
    Object.hasOwn(attributeValue, validationValue) &&
    attributeValue[validationValue]?.$invalid
  );
}

function generateErrorMsg(value) {
  const validationAttribute = v$.value.properties[value.attribute];
  const attribute = value.attribute;

  if (isInvalid(validationAttribute, 'required')) {
    return i18n.global.t('global.form.fieldRequired');
  } else if (isInvalid(validationAttribute, 'ipAddress'))
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.validators.invalidIpv4',
    );
  else if (isInvalid(validationAttribute, 'ipAddressV6'))
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.validators.invalidIpv6',
    );
  else if (isInvalid(validationAttribute, 'imageDirectory'))
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.validators.invalidImageDirectory',
    );
  else if (isInvalid(validationAttribute, 'requiredIf')) {
    if (attribute === 'chapName') {
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.chapNameRequired',
      );
    }
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.validators.chapSecretRequired',
    );
  } else if (
    isInvalid(validationAttribute, 'minLength') ||
    isInvalid(validationAttribute, 'maxLength')
  ) {
    if (attribute === 'chapName') {
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
        {
          field: i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.serverSettings.chapName',
          ),
          max: 32,
        },
      );
    } else if (attribute === 'chapSecret') {
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.invalidChapSecretLength',
        {
          min: 12,
          max: 32,
        },
      );
    } else if (attribute === 'pvm_ibmi_iscsi_target_name') {
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
        {
          field: i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.serverSettings.targetName',
          ),
          max: targetNameMaxLength.value,
        },
      );
    } else if (attribute === 'pvm_ibmi_iscsi_initiator_name') {
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
        {
          field: i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.serverSettings.initiatorName',
          ),
          max: initiatorNameMaxLength.value,
        },
      );
    } else if (attribute === 'pvm_ibmi_nfs_image_directory') {
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.invalidFieldLength',
        {
          field: i18n.global.t(
            'pageServerPowerOperations.modal.networkSettings.serverSettings.imageDirectoryPath',
          ),
          max: nfsImageDirMaxLength.value,
        },
      );
    }
  } else if (isInvalid(validationAttribute, 'between')) {
    if (attribute === 'pvm_ibmi_vlan_tag_id')
      return i18n.global.t(
        'pageServerPowerOperations.modal.networkSettings.validators.invalidVlanTagId',
        {
          min: 1,
          max: vlanTagIdUpperBound.value,
        },
      );
    else if (attribute === 'pvm_ibmi_iscsi_target_port');
    return i18n.global.t(
      'pageServerPowerOperations.modal.networkSettings.validators.invalidIsciTargetPort',
      {
        min: 1,
        max: targetPortUpperBound.value,
      },
    );
  }
}

onBeforeMount(() => {
  getCurrentValues();
});
</script>
