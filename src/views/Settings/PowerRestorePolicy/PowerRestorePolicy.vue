<template>
  <b-container fluid="xl">
    <page-title
      :title="$t('appPageTitle.powerRestorePolicy')"
      :description="$t('pagePowerRestorePolicy.description')"
    />

    <b-row>
      <b-col>
        <alert v-if="isOperatingModeManual" variant="warning" class="mb-5">
          <b-row align-v="center">
            <b-col>
              <p class="mb-0">
                {{ $t('pagePowerRestorePolicy.alert.manualOperatingMode') }}
              </p>
            </b-col>
            <b-col>
              <div>
                <b-link to="/operations/server-power-operations">
                  {{ $t('pagePowerRestorePolicy.alert.changeServerOpMode') }}
                </b-link>
              </div>
            </b-col>
          </b-row>
        </alert>
      </b-col>
    </b-row>
    <b-row>
      <b-col sm="8" md="6" xl="12">
        <b-form-group :label="$t('pagePowerRestorePolicy.powerPoliciesLabel')">
          <b-form-radio-group
            v-model="currentPowerRestorePolicy"
            :disabled="isOperatingModeManual"
            :options="options"
            name="power-restore-policy"
            stacked
          ></b-form-radio-group>
        </b-form-group>
      </b-col>
    </b-row>

    <b-button variant="primary" :disabled="isOperatingModeManual" type="submit" @click="submitForm">
      {{ $t('global.action.save') }}
    </b-button>
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import Alert from '@/components/Global/Alert';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import BVToastMixin from '@/components/Mixins/BVToastMixin';

export default {
  name: 'PowerRestorePolicy',
  components: { PageTitle, Alert },
  mixins: [VuelidateMixin, BVToastMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  data() {
    return {
      policyValue: null,
      options: [],
    };
  },
  computed: {
    powerRestorePolicies() {
      return this.$store.getters['powerPolicy/powerRestorePolicies'];
    },
    currentPowerRestorePolicy: {
      get() {
        return this.$store.getters['powerPolicy/powerRestoreCurrentPolicy'];
      },
      set(policy) {
        this.policyValue = policy;
      },
    },
    isOperatingModeManual() {
      return (
        !this.$store.getters['serverBootSettings/biosAttributes']?.pvm_system_operating_mode ||
        this.$store.getters['serverBootSettings/biosAttributes']?.pvm_system_operating_mode ===
          'Manual'
      );
    },
  },
  created() {
    this.startLoader();
    this.renderPowerRestoreSettings();
  },
  methods: {
    renderPowerRestoreSettings() {
      Promise.all([
        this.$store.dispatch('serverBootSettings/getBiosAttributes'),
        this.$store.dispatch('powerPolicy/getPowerRestorePolicies'),
        this.$store.dispatch('powerPolicy/getPowerRestoreCurrentPolicy'),
      ]).finally(() => {
        this.options.length = 0;
        this.powerRestorePolicies.map((item) => {
          this.options.push({
            text: this.$t(`pagePowerRestorePolicy.policiesDesc.${item.state}`),
            value: `${item.state}`,
          });
        });
        this.endLoader();
      });
    },
    submitForm() {
      this.startLoader();
      this.$store
        .dispatch(
          'powerPolicy/setPowerRestorePolicy',
          this.policyValue || this.currentPowerRestorePolicy,
        )
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => {
          this.renderPowerRestoreSettings();
        });
    },
  },
};
</script>
