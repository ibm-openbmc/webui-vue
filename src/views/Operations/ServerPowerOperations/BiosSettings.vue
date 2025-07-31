<template>
  <div>
    <BRow>
      <template v-for="(attriValuesArr, key) of attributeValues">
        <BCol
          v-if="
            attriValuesArr.length >= 2 &&
            key !== 'pvm_system_power_off_policy' &&
            key !== 'pvm_system_operating_mode' &&
            validateAttributeKeys(attributeKeys.pvm_default_os_type, key)
          "
          :key="key"
          sm="8"
          xl="6"
        >
          <BFormGroup
            v-if="
              hmcManagedChecks(
                $t(`${'pageServerPowerOperations.biosSettings'}.${key}`)
              )
            "
            :key="key"
            :label="$t(`${'pageServerPowerOperations.biosSettings'}.${key}`)"
            class="mb-4 form-group"
          >
            <BFormSelect
              id="bios-option-sysOp-mode"
              v-model="attributeKeys[key]"
              :options="attriValuesArr"
              :disabled="disabled"
            >
            </BFormSelect>
          </BFormGroup>
        </BCol>
        <BCol
          v-else-if="
            validateAttributeKeys(attributeKeys.pvm_default_os_type, key)
          "
          :key="key + '_'"
          class="mb-3"
          sm="12"
        >
          <div
            :class="{
              'form-background p-3':
                key === 'pvm_system_operating_mode' &&
                (manualModeSelected || currentOperatingMode !== normalMode),
            }"
          >
            <BFormGroup
              :key="key"
              :label="$t(`${'pageServerPowerOperations.biosSettings'}.${key}`)"
              class="m-0 form-group"
            >
              <BRow v-if="key === 'pvm_system_operating_mode'">
                <BCol sm="5">
                  <BFormRadio
                    v-for="values of attriValuesArr"
                    :key="values.value"
                    v-model="attributeKeys[key]"
                    :value="values.value"
                    :aria-describedby="values.value"
                    :disabled="disabled"
                    @update:model-value="onChangeSystemOpsMode"
                  >
                    {{ values.text }}
                  </BFormRadio>
                </BCol>
                <div
                  v-if="
                    manualModeSelected || currentOperatingMode !== normalMode
                  "
                  class="me-4 section-left-divider"
                ></div>
                <BCol
                  v-if="
                    selectedOperatingMode &&
                    selectedOperatingMode === manualMode &&
                    selectedOperatingMode !== currentOperatingMode
                  "
                  sm="5"
                >
                  <alert variant="info" class="mb-4">
                    <p>
                      {{
                        $t(
                          'pageServerPowerOperations.biosSettings.currentOperatingModeNormal'
                        )
                      }}
                    </p>
                    <p>
                      {{
                        $t(
                          'pageServerPowerOperations.biosSettings.selectedOperatingModeManual'
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <BLink to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </BLink>
                    {{
                      $t(
                        `pageServerPowerOperations.biosSettings.powPolicySection`,
                        {
                          powerPolicy:
                            powerPolicy === 'AlwaysOff'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOff`)
                              : powerPolicy === 'AlwaysOn'
                                ? $t(`pagePowerRestorePolicy.policies.AlwaysOn`)
                                : $t(
                                    `pagePowerRestorePolicy.policies.LastState`
                                  ),
                        }
                      )
                    }}
                  </div>
                </BCol>
                <BCol
                  v-else-if="
                    selectedOperatingMode &&
                    selectedOperatingMode === normalMode &&
                    selectedOperatingMode !== currentOperatingMode
                  "
                  sm="5"
                >
                  <alert variant="info" class="mb-4">
                    <p>
                      {{
                        $t(
                          'pageServerPowerOperations.biosSettings.currentOperatingModeManual'
                        )
                      }}
                    </p>
                    <p>
                      {{
                        $t(
                          'pageServerPowerOperations.biosSettings.selectedOperatingModeNormal'
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <BLink to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </BLink>
                    {{
                      $t(
                        `pageServerPowerOperations.biosSettings.powPolicySection`,
                        {
                          powerPolicy:
                            powerPolicy === 'AlwaysOff'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOff`)
                              : powerPolicy === 'AlwaysOn'
                                ? $t(`pagePowerRestorePolicy.policies.AlwaysOn`)
                                : $t(
                                    `pagePowerRestorePolicy.policies.LastState`
                                  ),
                        }
                      )
                    }}
                  </div>
                </BCol>
                <BCol v-else-if="currentOperatingMode === manualMode" sm="5">
                  <alert variant="warning" class="mb-4">
                    <p>
                      {{
                        $t(
                          `pageServerPowerOperations.biosSettings.currentOperatingModeManual`,
                          {
                            currOptMode: currentOperatingMode,
                          }
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <BLink to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </BLink>
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.powPolicySection',
                        {
                          powerPolicy:
                            powerPolicy === 'AlwaysOff'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOff`)
                              : powerPolicy === 'AlwaysOn'
                                ? $t(`pagePowerRestorePolicy.policies.AlwaysOn`)
                                : $t(
                                    `pagePowerRestorePolicy.policies.LastState`
                                  ),
                        }
                      )
                    }}
                  </div>
                </BCol>
              </BRow>
              <template v-for="(values, keys) of attriValuesArr">
                <template v-if="key === 'pvm_system_power_off_policy'">
                  <BFormRadio
                    :key="values.value"
                    v-model="attributeKeys[key]"
                    :value="values.value"
                    :aria-describedby="values.value"
                    :disabled="disabled"
                  >
                    <template v-if="values.value === 'Power Off'">{{
                      $t('pageServerPowerOperations.biosSettings.powerOff')
                    }}</template>
                    <template v-if="values.value === 'Stay On'">{{
                      $t('pageServerPowerOperations.biosSettings.stayOn')
                    }}</template>
                    <template v-if="values.value === 'Automatic'">{{
                      $t('pageServerPowerOperations.biosSettings.automatic')
                    }}</template>
                  </BFormRadio>
                  <BFormText
                    v-if="values.value === 'Power Off'"
                    :id="values.value"
                    :key="keys"
                    class="ms-4"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.powerOffHelperText'
                      )
                    }}
                  </BFormText>
                  <BFormText
                    v-if="values.value === 'Automatic'"
                    :id="values.value"
                    :key="keys"
                    class="ms-4"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.automaticHelperText'
                      )
                    }}
                  </BFormText>
                  <BFormText
                    v-if="values.value === 'Stay On'"
                    :id="values.value"
                    :key="keys"
                    class="ms-4"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.stayOnHelperText'
                      )
                    }}
                  </BFormText>
                </template>
              </template>
            </BFormGroup>
          </div>
        </BCol>
      </template>
      <template v-for="(taggedSetting, index) in taggedSettingValues">
        <b-col
          v-if="
            attributeKeys.pvm_default_os_type === 'IBM I' ||
            attributeKeys.pvm_default_os_type === 'Default'
          "
          :key="taggedSetting.settingKey"
          sm="8"
          xl="6"
        >
          <BFormGroup
            v-if="!isHmcManaged()"
            :key="index"
            :label="
              $t(
                `${'pageServerPowerOperations.biosSettings'}.${taggedSetting.settingKey}`
              )
            "
            class="mb-4 form-group"
          >
            <BFormSelect
              id="bios-option-sysOp-mode"
              v-model="taggedSetting.settingValue"
              :options="taggedSettingsOptions"
              :disabled="!isAtleastPhypInStandby || disabled"
              @input="
                changeTaggedSettingsValue(
                  taggedSetting.settingKey,
                  taggedSetting.settingValue
                )
              "
            >
            </BFormSelect>
          </BFormGroup>
        </b-col>
      </template>
    </BRow>
    <BRow>
      <BCol
        v-if="
          !isHmcManaged() &&
          attributeKeys['pvm_default_os_type'] === 'Linux KVM'
        "
        key="percentage"
        sm="8"
        xl="6"
      >
        <BFormGroup
          label-for="linux_kvm_percentage"
          class="mb-4 form-group"
          :label="
            $t(
              `${'pageServerPowerOperations.biosSettings.pvm_linux_kvm_percentage'}`
            )
          "
        >
          <BFormInput
            v-if="
              attributeKeys.pvm_linux_kvm_memory === 'Automatic' &&
              linuxKvmPercentageCurrentValue === 0
            "
            model-value="--"
            disabled
          ></BFormInput>
          <BFormInput
            v-else-if="attributeKeys.pvm_linux_kvm_memory === 'Automatic'"
            id="linux_kvm_percentage_current"
            v-model="linuxKvmPercentageCurrentValue"
            type="number"
            disabled
            step="0.1"
            min="0.0"
            max="100.0"
          />
          <BFormInput
            v-else
            id="linux_kvm_percentage"
            v-model="linuxKvmPercentageValue"
            type="number"
            :disabled="
              attributeKeys.pvm_linux_kvm_memory === 'Automatic' || disabled
            "
            step="0.1"
            min="0.0"
            max="100.0"
            @keypress="validateLinuxKvmPercentage"
            @update:model-value="changeLinuxKvmPercentageValue"
          />
          <span
            v-if="
              linuxKvmPercentageValue < 0.0 ||
              linuxKvmPercentageValue > 100.0 ||
              !isLinuxKvmValid
            "
            class="error-text"
          >
            {{
              $t(
                'pageServerPowerOperations.biosSettings.linuxKvmPercentage.errorMessage'
              )
            }}
          </span>
        </BFormGroup>
      </BCol>
    </BRow>
    <BRow class="mb-3">
      <BCol xl="10">
        <BButton v-b-toggle.collapse-role-table variant="link">
          <icon-chevron />
          {{
            $t('pageServerPowerOperations.biosSettings.powerSettingDescription')
          }}
        </BButton>
        <BCollapse id="collapse-role-table" class="mt-3">
          <BTable
            thead-class="thead-light"
            hover
            :items="serverFirmwareItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{ $t('pageServerPowerOperations.biosSettings.serverFirmware') }}
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="defaultPartitionItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{
                $t('pageServerPowerOperations.biosSettings.defaultPartition')
              }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="aixPartitionItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{ $t('pageServerPowerOperations.biosSettings.aixLinux') }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="ibmiItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{ $t('pageServerPowerOperations.biosSettings.ibmIPartition') }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="ibmiLoadSourceItems"
            :fields="taggedSettingsFields"
            caption-top
          >
            <template #table-caption>
              {{
                $t(
                  'pageServerPowerOperations.biosSettings.pvm_ibmi_load_source'
                )
              }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="ibmiAltLoadSourceItems"
            :fields="taggedSettingsFields"
            caption-top
          >
            <template #table-caption>
              {{
                $t(
                  'pageServerPowerOperations.biosSettings.pvm_ibmi_alt_load_source'
                )
              }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="ibmiConsoleItems"
            :fields="taggedSettingsFields"
            caption-top
          >
            <template #table-caption>
              {{
                $t('pageServerPowerOperations.biosSettings.pvm_ibmi_console')
              }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="linuxKvmItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{
                $t(
                  'pageServerPowerOperations.biosSettings.pvm_linux_kvm_memory'
                )
              }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
          <BTable
            thead-class="thead-light"
            hover
            :items="linuxKvmPercentageItems"
            :fields="linuxKvmPercentageFields"
            caption-top
          >
            <template #table-caption>
              {{
                $t(
                  'pageServerPowerOperations.biosSettings.pvm_linux_kvm_percentage'
                )
              }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </BTable>
        </BCollapse>
      </BCol>
    </BRow>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeMount, watch } from 'vue';
import i18n from '@/i18n';
import Alert from '@/components/Global/Alert.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import stores from '@/store';

const globalStore = stores.GlobalStore();
const bootSettingsStore = stores.BootSettingsStore();
const resourceMemoryStore = stores.ResourceMemoryStore();

defineProps({
  attributeValues: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Boolean,
    require: true,
  },
  isInPhypStandby: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['updated-attributes', 'is-linux-kvm-valid']);

const isLinuxKvmValid = ref(true);
const manualMode = ref('Manual');
const normalMode = ref('Normal');
const currentOperatingMode = ref('');
const selectedOperatingMode = ref('');
const taggedSettingsArr = ref(['Current configuration', 'none']);

const taggedSettings = ref([
  {
    settingKey: 'pvm_ibmi_load_source',
    settingValue: 'Current configuration',
  },
  {
    settingKey: 'pvm_ibmi_alt_load_source',
    settingValue: 'Current configuration',
  },
  {
    settingKey: 'pvm_ibmi_console',
    settingValue: 'Current configuration',
  },
]);

const fields = ref([
  {
    key: 'setting',
    label: i18n.global.t('pagePower.tableRoles.setting'),
    sortable: false,
  },
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
  },
]);

const linuxKvmPercentageFields = ref([
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
  },
]);

const taggedSettingsFields = ref([
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
  },
]);

const serverFirmwareItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.autoStartOnly'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.autoStartOnly'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.autoStartAlways'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.autoStartAlways'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.standBy'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.standBy'
    ),
  },
]);

const defaultPartitionItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.aix'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.aix'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.linux'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.linux'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.ibmI'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.ibmI'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.linuxKVM'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.linuxKVM'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.default'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.default'
    ),
  },
]);

const aixPartitionItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.partitionBoot'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.partitionBoot'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.serviceBoot'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.serviceBoot'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.bootToSms'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.bootToSms'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.bootToOpenFirware'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.bootToOpenFirware'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.serviceBootMode'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.serviceBootMode'
    ),
  },
]);

const ibmiItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.a'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.a'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.b'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.b'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.c'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.c'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.d'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.d'
    ),
  },
]);

const linuxKvmItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.setting.automatic'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.description.automatic'
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.setting.custom'
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.description.custom'
    ),
  },
]);

const linuxKvmPercentageItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmPercentage.description'
    ),
  },
]);

const ibmiLoadSourceItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiLoadSource.description'
    ),
  },
]);

const ibmiAltLoadSourceItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiAltLoadSource.description'
    ),
  },
]);

const ibmiConsoleItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiConsole.description'
    ),
  },
]);

const hmcManaged = computed(() => {
  return resourceMemoryStore.hmcManagedGetter;
});

const attributeKeys = computed(() => {
  return bootSettingsStore.getBiosAttributes;
});

const isAtleastPhypInStandby = computed(() => {
  return globalStore.isInPhypStandby;
});

const manualModeSelected = computed(() => {
  return selectedOperatingMode.value == manualMode.value;
});

const powerPolicy = computed(() => {
  return bootSettingsStore.getPowerRestorePolicyValue;
});

const ibmiLoadSourceValue = computed(() => {
  return bootSettingsStore.getIbmiLoadSourceValue;
});

const ibmiAltLoadSourceValue = computed(() => {
  return bootSettingsStore.getIbmiAltLoadSourceValue;
});

const ibmiConsoleValue = computed(() => {
  return bootSettingsStore.getIbmiConsoleValue;
});

const taggedSettingValues = computed(() => {
  let taggedSettingsInfo = taggedSettings.value;
  taggedSettingsInfo[0].settingValue = ibmiLoadSourceValue.value;
  taggedSettingsInfo[1].settingValue = ibmiAltLoadSourceValue.value;
  taggedSettingsInfo[2].settingValue = ibmiConsoleValue.value;
  return taggedSettingsInfo;
});

const linuxKvmPercentageCurrentValue = computed(() => {
  return bootSettingsStore.getLinuxKvmPercentageCurrentValue;
});

const linuxKvmPercentageInitialValue = computed(() => {
  return bootSettingsStore.getLinuxKvmPercentageInitialValue;
});

const linuxKvmPercentageValue = computed({
  get() {
    return bootSettingsStore.getLinuxKvmPercentageValue;
  },
  set(newValue) {
    return newValue;
  },
});

const locationCodes = computed(() => {
  return bootSettingsStore.getLocationCodes;
});

const taggedSettingsOptions = computed(() => {
  let taggedSettingsList = [...taggedSettingsArr.value];
  return [...taggedSettingsList, ...locationCodes.value];
});

function hmcManagedChecks(value) {
  if (!isHmcManaged()) return true;
  if (
    value ===
    i18n.global.t('pageServerPowerOperations.biosSettings.pvm_stop_at_standby')
  )
    return true;
  return false;
}

function isHmcManaged() {
  return hmcManaged.value === 'Enabled' ? true : false;
}

function onChangeSystemOpsMode(value) {
  selectedOperatingMode.value = value;
  if (selectedOperatingMode.value === normalMode.value) {
    if (currentOperatingMode.value === selectedOperatingMode.value) {
      bootSettingsStore.getOperatingModeSettings();
    } else {
      bootSettingsStore.automaticRetryConfigValue = 'RetryAttempts';
      bootSettingsStore.bootFault = 'Never';
      bootSettingsStore.powerRestorePolicyValue = 'LastState';
    }
  } else if (selectedOperatingMode.value === manualMode.value) {
    bootSettingsStore.automaticRetryConfigValue = 'Disabled';
    bootSettingsStore.bootFault = 'Never';
    bootSettingsStore.powerRestorePolicyValue = 'AlwaysOff';
  }
}

function changeLinuxKvmPercentageValue(value) {
  let valueAsString = value.toString();
  let regex = /^\d+(\.\d?)?$/;
  if (regex.test(valueAsString)) {
    isLinuxKvmValid.value = true;
  } else {
    isLinuxKvmValid.value = false;
  }
  bootSettingsStore.saveLinuxPercentageValue(value);
}

function changeTaggedSettingsValue(key, value) {
  bootSettingsStore.saveTaggedSettingsValue({
    key,
    value,
  });
}

function validateLinuxKvmPercentage($event) {
  let keyCode = $event.keyCode ? $event.keyCode : $event.which;
  let percentageValue = $event.target.value + $event.key;
  let decimalSet = $event.key === '.';
  if (!decimalSet) {
    // only allow number and one decimal
    if (
      (keyCode < 48 || keyCode > 57) &&
      (keyCode !== 46 || percentageValue.indexOf('.') != -1)
    ) {
      // 46 is decimal
      $event.preventDefault();
    }
  }
}

function validateAttributeKeys(defaultPartitionEnvironment, key) {
  if (key === 'pvm_rpa_boot_mode') {
    return (
      defaultPartitionEnvironment === 'Default' ||
      defaultPartitionEnvironment === 'AIX' ||
      defaultPartitionEnvironment === 'Linux'
    );
  } else if (key === 'pvm_os_boot_type') {
    return !(
      defaultPartitionEnvironment === 'AIX' ||
      defaultPartitionEnvironment === 'Linux' ||
      defaultPartitionEnvironment === 'Linux KVM'
    );
  } else if (key === 'pvm_linux_kvm_memory') {
    return defaultPartitionEnvironment === 'Linux KVM';
  } else {
    return true;
  }
}

watch(
  () => [
    attributeKeys.value,
    taggedSettingValues.value,
    linuxKvmPercentageValue.value,
  ],
  () => {
    if (attributeKeys.value['pvm_linux_kvm_memory'] === 'Custom') {
      attributeKeys.value['pvm_linux_kvm_percentage'] =
        linuxKvmPercentageValue.value * 10;
    } else {
      attributeKeys.value['pvm_linux_kvm_percentage'] =
        linuxKvmPercentageInitialValue.value * 10;
    }
    attributeKeys.value['pvm_ibmi_load_source'] =
      taggedSettingValues.value[0].settingValue;
    attributeKeys.value['pvm_ibmi_alt_load_source'] =
      taggedSettingValues.value[1].settingValue;
    attributeKeys.value['pvm_ibmi_console'] =
      taggedSettingValues.value[2].settingValue;
    emit('updated-attributes', attributeKeys.value);
    emit('is-linux-kvm-valid', isLinuxKvmValid.value);
  },
  { deep: true }
);

onBeforeMount(() => {
  bootSettingsStore.fetchLocationCodes();
  setTimeout(() => {
    resourceMemoryStore.getHmcManaged();
  }, 5000);
  currentOperatingMode.value = attributeKeys.value['pvm_system_operating_mode'];
  if (currentOperatingMode.value === manualMode.value) {
    onChangeSystemOpsMode(manualMode.value);
  }
});
</script>
<style lang="scss" scoped>
caption {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  color: red;
  text-align: left;
}

.error-text {
  color: red;
  font-size: 12px;
}

.section-left-divider {
  width: 0%;
  padding-left: 0px;
  padding-right: 0px;
}

.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
}
</style>
