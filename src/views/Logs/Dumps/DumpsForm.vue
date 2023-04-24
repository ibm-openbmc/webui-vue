<template>
  <div class="form-background p-3">
    <b-form id="form-new-dump" novalidate @submit.prevent="handleSubmit">
      <b-form-group
        :label="$t('pageDumps.form.selectDumpType')"
        label-for="selectDumpType"
      >
        <template #label>
          {{ $t('pageDumps.form.selectDumpType') }}
          <info-tooltip :title="$t('pageDumps.form.selectDumpTypeTooltip')" />
        </template>
        <b-form-select
          id="selectDumpType"
          v-model="selectedDumpType"
          :options="dumpTypeOptions"
          :state="getValidationState($v.selectedDumpType)"
          @change="updateDumpInfo"
        >
          <template #first>
            <b-form-select-option :value="null" disabled>
              {{ $t('global.form.selectAnOption') }}
            </b-form-select-option>
          </template>
        </b-form-select>
        <b-form-invalid-feedback role="alert">
          {{ $t('global.form.required') }}
        </b-form-invalid-feedback>
      </b-form-group>
      <template v-if="selectedDumpType === 'resource'">
        <b-form-group label-for="resourceSelector">
          <template #label>
            {{ $t('pageDumps.form.resourceSelector') }}
            <info-tooltip
              :title="$t('pageDumps.form.resourceSelectorTooltip')"
            />
          </template>

          <b-form-input id="resourceSelector" v-model="resourceSelectorValue">
          </b-form-input>
        </b-form-group>
        <template v-if="isServiceUser">
          <b-form-group label-for="password">
            <template #label>
              {{ $t('pageDumps.form.password') }}
              <info-tooltip :title="$t('pageDumps.form.passwordTooltip')" />
            </template>
            <input-password-toggle>
              <b-form-input
                id="password"
                v-model="resourcePassword"
                autocomplete="off"
                type="password"
              >
              </b-form-input>
            </input-password-toggle>
          </b-form-group>
        </template>
      </template>

      <b-button variant="primary" type="submit" form="form-new-dump">
        {{ $t('pageDumps.form.initiateDump') }}
      </b-button>
    </b-form>
    <modal-confirmation
      @ok="createSystemDump($t(`pageDumps.form.${selectedDumpType}Dump`))"
    />
  </div>
</template>

<script>
import { required } from 'vuelidate/lib/validators';
import ModalConfirmation from './DumpsModalConfirmation';
import InfoTooltip from '@/components/Global/InfoTooltip';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';

export default {
  components: { InfoTooltip, InputPasswordToggle, ModalConfirmation },
  mixins: [BVToastMixin, VuelidateMixin],
  data() {
    return {
      selectedDumpType: null,
      resourceSelectorValue: null,
      resourcePassword: null,
      dumpTypeOptions: [
        { value: 'bmc', text: this.$t('pageDumps.form.bmcDump') },
        { value: 'resource', text: this.$t('pageDumps.form.resourceDump') },
        { value: 'system', text: this.$t('pageDumps.form.systemDump') },
      ],
    };
  },
  computed: {
    currentUser() {
      return this.$store.getters['global/currentUser'];
    },
    isServiceUser() {
      return this.$store.getters['global/isServiceUser'];
    },
    isInPhypStandby() {
      return this.$store.getters['global/isInPhypStandby'];
    },
  },
  created() {
    this.checkForUserData();
    this.checkIfInPhypStandby();
  },
  validations() {
    return {
      selectedDumpType: { required },
    };
  },
  methods: {
    checkForUserData() {
      if (!this.currentUser) {
        this.$store.dispatch('userManagement/getUsers');
        this.$store.dispatch('global/getCurrentUser');
      }
    },
    checkIfInPhypStandby(checkCounter = 0) {
      checkCounter++;
      if (checkCounter > 15) return;
      if (!this.isInPhypStandby) {
        this.$store.dispatch('global/getBootProgress');
        setTimeout(() => {
          this.checkIfInPhypStandby(checkCounter);
        }, 60000);
      }
    },
    updateDumpInfo() {
      this.$emit('updateDumpInfo', this.selectedDumpType);
    },
    handleSubmit() {
      this.$v.$touch();
      if (this.$v.$invalid) return;

      const dumpType = this.$t(`pageDumps.form.${this.selectedDumpType}Dump`);

      if (this.selectedDumpType === 'system') {
        // System dump initiation
        this.showConfirmationModal();
      }
      // Resource dump initiation
      else if (this.selectedDumpType === 'resource') {
        this.$store
          .dispatch('dumps/createResourceDump', {
            dumpType: dumpType,
            resourceSelector: this.resourceSelectorValue,
            // If not logged as service, '' must be used
            resourcePassword: this.resourcePassword || '',
          })
          .then(() =>
            this.infoToast(this.$t('pageDumps.toast.successStartDump'), {
              title: this.$t('pageDumps.toast.successStartResourceDumpTitle'),
              timestamp: true,
            })
          )
          .catch(({ message }) => this.errorToast(message));
      }
      // BMC dump initiation
      else if (this.selectedDumpType === 'bmc') {
        this.$store
          .dispatch('dumps/createBmcDump', dumpType)
          .then(() =>
            this.infoToast(this.$t('pageDumps.toast.successStartDump'), {
              title: this.$t('pageDumps.toast.successStartBmcDumpTitle'),
              timestamp: true,
            })
          )
          .catch(({ message }) => this.errorToast(message));
      }
    },
    showConfirmationModal() {
      this.$bvModal.show('modal-confirmation');
    },
    createSystemDump(dumpType) {
      this.$store
        .dispatch('dumps/createSystemDump', dumpType)
        .then(() =>
          this.infoToast(this.$t('pageDumps.toast.successStartDump'), {
            title: this.$t('pageDumps.toast.successStartSystemDumpTitle'),
            timestamp: true,
          })
        )
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
