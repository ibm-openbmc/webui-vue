<template>
  <div>
    <b-row>
      <template v-for="(attriValuesArr, key) of attributeValues">
        <b-col
          v-if="
            attriValuesArr.length > 2 &&
            key !== 'pvm_system_power_off_policy' &&
            validateAttributeKeys(attributeKeys.pvm_default_os_type, key)
          "
          :key="key"
          sm="8"
          xl="6"
        >
          <b-form-group
            v-if="
              hmcManagedChecks(
                $t(`${'pageServerPowerOperations.biosSettings'}.${key}`)
              )
            "
            :key="key"
            :label="$t(`${'pageServerPowerOperations.biosSettings'}.${key}`)"
            class="mb-4"
          >
            <b-form-select
              id="bios-option-sysOp-mode"
              v-model="attributeKeys[key]"
              :options="attriValuesArr"
            >
            </b-form-select>
          </b-form-group>
        </b-col>
        <b-col
          v-else-if="
            validateAttributeKeys(attributeKeys.pvm_default_os_type, key)
          "
          :key="key"
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
            <b-form-group
              :key="key"
              :label="$t(`${'pageServerPowerOperations.biosSettings'}.${key}`)"
              class="m-0"
            >
              <b-row v-if="key === 'pvm_system_operating_mode'">
                <b-col sm="5">
                  <b-form-radio
                    v-for="values of attriValuesArr"
                    :key="values.value"
                    v-model="attributeKeys[key]"
                    :value="values.value"
                    :aria-describedby="values.value"
                    @change="onChangeSystemOpsMode"
                  >
                    {{ values.text }}
                  </b-form-radio>
                </b-col>
                <div
                  v-if="
                    manualModeSelected || currentOperatingMode !== normalMode
                  "
                  class="mr-4 section-left-divider"
                ></div>
                <b-col
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
                    <b-link to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </b-link>
                    {{
                      $t(
                        `pageServerPowerOperations.biosSettings.powPolicySection`,
                        {
                          powerPolicy:
                            powerPolicy === 'AlwaysOff'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOff`)
                              : powerPolicy === 'AlwaysOn'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOn`)
                              : $t(`pagePowerRestorePolicy.policies.LastState`),
                        }
                      )
                    }}
                  </div>
                </b-col>
                <b-col
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
                    <b-link to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </b-link>
                    {{
                      $t(
                        `pageServerPowerOperations.biosSettings.powPolicySection`,
                        {
                          powerPolicy:
                            powerPolicy === 'AlwaysOff'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOff`)
                              : powerPolicy === 'AlwaysOn'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOn`)
                              : $t(`pagePowerRestorePolicy.policies.LastState`),
                        }
                      )
                    }}
                  </div>
                </b-col>
                <b-col v-else-if="currentOperatingMode === manualMode" sm="5">
                  <alert variant="warning" class="mb-4">
                    <p>
                      {{
                        $t(
                          `pageServerPowerOperations.biosSettings.currentOperatingModeManual`,
                          { currOptMode: currentOperatingMode }
                        )
                      }}
                    </p>
                  </alert>
                  <div>
                    <b-link to="/settings/power-restore-policy">
                      {{ $t(`appPageTitle.powerRestorePolicy`) }}
                    </b-link>
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.powPolicySection',
                        {
                          powerPolicy:
                            powerPolicy === 'AlwaysOff'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOff`)
                              : powerPolicy === 'AlwaysOn'
                              ? $t(`pagePowerRestorePolicy.policies.AlwaysOn`)
                              : $t(`pagePowerRestorePolicy.policies.LastState`),
                        }
                      )
                    }}
                  </div>
                </b-col>
              </b-row>
              <template v-for="(values, keys) of attriValuesArr">
                <template v-if="key === 'pvm_system_power_off_policy'">
                  <b-form-radio
                    :key="values.value"
                    v-model="attributeKeys[key]"
                    :value="values.value"
                    :aria-describedby="values.value"
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
                  </b-form-radio>
                  <b-form-text
                    v-if="values.value === 'Power Off'"
                    :id="values.value"
                    :key="keys"
                    class="ml-4"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.powerOffHelperText'
                      )
                    }}
                  </b-form-text>
                  <b-form-text
                    v-if="values.value === 'Automatic'"
                    :id="values.value"
                    :key="keys"
                    class="ml-4"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.automaticHelperText'
                      )
                    }}
                  </b-form-text>
                  <b-form-text
                    v-if="values.value === 'Stay On'"
                    :id="values.value"
                    :key="keys"
                    class="ml-4"
                  >
                    {{
                      $t(
                        'pageServerPowerOperations.biosSettings.attributeValues.pvm_system_power_off_policy.stayOnHelperText'
                      )
                    }}
                  </b-form-text>
                </template>
              </template>
            </b-form-group>
          </div>
        </b-col>
      </template>
    </b-row>
    <b-row class="mb-3">
      <b-col xl="10">
        <b-button v-b-toggle.collapse-role-table variant="link">
          <icon-chevron />
          {{
            $t('pageServerPowerOperations.biosSettings.powerSettingDescription')
          }}
        </b-button>
        <b-collapse id="collapse-role-table" class="mt-3">
          <b-table
            stacked="sm"
            hover
            :items="serverFirmwareItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{ $t('pageServerPowerOperations.biosSettings.serverFirmware') }}
            </template>
          </b-table>
          <b-table
            stacked="sm"
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
          </b-table>
          <b-table
            stacked="sm"
            hover
            :items="aixPartitionItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{ $t('pageServerPowerOperations.biosSettings.aixLinux') }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </b-table>
          <b-table
            stacked="sm"
            hover
            :items="ibmiItems"
            :fields="fields"
            caption-top
          >
            <template #table-caption>
              {{ $t('pageServerPowerOperations.biosSettings.ibmIPartition') }}
              ({{ $t('pageServerPowerOperations.biosSettings.nonHMCManaged') }})
            </template>
          </b-table>
        </b-collapse>
      </b-col>
    </b-row>
  </div>
</template>
<script>
import Alert from '@/components/Global/Alert';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
export default {
  name: 'BiosSettings',
  components: { Alert, IconChevron },
  props: {
    attributeValues: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      manualMode: 'Manual',
      normalMode: 'Normal',
      currentOperatingMode: '',
      selectedOperatingMode: '',
      powerRestorePolicy: this.$store.getters[
        'serverBootSettings/powerRestorePolicyValue'
      ],
      fields: [
        {
          key: 'setting',
          label: this.$t('pagePower.tableRoles.setting'),
          sortable: false,
        },
        {
          key: 'description',
          label: this.$t('pagePower.tableRoles.description'),
          sortable: false,
        },
      ],
      serverFirmwareItems: [
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.autoStartOnly'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.autoStartOnly'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.autoStartAlways'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.autoStartAlways'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.serverFirmwareItems.setting.standBy'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.serverFirmwareItems.description.standBy'
          ),
        },
      ],
      defaultPartitionItems: [
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.aix'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.aix'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.linux'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.linux'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.ibmI'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.ibmI'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.setting.default'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.defaultPartitionItems.description.default'
          ),
        },
      ],
      aixPartitionItems: [
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.partitionBoot'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.description.partitionBoot'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.serviceBoot'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.description.serviceBoot'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.bootToSms'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.description.bootToSms'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.bootToOpenFirware'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.description.bootToOpenFirware'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.setting.serviceBootMode'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.aixPartitionItems.description.serviceBootMode'
          ),
        },
      ],
      ibmiItems: [
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.setting.a'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.description.a'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.setting.b'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.description.b'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.setting.c'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.description.c'
          ),
        },
        {
          setting: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.setting.d'
          ),
          description: this.$t(
            'pageServerPowerOperations.biosSettings.ibmiItems.description.d'
          ),
        },
      ],
    };
  },
  computed: {
    hmcManaged() {
      return this.$store.getters['resourceMemory/hmcManaged'];
    },
    attributeKeys() {
      return this.$store.getters['serverBootSettings/biosAttributes'];
    },
    manualModeSelected() {
      return this.selectedOperatingMode === this.manualMode;
    },
    powerPolicy() {
      return this.$store.getters['serverBootSettings/powerRestorePolicyValue'];
    },
  },
  created() {
    this.$store.dispatch('resourceMemory/getHmcManaged');
    this.currentOperatingMode = this.attributeKeys['pvm_system_operating_mode'];
    if (this.currentOperatingMode === this.manualMode) {
      this.onChangeSystemOpsMode(this.manualMode);
    }
  },
  updated() {
    this.$emit('updated-attributes', this.attributeKeys);
  },
  methods: {
    hmcManagedChecks(value) {
      if (!this.isHmcManaged()) return true;
      if (
        value ===
        this.$t('pageServerPowerOperations.biosSettings.pvm_stop_at_standby')
      )
        return true;
      return false;
    },
    isHmcManaged() {
      return this.hmcManaged === 'Enabled' ? true : false;
    },
    onChangeSystemOpsMode(value) {
      this.selectedOperatingMode = value;
      if (this.selectedOperatingMode === this.normalMode) {
        if (this.currentOperatingMode === this.selectedOperatingMode) {
          this.$store.dispatch('serverBootSettings/getOperatingModeSettings');
        } else {
          this.$store.commit(
            'serverBootSettings/setAutomaticRetryConfigValue',
            'RetryAttempts'
          );
          this.$store.commit(
            'serverBootSettings/setStopBootOnFaultValue',
            'Never'
          );
          this.$store.commit(
            'serverBootSettings/setPowerRestorePolicyValue',
            'LastState'
          );
        }
      } else if (this.selectedOperatingMode === this.manualMode) {
        this.$store.commit(
          'serverBootSettings/setAutomaticRetryConfigValue',
          'Disabled'
        );
        this.$store.commit(
          'serverBootSettings/setStopBootOnFaultValue',
          'Never'
        );
        this.$store.commit(
          'serverBootSettings/setPowerRestorePolicyValue',
          'AlwaysOff'
        );
      }
    },
    validateAttributeKeys(defaultPartitionEnvironment, key) {
      if (key === 'pvm_rpa_boot_mode') {
        return (
          defaultPartitionEnvironment === 'Default' ||
          defaultPartitionEnvironment === 'AIX' ||
          defaultPartitionEnvironment === 'Linux'
        );
      } else if (key === 'pvm_os_boot_type') {
        return !(
          defaultPartitionEnvironment === 'AIX' ||
          defaultPartitionEnvironment === 'Linux'
        );
      } else {
        return true;
      }
    },
  },
};
</script>
