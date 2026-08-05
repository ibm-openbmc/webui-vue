<template>
  <div>
    <BRow>
      <template v-for="(attriValuesArr, key) of attributeValues">
        <BCol
          v-if="
            attriValuesArr.length >= 2 &&
            key !== 'pvm_system_power_off_policy' &&
            key !== 'pvm_system_operating_mode' &&
            validateAttributeKeys(attributeKeys?.pvm_default_os_type, key)
          "
          :key="key"
          sm="8"
          xl="6"
        >
          <BFormGroup
            v-if="
              hmcManagedChecks(
                $t(`${'pageServerPowerOperations.biosSettings'}.${key}`),
              )
            "
            :key="key"
            :label="$t(`${'pageServerPowerOperations.biosSettings'}.${key}`)"
            class="mb-4 form-group"
          >
            <BFormSelect
              id="bios-option-sysOp-mode"
              v-model="attributeKeys[key]"
              aria-label="bios-option-sysOp-mode"
              :options="attriValuesArr"
              :disabled="disabled"
            >
            </BFormSelect>
          </BFormGroup>
        </BCol>
        <BCol
          v-else-if="
            validateAttributeKeys(attributeKeys?.pvm_default_os_type, key)
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
                    :id="values.value"
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
                          'pageServerPowerOperations.biosSettings.currentOperatingModeNormal',
                        )
                      }}
                    </p>
                    <p>
                      {{
                        $t(
                          'pageServerPowerOperations.biosSettings.selectedOperatingModeManual',
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <router-link to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </router-link>
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
                                    `pagePowerRestorePolicy.policies.LastState`,
                                  ),
                        },
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
                          'pageServerPowerOperations.biosSettings.currentOperatingModeManual',
                        )
                      }}
                    </p>
                    <p>
                      {{
                        $t(
                          'pageServerPowerOperations.biosSettings.selectedOperatingModeNormal',
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <router-link to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </router-link>
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
                                    `pagePowerRestorePolicy.policies.LastState`,
                                  ),
                        },
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
                          },
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <router-link to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </router-link>
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
                                    `pagePowerRestorePolicy.policies.LastState`,
                                  ),
                        },
                      )
                    }}
                  </div>
                </BCol>
              </BRow>
              <template v-for="(values, keys) of attriValuesArr">
                <template v-if="key === 'pvm_system_power_off_policy'">
                  <BFormRadio
                    :id="spaceFilter(values.value)"
                    :key="values.value"
                    v-model="attributeKeys[key]"
                    :value="values.value"
                    :aria-describedby="spaceFilter(values.value)"
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
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.powerOffHelperText',
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
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.automaticHelperText',
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
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.stayOnHelperText',
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
            attributeKeys?.pvm_default_os_type === 'IBM I' ||
            attributeKeys?.pvm_default_os_type === 'Default'
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
                `${'pageServerPowerOperations.biosSettings'}.${taggedSetting.settingKey}`,
              )
            "
            class="mb-4 form-group"
          >
            <BFormSelect
              id="bios-option-sysOp-mode"
              v-model="taggedSetting.settingValue"
              aria-label="bios-option-sysOp-mode"
              :options="taggedSettingsOptions"
              :disabled="!isAtleastPhypInStandby || disabled"
              @input="
                changeTaggedSettingsValue(
                  taggedSetting.settingKey,
                  taggedSetting.settingValue,
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
          attributeKeys?.['pvm_default_os_type'] === 'Linux KVM'
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
              `${'pageServerPowerOperations.biosSettings.pvm_linux_kvm_percentage'}`,
            )
          "
        >
          <BFormInput
            v-if="
              attributeKeys?.pvm_linux_kvm_memory === 'Automatic' &&
              linuxKvmPercentageCurrentValue === 0
            "
            model-value="--"
            disabled
          ></BFormInput>
          <BFormInput
            v-else-if="attributeKeys?.pvm_linux_kvm_memory === 'Automatic'"
            id="linux_kvm_percentage_current"
            :value="linuxKvmPercentageCurrentValue"
            type="number"
            disabled
            step="0.1"
            min="0.0"
            max="100.0"
          />
          <BFormInput
            v-else
            id="linux_kvm_percentage"
            v-model="localLinuxKvmPercentage"
            type="number"
            :disabled="
              attributeKeys?.pvm_linux_kvm_memory === 'Automatic' || disabled
            "
            step="0.1"
            min="0.0"
            max="100.0"
            @keypress="validateLinuxKvmPercentage"
            @update:model-value="changeLinuxKvmPercentageValue"
          />
          <span
            v-if="
              localLinuxKvmPercentage < 0.0 ||
              localLinuxKvmPercentage > 100.0 ||
              !isLinuxKvmValid
            "
            class="error-text"
          >
            {{
              $t(
                'pageServerPowerOperations.biosSettings.linuxKvmPercentage.errorMessage',
              )
            }}
          </span>
        </BFormGroup>
      </BCol>
    </BRow>
    <BButton
      variant="primary"
      type="submit"
      class="mb-3"
      :disabled="
        !isLinuxKvmValid
          ? attributeKeys?.pvm_default_os_type === 'Linux KVM'
            ? true
            : false
          : false
      "
    >
      {{ $t('global.action.save') }}
    </BButton>
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
                  'pageServerPowerOperations.biosSettings.pvm_ibmi_load_source',
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
                  'pageServerPowerOperations.biosSettings.pvm_ibmi_alt_load_source',
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
                  'pageServerPowerOperations.biosSettings.pvm_linux_kvm_memory',
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
                  'pageServerPowerOperations.biosSettings.pvm_linux_kvm_percentage',
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

