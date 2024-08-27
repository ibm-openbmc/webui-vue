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
          :options="updatedDumpTypeOptions"
          :state="getValidationState($v.selectedDumpType)"
          @change="updateDumpInfo"
        >
          <template #first>
            <b-form-select-option :value="''" disabled>
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

      <b-button
        :disabled="isButtonDisabled"
        variant="primary"
        type="submit"
        form="form-new-dump"
      >
        {{ $t('pageDumps.form.initiateDump') }}
      </b-button>
    </b-form>
    <modal-confirmation
      @ok="createSystemDump($t(`pageDumps.form.${selectedDumpType}Dump`))"
    />
    <modal-partition-dump-confirmation
      :selected="selectedDumpType"
      @ok="
        selectedDumpType === 'partition'
          ? exceuteFunction(22)
          : exceuteFunction(34)
      "
    />
  </div>
</template>

<script>
import { required } from 'vuelidate/lib/validators';
import ModalConfirmation from './DumpsModalConfirmation';
import ModalPartitionDumpConfirmation from './DumpsPartitionModalConfirmation';
import InfoTooltip from '@/components/Global/InfoTooltip';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';

export default {
  components: {
    InfoTooltip,
    InputPasswordToggle,
    ModalConfirmation,
    ModalPartitionDumpConfirmation,
  },
  mixins: [BVToastMixin, VuelidateMixin],
  data() {
    return {
      selectedDumpType: '',
      resourceSelectorValue: null,
      resourcePassword: null,
      dumpTypeOptions: [],
      taskProgress: '',
    };
  },
  computed: {
    isOSRunning() {
      return this.$store.getters['global/isOSRunning'];
    },
    availableFunctions() {
      return this.$store.getters['ibmiServiceFunctions/serviceFunctions'];
    },
    isIBMi() {
      if (
        this.attributeKeys?.pvm_default_os_type === 'Default' ||
        this.attributeKeys?.pvm_default_os_type === 'IBM I'
      ) {
        return true;
      } else {
        return false;
      }
    },
    attributeKeys() {
      return this.$store.getters['serverBootSettings/biosAttributes'];
    },
    currentUser() {
      return this.$store.getters['global/currentUser'];
    },
    isServiceUser() {
      return this.$store.getters['global/isServiceUser'];
    },
    isInPhypStandby() {
      return this.$store.getters['global/isInPhypStandby'];
    },
    updatedDumpTypeOptions() {
      return this.setDumpTypeOptions();
    },
    hmcInfo() {
      return this.$store?.getters['global/hmcManaged'];
    },
    isButtonDisabled() {
      if (
        !this.isOSRunning &&
        (this.selectedDumpType === 'partition' ||
          this.selectedDumpType === 'retryPartition')
      ) {
        return true;
      } else if (
        this.isOSRunning &&
        (this.selectedDumpType === 'partition' ||
          this.selectedDumpType === 'retryPartition')
      ) {
        if (this.selectedDumpType === 'partition') {
          return this.isFunctionDisabled(22);
        } else {
          return this.isFunctionDisabled(34);
        }
      } else {
        return false;
      }
    },
  },
  created() {
    this.checkForUserData();
    this.checkIfInPhypStandby();
    Promise.all([
      this.$store.dispatch('global/getHmcManaged'),
      this.$store.dispatch('global/getBootProgress'),
      this.$store.dispatch('ibmiServiceFunctions/getAvailableServiceFunctions'),
      this.$store.dispatch('serverBootSettings/getBiosAttributes'),
    ]);
  },
  validations() {
    return {
      selectedDumpType: { required },
    };
  },
  methods: {
    async checkTask() {
      //getting list of all tasks and getting the api to the most recent task
      const data = await this.$store.dispatch('dumps/getTask');
      this.taskProgress = data.Members[data.Members.length - 1];
      const taskLink = this.taskProgress['@odata.id'];
      //going to the most recent task
      const currentTask = async () => {
        return await this.$store.dispatch('global/getCurrentTask', taskLink);
      };
      const currentTaskProgress = (checkCounter = 0) => {
        checkCounter++;
        //if 'TaskState' is in running state for more than 20 mins, error message will be displayed to the user
        if (checkCounter > 40) {
          return this.errorToast(this.$t('pageDumps.toast.resourceDumpFailed'));
        }
        Promise.all([currentTask()]).then((res) => {
          //monitor the value of parameter 'TaskState'
          const taskState = res[0]['TaskState'];
          //if TaskState is completed
          if (taskState == 'Completed') {
            this.successToast(this.$t('pageDumps.toast.resourceDumpSuccess'));
            //if TaskState is running/in progress
          } else if (taskState == 'Running') {
            //reload the api after every 30 seconds till 20 mins to check if the 'TaskState' is changed to Completed or Cancelled
            setTimeout(() => {
              currentTaskProgress(checkCounter);
            }, 30000);
            //if TaskState is Cancelled
          } else if (taskState == 'Cancelled') {
            this.errorToast(this.$t('pageDumps.toast.resourceDumpFailed'));
          }
        });
      };
      //trigger funtion to check 'TaskState'
      if (taskLink) {
        currentTaskProgress(0);
      } else {
        return this.errorToast(this.$t('pageDumps.toast.resourceDumpFailed'));
      }
    },
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
          .then(() => {
            this.infoToast(this.$t('pageDumps.toast.successStartDump'), {
              title: this.$t('pageDumps.toast.successStartResourceDumpTitle'),
              timestamp: true,
            });
            this.checkTask();
          })
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
      } else if (this.selectedDumpType === 'partition') {
        // Partition dump initiation
        this.showPartitionDumpConfirmationModal();
      } else if (this.selectedDumpType === 'retryPartition') {
        // Retry partition dump
        this.showPartitionDumpConfirmationModal();
      }
    },
    setDumpTypeOptions() {
      let minimumOptions = [
        { value: 'bmc', text: this.$t('pageDumps.form.bmcDump') },
        { value: 'resource', text: this.$t('pageDumps.form.resourceDump') },
        { value: 'system', text: this.$t('pageDumps.form.systemDump') },
      ];
      this.dumpTypeOptions = [];
      if (this.hmcInfo === 'Enabled') {
        return (this.dumpTypeOptions = minimumOptions);
      } else if (this.isIBMi) {
        return (this.dumpTypeOptions = [
          ...minimumOptions,
          {
            value: 'partition',
            text: this.$t('pageDumps.form.partitionDump'),
          },
          {
            value: 'retryPartition',
            text: this.$t('pageDumps.form.retryPartitionDump'),
          },
        ]);
      } else {
        return (this.dumpTypeOptions = minimumOptions);
      }
    },
    exceuteFunction(value) {
      this.$store
        .dispatch('ibmiServiceFunctions/executeServiceFunction', value)
        .then((message) => {
          this.infoToast(
            this.$t('pageDumps.toast.successSavePartitionDumpInfo')
          );
          this.successToast(message);
        })
        .catch(({ message }) => this.errorToast(message));
    },
    isFunctionDisabled(value) {
      // This condition is to check if the function is available to execute
      if (this.availableFunctions.includes(value)) {
        return false;
      } else {
        return true;
      }
    },
    showConfirmationModal() {
      this.$bvModal.show('modal-confirmation');
    },
    showPartitionDumpConfirmationModal() {
      this.$bvModal.show('modal-partition-dump-confirmation');
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
