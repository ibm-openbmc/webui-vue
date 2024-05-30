<template>
  <div>
    <b-row>
      <b-col class="d-flex align-items-center justify-content-between">
        <dl class="mt-3 mb-3 mr-3 w-75">
          <dt id="frequency-cap-label">
            {{ $t('pageSystemParameters.frequencyCap') }}
            <info-tooltip
              :title="
                $t('pageSystemParameters.parametersInfo') +
                ' ' +
                $t('pageSystemParameters.frequencyCapHelpText')
              "
            />
          </dt>
          <dd id="frequency-cap-description">
            {{ $t('pageSystemParameters.frequencyCapDescription') }}
          </dd>
        </dl>
        <b-form-checkbox
          id="frequency-cap-switch"
          v-model="frequencyRequestCurrentToggle"
          aria-labelledby="frequency-cap-label"
          aria-describedby="frequency-cap-description"
          :disabled="frequencyMax === 0 && frequencyMin === 0"
          switch
          @change="changeFrequencyRequestCurrent"
        >
          <span v-if="frequencyRequestCurrentToggle">
            {{ $t('global.status.enabled') }}
          </span>
          <span v-else>{{ $t('global.status.disabled') }}</span>
        </b-form-checkbox>
      </b-col>
    </b-row>
    <!-- Form -->
    <b-row class="section-divider">
      <b-col class="d-flex align-items-center justify-content-start col-6 mb-1">
        <b-form class="form-width" @submit.prevent>
          <b-form-group id="input-group-1" label-for="input-1" class="mb-0 mr-0">
            <b-form-text v-show="frequencyRequestCurrentToggle" id="frequency-cap-help-text">
              {{
                $t('pagePower.powerCapLabelTextInfo', {
                  min: dataFormatter(frequencyMin),
                  max: dataFormatter(frequencyMax),
                })
              }}
            </b-form-text>

            <b-input-group>
              <b-form-input
                id="input-1"
                v-model="frequencyValue"
                type="number"
                aria-describedby="frequency-cap-help-text"
                :disabled="!frequencyRequestCurrentToggle"
                :number="true"
                :state="getValidationState($v.frequencyValue)"
                @click="$v.frequencyValue.$touch()"
                @input="frequencyRequest"
              />
              <b-form-invalid-feedback v-if="frequencyRequestCurrentToggle" role="alert">
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: frequencyMin,
                    max: frequencyMax,
                  })
                }}
              </b-form-invalid-feedback>
            </b-input-group>
            <b-button
              variant="primary"
              type="submit"
              :disabled="!frequencyRequestCurrentToggle"
              class="mt-3 mb-3"
              @click="saveFrequencyRequest"
            >
              {{ $t('global.action.save') }}
            </b-button>
          </b-form-group>
        </b-form>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import InfoTooltip from '@/components/Global/InfoTooltip';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import { requiredIf, between, numeric } from 'vuelidate/lib/validators';

export default {
  name: 'FrequencyCap',
  components: { InfoTooltip },
  mixins: [DataFormatterMixin, LoadingBarMixin, BVToastMixin, VuelidateMixin],
  props: {
    safeMode: {
      type: Boolean,
      default: null,
    },
  },
  data() {
    return {
      isDisabled: true,
      frequencyValue: 0,
    };
  },
  computed: {
    frequencyMax() {
      return this.$store.getters['systemParameters/frequencyMax'];
    },
    frequencyMin() {
      return this.$store.getters['systemParameters/frequencyMin'];
    },
    frequencyRequestCurrent() {
      return this.$store.getters['systemParameters/frequencyRequestCurrent'];
    },
    frequencyControl: {
      get() {
        return this.frequencyRequestCurrent > 0;
      },
      set(newValue) {
        this.changeFrequencyControl();
        return newValue;
      },
    },
    frequencyRequestCurrentToggle: {
      get() {
        return this.$store.getters['systemParameters/frequencyRequestCurrentToggle'];
      },
      set(newValue) {
        return newValue;
      },
    },
  },
  validations() {
    return {
      frequencyValue: {
        requiredIf: requiredIf(this.frequencyRequestCurrentToggle),
        numeric,
        between: between(this.frequencyMin, this.frequencyMax),
      },
    };
  },
  created() {
    this.startLoader();
    this.$store.dispatch('systemParameters/getFrequencyCap').then(() => {
      this.frequencyValue = this.$store.getters['systemParameters/frequencyRequest'];
      this.endLoader();
    });
  },
  methods: {
    changeFrequencyRequestCurrent(state) {
      if (state) {
        this.frequencyValue = this.frequencyMax;
        this.$store
          .dispatch('systemParameters/saveFrequencyCap', {
            frequency: this.frequencyMax,
            state: state,
          })
          .then((message) => this.successToast(message))
          .catch(({ message }) => this.errorToast(message));
      } else {
        this.frequencyValue = 0;
        this.$store
          .dispatch('systemParameters/saveFrequencyCap', {
            frequency: 0,
            state: state,
          })
          .then((message) => this.successToast(message))
          .catch(({ message }) => this.errorToast(message));
      }
    },
    saveFrequencyRequest() {
      if (this.$v.$invalid) return;
      this.$store
        .dispatch('systemParameters/newFrequencyCapRequest', this.frequencyValue)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
    frequencyRequest(value) {
      this.frequencyValue = Number(value);
    },
  },
};
</script>

<style lang="scss" scoped>
.form-width {
  width: 100%;
}
</style>
