<template>
  <div class="form-background p-3">
    <BForm id="form-new-dump" novalidate @submit.prevent="handleSubmit">
      <BFormGroup
        :label="$t('pageDumps.form.selectDumpType')"
        label-for="selectDumpType"
      >
        <template #label>
          {{ $t('pageDumps.form.selectDumpType') }}
          <info-tooltip :title="$t('pageDumps.form.selectDumpTypeTooltip')" />
        </template>
        <BFormSelect
          id="selectDumpType"
          v-model="selectedDumpType"
          :options="updatedDumpTypeOptions"
          :state="getValidationState(v$.selectedDumpType)"
          @change="updateDumpInfo"
        >
          <template #first>
            <BFormSelectOption :value="''" disabled>
              {{ $t('global.form.selectAnOption') }}
            </BFormSelectOption>
          </template>
        </BFormSelect>
        <BFormInvalidFeedback role="alert">
          {{ $t('global.form.required') }}
        </BFormInvalidFeedback>
      </BFormGroup>
      <template v-if="selectedDumpType === 'resource'">
        <BFormGroup label-for="resourceSelector">
          <template #label>
            {{ $t('pageDumps.form.resourceSelector') }}
            <info-tooltip
              :title="$t('pageDumps.form.resourceSelectorTooltip')"
            />
          </template>

          <BForm-input id="resourceSelector" v-model="resourceSelectorValue">
          </BForm-input>
        </BFormGroup>
        <template v-if="isServiceUser">
          <BFormGroup label-for="password">
            <template #label>
              {{ $t('pageDumps.form.password') }}
              <info-tooltip :title="$t('pageDumps.form.passwordTooltip')" />
            </template>
            <input-password-toggle>
              <BForm-input
                id="password"
                v-model="resourcePasswordValue"
                autocomplete="off"
                type="password"
              >
              </BForm-input>
            </input-password-toggle>
          </BFormGroup>
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
    </BForm>
    <modal-confirmation
      v-model="modalConfirmation"
      @ok="createSystemDump($t(`pageDumps.form.${selectedDumpType}Dump`))"
    />
    <modal-partition-dump-confirmation
      v-model="modalPartition"
      :selected="selectedDumpType"
      @ok="
        selectedDumpType === 'partition'
          ? exceuteFunction(22)
          : exceuteFunction(34)
      "
    />
  </div>
</template>

<script setup>
import i18n from '@/i18n';
import { computed, ref, onBeforeMount, watch, nextTick } from 'vue';
import { required } from '@vuelidate/validators';
import ModalConfirmation from './DumpsModalConfirmation.vue';
import ModalPartitionDumpConfirmation from './DumpsPartitionModalConfirmation.vue';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import InputPasswordToggle from '@/components/Global/InputPasswordToggle.vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import useToast from '@/components/Composables/useToastComposable';
import { useVuelidate } from '@vuelidate/core';
import stores from '@/store/index.js';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();
const { successToast, errorToast, infoToast } = useToast();

const global = stores.GlobalStore();
const ibmiServiceFunctions = stores.IBMiServiceFunctionsStore();
const serverBootSettings = stores.BootSettingsStore();
const userManagement = stores.UserManagementStore();
const dumps = stores.DumpsStore()

const selectedDumpType =  ref('');
const resourceSelectorValue = ref(null);
const resourcePasswordValue = ref(null);
const dumpTypeOptions = ref([]);
const taskProgress = ref('');
const modalConfirmation = ref(false)
const modalPartition = ref(false)

onBeforeMount(() => {
    checkForUserData();
    checkIfInPhypStandby();
    Promise.all([
      global.getHmcManaged(),
      global.getBootProgress(),
      ibmiServiceFunctions.getAvailableServiceFunctions(),
      serverBootSettings.fetchBiosAttributes(),
      serverBootSettings.getBiosAttributes,
    ]);
  });

const rules = computed(() => ({
      selectedDumpType: { required },
    }
  ));
const v$ = useVuelidate(rules, { selectedDumpType });

const isOSRunning = computed(() => {
      return global.isOSRunningGetter;
    });
const availableFunctions = computed(() => {
      return ibmiServiceFunctions.serviceFunctionsGetter;
    });
const isIBMi = computed(() => {
      if (
        attributeKeys.value?.pvm_default_os_type === 'Default' ||
        attributeKeys.value?.pvm_default_os_type === 'IBM I'
      ) {
        return true;
      } else {
        return false;
      }
    });
const attributeKeys = computed(() => {
      return serverBootSettings.getBiosAttributes;
    });
const currentUser = computed(() => {
      return global.currentUserGetter;
    });
const isServiceUser = computed(() => {
      return global.isServiceUser;
    });
const isInPhypStandby = computed(() => {
      return global.isInPhypStandby;
    });
const updatedDumpTypeOptions = computed(() => {
      return setDumpTypeOptions();
    });
const hmcInfo = computed(() => {
      return global.hmcManagedGetter;
    });
const isButtonDisabled = computed(() => {
      if (
        !isOSRunning.value &&
        (selectedDumpType.value === 'partition' ||
          selectedDumpType.value === 'retryPartition')
      ) {
        return true;
      } else if (
        isOSRunning.value &&
        (selectedDumpType.value === 'partition' ||
          selectedDumpType.value === 'retryPartition')
      ) {
        if (selectedDumpType.value === 'partition') {
          return isFunctionDisabled(22);
        } else {
          return isFunctionDisabled(34);
        }
      } else {
        return false;
      }
    });
    
