<template>
  <b-row>
    <b-col xl="4">
      <page-section :section-title="$t('pageFieldCoreOverride.changeConfiguration')">
        <b-form @submit.prevent="submitForm">
          <b-form-checkbox id="checkbox-1" v-model="inputEnableFieldCoreOverride" class="mb-3">
            {{ $t('pageFieldCoreOverride.enableFieldCoreOverride') }}
          </b-form-checkbox>
          <b-form-group
            :label="$t('pageFieldCoreOverride.configuredCores')"
            label-for="input-configured-cores"
          >
            <b-form-text>
              {{ $t('global.form.mustBeAtLeast', { value: minValue }) }}
            </b-form-text>
            <b-input-group>
              <b-form-input
                id="input-configured-cores"
                v-model.number="inputConfiguredCores"
                type="number"
                min="1"
                :max="maxConfiguredCores"
                :disabled="!inputEnableFieldCoreOverride"
                :placeholder="$t('pageFieldCoreOverride.enterValue')"
                :state="getValidationState($v.inputConfiguredCores)"
                @blur="$v.inputConfiguredCores.$touch()"
              />
              <b-form-invalid-feedback role="alert">
                <template v-if="!$v.inputConfiguredCores.required">
                  {{ $t('global.form.fieldRequired') }}
                </template>
                <template v-else-if="!$v.inputConfiguredCores.minvalue">
                  {{ $t('global.form.invalidValue') }}
                </template>
              </b-form-invalid-feedback>
            </b-input-group>
          </b-form-group>
          <b-button variant="primary" type="submit">
            {{ $t('global.action.save') }}
          </b-button>
        </b-form>
      </page-section>
    </b-col>
  </b-row>
</template>

<script>
import { mapGetters } from 'vuex';
import { requiredIf, minValue } from 'vuelidate/lib/validators';

import PageSection from '@/components/Global/PageSection';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  name: 'FieldCoreOverrideConfiguration',
  components: { PageSection },
  mixins: [VuelidateMixin, BVToastMixin],
  data() {
    return {
      inputEnableFieldCoreOverride: this.$store.getters['fieldCoreOverride/isEnabled'],
      inputConfiguredCores: this.$store.getters['fieldCoreOverride/configuredCores'] || null,
      minValue: 1,
    };
  },
  computed: {
    ...mapGetters({
      configuredCores: 'fieldCoreOverride/configuredCores',
      processorInfo: 'licenses/licenses',
      isFieldCoreOverrideEnabled: 'fieldCoreOverride/isEnabled',
      systems: 'system/systems',
    }),
    maxConfiguredCores() {
      return Math.min(
        this.systems?.[0]?.processorSummaryCoreCount,
        this.processorInfo?.PermProcs?.MaxAuthorizedDevices,
      );
    },
  },
  watch: {
    configuredCores: function (value) {
      if (value < 1) {
        this.inputConfiguredCores = null;
      } else {
        this.inputConfiguredCores = value;
      }
    },
    isFieldCoreOverrideEnabled: function (value) {
      this.inputEnableFieldCoreOverride = value;
    },
    inputEnableFieldCoreOverride: function (value) {
      if (!value) {
        this.inputConfiguredCores = null;
      }
    },
  },
  validations() {
    return {
      inputConfiguredCores: {
        required: requiredIf(function () {
          return this.inputEnableFieldCoreOverride;
        }),
        minValue: minValue(this.minValue),
      },
    };
  },
  methods: {
    submitForm() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$store
        .dispatch('fieldCoreOverride/setFieldCoreOverride', this.inputConfiguredCores)
        .then((success) => this.successToast(success))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