<script setup lang="ts">
import { ref, computed, onBeforeMount, watch } from 'vue';
// @ts-ignore - i18n.js is a JavaScript module
import i18n from '@/i18n';
import Alert from '@/components/Global/Alert.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
// @ts-ignore - UtilitiesFunction is a JS module
import utilitiesFunctions from '../../../components/Global/UtilitiesFunction';
import type { BiosAttributes } from '@/api/composables/useServerPowerOperations';
import stores from '@/store';

const { spaceFilter } = utilitiesFunctions();

const globalStore = stores.GlobalStore();
const resourceMemoryStore = stores.ResourceMemoryStore();

// ─── Props & Emits ───────────────────────────────────────────────────────────

const props = defineProps<{
  attributeValues: Record<string, Array<{ value: string; text: string }>> | null;
  disabled: boolean;
  isInPhypStandby?: boolean;
  biosAttributes: BiosAttributes | null;
  ibmiLoadSourceValue: string;
  ibmiAltLoadSourceValue: string;
  ibmiConsoleValue: string;
  linuxKvmPercentageValue: number | null;
  linuxKvmPercentageInitialValue: number | null;
  linuxKvmPercentageCurrentValue: number | null;
  powerRestorePolicy: string;
  locationCodes: string[];
}>();

const emit = defineEmits<{
  (e: 'updated-attributes', keys: BiosAttributes): void;
  (e: 'is-linux-kvm-valid', valid: boolean): void;
  (e: 'pending-operating-mode-settings', payload: { powerRestorePolicy: string; automaticRetryConfig: string; bootFault: string } | null): void;
}>();

const isLinuxKvmValid = ref(true);
const manualMode = ref('Manual');
const normalMode = ref('Normal');
const currentOperatingMode = ref('');
const selectedOperatingMode = ref('');
const taggedSettingsArr = ref(['Current configuration', 'none']);
const localLinuxKvmPercentage = ref<number>(props.linuxKvmPercentageValue ?? 0);

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
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

const linuxKvmPercentageFields = ref([
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

const taggedSettingsFields = ref([
  {
    key: 'description',
    label: i18n.global.t('pagePower.tableRoles.description'),
    sortable: false,
    thAttr: { scope: 'col' },
    tdAttr: { scope: null },
  },
]);

const serverFirmwareItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.autoStartOnly',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.autoStartOnly',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.autoStartAlways',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.autoStartAlways',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.standBy',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.standBy',
    ),
  },
]);

const defaultPartitionItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.aix',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.aix',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.linux',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.linux',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.ibmI',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.ibmI',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.linuxKVM',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.linuxKVM',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.default',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.default',
    ),
  },
]);

const aixPartitionItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.partitionBoot',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.partitionBoot',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.serviceBoot',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.serviceBoot',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.bootToSms',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.bootToSms',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.bootToOpenFirware',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.bootToOpenFirware',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.serviceBootMode',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.aixPartitionItems.description.serviceBootMode',
    ),
  },
]);

const ibmiItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.a',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.a',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.b',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.b',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.c',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.c',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.setting.d',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiItems.description.d',
    ),
  },
]);

const linuxKvmItems = ref([
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.setting.automatic',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.description.automatic',
    ),
  },
  {
    setting: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.setting.custom',
    ),
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmItems.description.custom',
    ),
  },
]);

const linuxKvmPercentageItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.linuxKvmPercentage.description',
    ),
  },
]);

const ibmiLoadSourceItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiLoadSource.description',
    ),
  },
]);

const ibmiAltLoadSourceItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiAltLoadSource.description',
    ),
  },
]);

const ibmiConsoleItems = ref([
  {
    description: i18n.global.t(
      'pageServerPowerOperations.biosSettings.ibmiConsole.description',
    ),
  },
]);

const attributeKeys = ref<BiosAttributes>({ ...props.biosAttributes });

watch(() => props.biosAttributes, (newVal) => {
  if (newVal) Object.assign(attributeKeys.value, newVal);
});

onBeforeMount(() => {
  if (props.biosAttributes) {
    Object.assign(attributeKeys.value, props.biosAttributes);
    currentOperatingMode.value =
      attributeKeys.value['pvm_system_operating_mode'] ?? '';
    if (currentOperatingMode.value === manualMode.value) {
      onChangeSystemOpsMode(manualMode.value);
    }
  }
  taggedSettings.value[0].settingValue = props.ibmiLoadSourceValue;
  taggedSettings.value[1].settingValue = props.ibmiAltLoadSourceValue;
  taggedSettings.value[2].settingValue = props.ibmiConsoleValue;
});

const manualModeSelected = computed(() => {
  return selectedOperatingMode.value == manualMode.value;
});

const taggedSettingValues = computed(() => {
  let taggedSettingsInfo = taggedSettings.value;
  taggedSettingsInfo[0].settingValue = props.ibmiLoadSourceValue;
  taggedSettingsInfo[1].settingValue = props.ibmiAltLoadSourceValue;
  taggedSettingsInfo[2].settingValue = props.ibmiConsoleValue;
  return taggedSettingsInfo;
});

const taggedSettingsOptions = computed(() => {
  let taggedSettingsList = [...taggedSettingsArr.value];
  return [...taggedSettingsList, ...(props.locationCodes ?? [])];
});

function hmcManagedChecks(value: string): boolean {
  if (!isHmcManaged()) return true;
  if (
    value ===
    i18n.global.t('pageServerPowerOperations.biosSettings.pvm_stop_at_standby')
  )
    return true;
  return false;
}

const hmcManaged = computed(() => {
  return resourceMemoryStore.hmcManagedGetter;
});

const isAtleastPhypInStandby = computed(() => {
  return globalStore.isInPhypStandby;
});

function isHmcManaged(): boolean {
  return hmcManaged.value === 'Enabled' ? true : false;
}

function onChangeSystemOpsMode(value: string): void {
  selectedOperatingMode.value = value;
  if (selectedOperatingMode.value === normalMode.value) {
    if (currentOperatingMode.value !== selectedOperatingMode.value) {
      emit('pending-operating-mode-settings', {
        powerRestorePolicy: 'LastState',
        automaticRetryConfig: 'RetryAttempts',
        bootFault: 'Never',
      });
    } else {
      emit('pending-operating-mode-settings', null);
    }
  } else if (selectedOperatingMode.value === manualMode.value) {
    emit('pending-operating-mode-settings', {
      powerRestorePolicy: 'AlwaysOff',
      automaticRetryConfig: 'Disabled',
      bootFault: 'Never',
    });
  }
}

function changeLinuxKvmPercentageValue(value: string | number): void {
  let valueAsString = value.toString();
  let regex = /^\d+(\.\d?)?$/;
  if (regex.test(valueAsString)) {
    isLinuxKvmValid.value = true;
  } else {
    isLinuxKvmValid.value = false;
  }
  localLinuxKvmPercentage.value = Number(value);
}

function changeTaggedSettingsValue(key: string, value: string): void {
  const idx = taggedSettings.value.findIndex((s) => s.settingKey === key);
  if (idx !== -1) taggedSettings.value[idx].settingValue = value;
}

function validateLinuxKvmPercentage($event: KeyboardEvent): void {
  let keyCode = ($event as any).keyCode ? ($event as any).keyCode : ($event as any).which;
  let percentageValue = ($event.target as HTMLInputElement).value + $event.key;
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

function validateAttributeKeys(
  defaultPartitionEnvironment: string | undefined,
  key: string,
): boolean {
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
    localLinuxKvmPercentage.value,
  ],
  () => {
    if (attributeKeys.value['pvm_linux_kvm_memory'] === 'Custom') {
      attributeKeys.value['pvm_linux_kvm_percentage'] =
        localLinuxKvmPercentage.value * 10;
    } else {
      attributeKeys.value['pvm_linux_kvm_percentage'] =
        (props.linuxKvmPercentageInitialValue ?? 0) * 10;
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
  { deep: true },
);
</script>

<style lang="scss" scoped>
:deep(caption) {
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  color: #212529a8 !important;
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
