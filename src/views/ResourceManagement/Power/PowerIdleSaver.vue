<template>
  <div>
    <page-section :section-title="$t('pagePower.idlePower')">
      <b-row>
        <b-col sm="8" md="6" xl="12">
          <b-form-group>
            <b-form-checkbox
              v-model="idlePowerSaver.isIdlePowerSaverEnabled"
              :disabled="loading || safeMode"
              data-test-id="power-checkbox-toggleIdlePower"
              name="idle-power-saver"
            >
              {{ $t('pagePower.enableIdlePower') }}
            </b-form-checkbox>
          </b-form-group>
        </b-col>
      </b-row>

      <b-form
        id="idle-power-saver"
        novalidate
        @submit.prevent="saveIdlePowerSaverData"
        @reset.prevent="resetIdlePowerSaverData"
      >
        <b-form-group :disabled="loading || safeMode">
          <div class="font-weight-bold mb-2">{{ $t('pagePower.toEnter') }}</div>
          <b-row>
            <b-col sm="8" md="6" xl="4">
              <b-form-group
                id="input-group-1"
                :label="$t('pagePower.delayTime')"
                label-for="input-1"
              >
                <b-form-input
                  id="input-1"
                  v-model.number="idlePowerSaver.enterDwellTimeSeconds"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-enterDwellTimeSeconds"
                  type="number"
                  :state="getValidationState($v.idlePowerSaver.enterDwellTimeSeconds)"
                ></b-form-input>

                <b-form-invalid-feedback role="alert">
                  {{
                    $t('pagePower.delayTimeValidation.delayTimeRange', {
                      min: delayTimeMin,
                      max: delayTimeMax,
                    })
                  }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col sm="8" md="6" xl="4">
              <b-form-group
                id="input-group-2"
                :label="$t('pagePower.utilizationThreshold')"
                label-for="input-2"
              >
                <b-form-input
                  id="input-2"
                  v-model.number="idlePowerSaver.enterUtilizationPercent"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-enterUtilizationPercent"
                  type="number"
                  :state="getValidationState($v.idlePowerSaver.enterUtilizationPercent)"
                ></b-form-input>

                <b-form-invalid-feedback role="alert">
                  {{
                    !$v.idlePowerSaver.enterUtilizationPercent.between
                      ? $t('pagePower.utilizationPercentValidation.utilizationRange', {
                          min: utilizationThresholdMin,
                          max: utilizationThresholdMax,
                        })
                      : $t('pagePower.utilizationPercentValidation.enterUtilization')
                  }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>
          <div class="font-weight-bold mb-2">{{ $t('pagePower.toExit') }}</div>
          <b-row>
            <b-col sm="8" md="6" xl="4">
              <b-form-group
                id="input-group-3"
                :label="$t('pagePower.delayTime')"
                label-for="input-3"
              >
                <b-form-input
                  id="input-3"
                  v-model.number="idlePowerSaver.exitDwellTimeSeconds"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-exitDwellTimeSeconds"
                  type="number"
                  :state="getValidationState($v.idlePowerSaver.exitDwellTimeSeconds)"
                ></b-form-input>

                <b-form-invalid-feedback role="alert">
                  {{
                    $t('pagePower.delayTimeValidation.delayTimeRange', {
                      min: delayTimeMin,
                      max: delayTimeMax,
                    })
                  }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
            <b-col sm="8" md="6" xl="4">
              <b-form-group
                id="input-group-4"
                :label="$t('pagePower.utilizationThreshold')"
                label-for="input-4"
              >
                <b-form-input
                  id="input-4"
                  v-model.number="idlePowerSaver.exitUtilizationPercent"
                  :disabled="!idlePowerSaver.isIdlePowerSaverEnabled"
                  data-test-id="power-input-exitUtilizationPercent"
                  type="number"
                  :state="getValidationState($v.idlePowerSaver.exitUtilizationPercent)"
                ></b-form-input>

                <b-form-invalid-feedback role="alert">
                  {{
                    !$v.idlePowerSaver.exitUtilizationPercent.between
                      ? $t('pagePower.utilizationPercentValidation.utilizationRange', {
                          min: utilizationThresholdMin,
                          max: utilizationThresholdMax,
                        })
                      : $t('pagePower.utilizationPercentValidation.exitUtilization')
                  }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>
          <b-row>
            <b-col>
              <b-button variant="primary" type="submit" form="idle-power-saver">
                {{ $t('pagePower.idlePowerSubmitUpdate') }}
              </b-button>
              <b-button variant="secondary" type="reset" form="idle-power-saver" class="ml-3">
                {{ $t('pagePower.idlePowerSubmitReset') }}
              </b-button>
            </b-col>
          </b-row>
        </b-form-group>
      </b-form>
    </page-section>
  </div>
</template>

<script>
import PageSection from '@/components/Global/PageSection';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import { between, maxValue, minValue } from 'vuelidate/lib/validators';

export default {
  name: 'Power',
  components: {
    PageSection,
  },
  mixins: [VuelidateMixin, BVToastMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  props: {
    safeMode: {
      type: Boolean,
      default: null,
    },
  },
  data() {
    return {
      loading,
      delayTimeMin: 10, // TODO update once redfish provides min/max
      delayTimeMax: 600,
      utilizationThresholdMin: 1,
      utilizationThresholdMax: 95,
      idlePowerSaver: {
        isIdlePowerSaverEnabled: null,
        enterDwellTimeSeconds: null,
        exitDwellTimeSeconds: null,
        enterUtilizationPercent: null,
        exitUtilizationPercent: null,
      },
    };
  },
  computed: {
    idlePowerSaverData() {
      return this.$store.getters['powerControl/idlePowerSaverData'];
    },
  },
  created() {
    this.startLoader();
    this.$store.dispatch('powerControl/getIdlePowerSaverData').finally(() => {
      this.setIdlePowerSaveFormValues(this.idlePowerSaverData);
      this.endLoader();
    });
  },
  validations() {
    return {
      idlePowerSaver: {
        enterDwellTimeSeconds: {
          between: between(this.delayTimeMin, this.delayTimeMax),
        },
        exitDwellTimeSeconds: {
          between: between(this.delayTimeMin, this.delayTimeMax),
        },
        enterUtilizationPercent: {
          between: between(this.utilizationThresholdMin, this.utilizationThresholdMax),
          maxValue: maxValue(this.idlePowerSaver.exitUtilizationPercent),
        },
        exitUtilizationPercent: {
          between: between(this.utilizationThresholdMin, this.utilizationThresholdMax),
          minValue: minValue(this.idlePowerSaver.enterUtilizationPercent),
        },
      },
    };
  },
  methods: {
    setIdlePowerSaveFormValues(data) {
      this.idlePowerSaver.isIdlePowerSaverEnabled = data?.Enabled;
      this.idlePowerSaver.enterDwellTimeSeconds = data?.EnterDwellTimeSeconds;
      this.idlePowerSaver.exitDwellTimeSeconds = data?.ExitDwellTimeSeconds;
      this.idlePowerSaver.enterUtilizationPercent = data?.EnterUtilizationPercent;
      this.idlePowerSaver.exitUtilizationPercent = data?.ExitUtilizationPercent;
    },
    saveIdlePowerSaverData() {
      this.$v.idlePowerSaver.$touch();
      if (this.$v.idlePowerSaver.$invalid) return;
      this.startLoader();
      this.$store
        .dispatch('powerControl/setIdlePowerSaverData', this.idlePowerSaver)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
    resetIdlePowerSaverData() {
      this.$v.idlePowerSaver.$touch();
      if (this.$v.idlePowerSaver.$invalid) return;
      this.startLoader();
      return this.$store
        .dispatch('powerControl/resetIdlePowerSaver', this.idlePowerSaver)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => {
          this.$store.dispatch('powerControl/getIdlePowerSaverData').then(() => {
            this.setIdlePowerSaveFormValues(this.idlePowerSaverData);
          });
          this.endLoader();
        });
    },
  },
};
</script>