const checkTask = async() => {
      //getting list of all tasks and getting the api to the most recent task
      const taskObj = await dumps.getTask();
      taskProgress.value = taskObj.data.Members[taskObj.data.Members.length - 1];
      const taskLink = taskProgress.value['@odata.id'];
      //going to the most recent task
      const currentTask = async () => {
        return await global.getCurrentTask(taskLink);
      };
      const currentTaskProgress = (checkCounter = 0) => {
        checkCounter++;
        //if 'TaskState' is in running state for more than 20 mins, error message will be displayed to the user
        if (checkCounter > 40) {
          return errorToast(i18n.global.t('pageDumps.toast.resourceDumpFailed'));
        }
        Promise.all([currentTask()]).then((res) => {
          //monitor the value of parameter 'TaskState'
          const taskState = res[0]['TaskState'];
          //if TaskState is completed
          if (taskState == 'Completed') {
            successToast(i18n.global.t('pageDumps.toast.resourceDumpSuccess'));
            //if TaskState is running/in progress
          } else if (taskState == 'Running') {
            //reload the api after every 30 seconds till 20 mins to check if the 'TaskState' is changed to Completed or Cancelled
            setTimeout(() => {
              currentTaskProgress(checkCounter);
            }, 30000);
            //if TaskState is Cancelled
          } else if (taskState == 'Cancelled') {
            errorToast(i18n.global.t('pageDumps.toast.resourceDumpFailed'));
          }
        });
      };
      //trigger funtion to check 'TaskState'
      if (taskLink) {
        currentTaskProgress(0);
      } else {
        return errorToast(i18n.global.t('pageDumps.toast.resourceDumpFailed'));
      }
    };
const checkForUserData = () => {
      if (!currentUser.value) {
        userManagement.getUsers();
        global.getCurrentUser();
      }
    };
const checkIfInPhypStandby = (checkCounter = 0) => {
      checkCounter++;
      if (checkCounter > 15) return;
      if (!isInPhypStandby.value) {
        global.getBootProgress();
        setTimeout(() => {
          checkIfInPhypStandby(checkCounter);
        }, 60000);
      }
    };
const updateDumpInfo = () => {
  nextTick(() => {
    eventBus.emit('updateDumpInfo', selectedDumpType.value);
  });
    };
const handleSubmit = () => {
      v$.value.$touch();
      if (v$.value.selectedDumpType.$invalid) return;

      const dumpType = i18n.global.t(`pageDumps.form.${selectedDumpType.value}Dump`);

      if (selectedDumpType.value === 'system') {
        // System dump initiation
        showConfirmationModal();
      }
      // Resource dump initiation
      else if (selectedDumpType.value === 'resource') {
        dumps.createResourceDump({
            resourceSelector: resourceSelectorValue.value,
            // If not logged as service, '' must be used
            resourcePassword: resourcePasswordValue.value || '',
          })
          .then(() => {
            infoToast(i18n.global.t('pageDumps.toast.successStartDump'), {
              title: i18n.global.t('pageDumps.toast.successStartResourceDumpTitle'),
              timestamp: true,
            });
            checkTask();
          })
          .catch(({ message }) => errorToast(message));
      }
      // BMC dump initiation
      else if (selectedDumpType.value === 'bmc') {
        dumps.createBmcDump(dumpType)
          .then(() =>
            infoToast(i18n.global.t('pageDumps.toast.successStartDump'), {
              title: i18n.global.t('pageDumps.toast.successStartBmcDumpTitle'),
              timestamp: true,
            })
          )
          .catch(({ message }) => errorToast(message));
      } else if (selectedDumpType.value === 'partition') {
        // Partition dump initiation
        showPartitionDumpConfirmationModal();
      } else if (selectedDumpType.value === 'retryPartition') {
        // Retry partition dump
        showPartitionDumpConfirmationModal();
      }
    };
const setDumpTypeOptions = () => {
      let minimumOptions = [
        { value: 'bmc', text: i18n.global.t('pageDumps.form.bmcDump') },
        { value: 'resource', text: i18n.global.t('pageDumps.form.resourceDump') },
        { value: 'system', text: i18n.global.t('pageDumps.form.systemDump') },
      ];
      dumpTypeOptions.value = [];
      if (hmcInfo.value === 'Enabled') {
        return (dumpTypeOptions.value = minimumOptions);
      } else if (isIBMi.value) {
        return (dumpTypeOptions.value = [
          ...minimumOptions,
          {
            value: 'partition',
            text: i18n.global.t('pageDumps.form.partitionDump'),
          },
          {
            value: 'retryPartition',
            text: i18n.global.t('pageDumps.form.retryPartitionDump'),
          },
        ]);
      } else {
        return (dumpTypeOptions.value = minimumOptions);
      }
    };
const exceuteFunction = (value) => {
      ibmiServiceFunctions.executeServiceFunction(value)
        .then((message) => {
          infoToast(
            i18n.global.t('pageDumps.toast.successSavePartitionDumpInfo')
          );
          successToast(message);
        })
        .catch(({ message }) => errorToast(message));
    };
const isFunctionDisabled = (value) => {
      // This condition is to check if the function is available to execute
      if (availableFunctions.value.includes(value)) {
        return false;
      } else {
        return true;
      }
    };
const showConfirmationModal = () => {
      modalConfirmation.value = true
    };
const showPartitionDumpConfirmationModal = () => {
      modalPartition.value = true
    };
const createSystemDump = (dumpType) => {
      dumps.createSystemDump(dumpType)
        .then(() =>
          infoToast(i18n.global.t('pageDumps.toast.successStartDump'), {
            title: i18n.global.t('pageDumps.toast.successStartSystemDumpTitle'),
            timestamp: true,
          })
        )
        .catch(({ message }) => errorToast(message));
    };
</script>