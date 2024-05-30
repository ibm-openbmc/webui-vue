<template>
  <div>
    <page-section>
      <b-row>
        <b-col sm="8" md="6" xl="12">
          <dl>
            <dt>
              {{ $t('pagePower.powerConsumption') }}
              <info-tooltip :title="$t('pagePower.powerConsumptionTooltip')" />
            </dt>
            <dd>
              {{ powerConsumption ? `${powerConsumption} W` : $t('global.status.notAvailable') }}
            </dd>
          </dl>
        </b-col>
      </b-row>

      <b-form @submit.prevent="submitForm">
        <b-form-group :disabled="loading || safeMode || powerCapMin === 0">
          <b-row>
            <b-col sm="8" md="6" xl="12">
              <b-form-group :label="$t('pagePower.powerCapSettingLabel')">
                <b-form-checkbox
                  v-model="isPowerCapEnabled"
                  data-test-id="power-checkbox-togglePowerCapField"
                  name="power-control-mode"
                >
                  {{ $t('pagePower.powerCapSettingData') }}
                </b-form-checkbox>
              </b-form-group>
            </b-col>
          </b-row>

          <b-row>
            <b-col sm="8" md="6" xl="3">
              <b-form-group
                id="input-group-1"
                :label="$t('pagePower.powerCapLabel')"
                label-for="input-1"
              >
                <b-form-text id="power-help-text">
                  {{
                    $t('pagePower.powerCapLabelTextInfo', {
                      min: dataFormatter(powerCapMin),
                      max: dataFormatter(powerCapMax),
                    })
                  }}
                </b-form-text>

                <b-form-input
                  id="input-1"
                  v-model="powerCap"
                  data-test-id="power-input-powerCap"
                  type="number"
                  aria-describedby="power-help-text"
                  :number="true"
                  :state="getValidationState($v.powerCap)"
                  @blur="$v.powerCap.$touch()"
                ></b-form-input>

                <b-form-invalid-feedback id="input-live-feedback" role="alert">
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: powerCapMin,
                      max: powerCapMax,
                    })
                  }}
                </b-form-invalid-feedback>
              </b-form-group>
            </b-col>
          </b-row>

          <b-button variant="primary" type="submit" data-test-id="power-button-savePowerCapValue">
            {{ $t('global.action.save') }}
          </b-button>
        </b-form-group>
      </b-form>
    </page-section>
  </div>
</template>

<script>
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import InfoTooltip from '@/components/Global/InfoTooltip';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import { required, between, numeric } from 'vuelidate/lib/validators';
import PageSection from '../../../components/Global/PageSection.vue';

export default {
  components: { InfoTooltip, PageSection },
  mixins: [BVToastMixin, DataFormatterMixin, LoadingBarMixin, VuelidateMixin],
  props: {
    safeMode: {
      type: Boolean,
      default: null,
    },
  },
  data() {
    return {
      loading,
    };
  },
  computed: {
    powerConsumption() {
      return this.$store.getters['powerControl/powerConsumption'];
    },
    powerControlMode() {
      return this.$store.getters['powerControl/powerControlMode'];
    },
    isPowerCapEnabled: {
      get() {
        return this.$store.getters['powerControl/isPowerCapEnabled'];
      },
      set(value) {
        const newValue = value === true ? 'Automatic' : 'Disabled';
        this.$store.commit('powerControl/setPowerControlMode', newValue);
      },
    },
    powerCap: {
      get() {
        return this.$store.getters['powerControl/powerCap'];
      },
      set(value) {
        return this.$store.commit('powerControl/setPowerCap', value);
      },
    },
    powerCapMin() {
      return this.$store.getters['powerControl/powerCapMin'];
    },
    powerCapMax() {
      return this.$store.getters['powerControl/powerCapMax'];
    },
  },
  created() {
    this.startLoader();
    this.$store.dispatch('powerControl/getPowerControl').finally(() => this.endLoader());
  },
  validations() {
    return {
      powerCap: {
        required,
        numeric,
        between: between(this.powerCapMin, this.powerCapMax),
      },
    };
  },
  methods: {
    submitForm() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.startLoader();
      this.$store
        .dispatch('powerControl/setPowerControlAndCap', {
          powerControlMode: this.powerControlMode,
          powerCap: this.powerCap,
        })
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => this.endLoader());
    },
  },
};
</script>
