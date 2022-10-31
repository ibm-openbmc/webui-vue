<template>
  <b-row>
    <b-col>
      <page-section
        :section-title="$t('pageCapacityOnDemand.activation.sectionTitle')"
      >
        <b-row>
          <b-col xl="5" md="6" lg="6" sm="7">
            <alert variant="info" class="mb-4">
              <span>
                {{ $t('pageCapacityOnDemand.activation.alert') }}
              </span>
            </alert>
          </b-col>
        </b-row>
        <div>
          {{ $t('pageCapacityOnDemand.activation.helperTextIps') }}
        </div>
        <b-row>
          <b-col sm="12" md="9" lg="9" xl="8">
            <b-form
              class="d-flex align-items-center mt-3"
              @submit.prevent="submitForm"
            >
              <b-form-group
                :label="$t('pageCapacityOnDemand.activation.srLabel')"
                label-for="input-license-key"
                :label-sr-only="true"
                class="mb-0 mr-0 form-group-activation"
              >
                <b-input-group class="input-group-activation">
                  <b-form-input
                    id="input-license-key"
                    v-model="licenseKey"
                    class="input-form"
                    :maxlength="maxLength"
                    :disabled="isActivationDisabled"
                    :state="getValidationState($v.licenseKey)"
                    :placeholder="
                      $t('pageCapacityOnDemand.activation.placeholder')
                    "
                    @input="$v.licenseKey.$touch()"
                  />
                  <b-form-invalid-feedback role="alert">
                    {{ $t('global.form.invalidCharacterLength') }}
                  </b-form-invalid-feedback>
                </b-input-group>
              </b-form-group>
              <b-col align-self="baseline">
                <b-button
                  variant="primary"
                  type="submit"
                  :disabled="isActivationDisabled"
                >
                  {{ $t('global.action.activate') }}
                </b-button>
              </b-col>
            </b-form>
          </b-col>
        </b-row>
      </page-section>
    </b-col>
  </b-row>
</template>

<script>
import { maxLength, minLength, required } from 'vuelidate/lib/validators';
import Alert from '@/components/Global/Alert';
import PageSection from '@/components/Global/PageSection';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';

export default {
  name: 'CapacityOnDemandAcvitation',
  components: { Alert, PageSection },
  mixins: [VuelidateMixin, BVToastMixin, LoadingBarMixin],
  data() {
    return {
      licenseKey: '',
      maxLength: 34,
    };
  },
  validations() {
    return {
      licenseKey: {
        required,
        minLength: minLength(this.maxLength),
        maxLength: maxLength(this.maxLength),
      },
    };
  },
  computed: {
    isInPhypStandby() {
      return this.$store.getters['global/isInPhypStandby'];
    },
    isActivationDisabled() {
      if (
        this.$store.getters['licenses/licenses']?.UAK?.Status?.State ===
          'Enabled' &&
        this.isInPhypStandby
      ) {
        return false;
      } else {
        return true;
      }
    },
  },
  created() {
    Promise.all([
      this.$store.dispatch('global/getSystemInfo'),
      this.$store.dispatch('global/getBootProgress'),
      this.$store.dispatch('licenses/getLicenses'),
    ]);
  },
  methods: {
    submitForm() {
      this.$v.$touch();
      if (!this.$v.$invalid) {
        this.startLoader();
        this.$store
          .dispatch('licenses/activateLicense', this.licenseKey)
          .then((success) => this.successToast(success))
          .catch(({ message }) => this.errorToast(message))
          .finally(() => this.endLoader());
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.input-group-activation {
  // this is needed to maintain button aligment
  // when there is an error message
  height: 3.75rem;
}
.form-group-activation {
  width: 100%;
}
.input-form {
  height: 41px;
}
</style>
