<template>
  <div>
    <page-section :section-title="$t('pagePower.powerPerformanceModesTitle')">
      <b-row class="mb-3">
        <b-col xl="10">
          <b-button v-b-toggle.collapse-role-table variant="link">
            <icon-chevron />
            {{ $t('pagePower.powerPerformanceModesDropdownLabel') }}
          </b-button>
          <b-collapse id="collapse-role-table" class="mt-3">
            <table-power-performance-modes
              :power-performance-mode-values="powerPerformanceModeValues"
            />
          </b-collapse>
        </b-col>
      </b-row>
      <b-row>
        <b-col>
          <b-form id="form-power-saver" @submit.prevent="handlePowerPerformanceSubmit">
            <b-form-group :disabled="loading || safeMode">
              <b-row>
                <b-col>
                  <b-form-group :label="$t('pagePower.selectModeLabel')">
                    <b-form-radio-group
                      id="power-save-modes"
                      v-model="powerPerformanceMode"
                      :options="powerPerformanceModeOptions"
                      stacked
                    ></b-form-radio-group>
                  </b-form-group>
                </b-col>
              </b-row>
              <b-button variant="primary" type="submit" form="form-power-saver">
                {{ $t('pagePower.submitButton') }}
              </b-button>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>

      <modal-power-performance-modes :title="powerPerformanceMode" @ok="savePowerPerformanceMode" />
    </page-section>
  </div>
</template>

<script>
import PageSection from '@/components/Global/PageSection';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import ModalPowerPerformanceModes from './ModalPowerPerformanceModes';
import TablePowerPerformanceModes from './TablePowerPerformanceModes';

export default {
  components: {
    PageSection,
    IconChevron,
    ModalPowerPerformanceModes,
    TablePowerPerformanceModes,
  },
  mixins: [BVToastMixin, LoadingBarMixin],
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
      powerPerformanceMode: null,
      powerPerformanceModeOptions: [
        { text: this.$t('pagePower.selectMode.static'), value: 'Static' },
        {
          text: this.$t('pagePower.selectMode.powerSaving'),
          value: 'PowerSaving',
        },
        {
          text: this.$t('pagePower.selectMode.maximumPerformance'),
          value: 'MaximumPerformance',
        },
      ],
    };
  },
  computed: {
    powerPerformanceModeData() {
      return this.$store.getters['powerControl/powerPerformanceMode'];
    },
    powerPerformanceModeValues() {
      return this.$store.getters['powerControl/powerPerformanceModeValues'];
    },
  },
  created() {
    this.startLoader();
    this.$store.dispatch('powerControl/getPowerPerformanceMode').finally(() => {
      this.setPowerPerformanceValue(this.powerPerformanceModeData);
      this.endLoader();
    });
  },
  methods: {
    setPowerPerformanceValue(data) {
      this.powerPerformanceMode = data;
    },
    handlePowerPerformanceSubmit() {
      if (this.powerPerformanceMode) {
        this.showConfirmationModal();
      }
    },
    showConfirmationModal() {
      this.$bvModal.show('modal-power-performance-modes');
    },
    savePowerPerformanceMode() {
      this.$store
        .dispatch('powerControl/setPowerPerformanceMode', this.powerPerformanceMode)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
