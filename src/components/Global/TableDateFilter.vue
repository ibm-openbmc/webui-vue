<template>
  <BRow class="mb-2">
    <BCol class="d-sm-flex">
      <BFormGroup
        :label="$t('global.table.fromDate')"
        label-for="input-from-date"
        class="mr-3 my-0 w-100"
      >
        <BInputGroup>
          <BFormInput
            id="input-from-date"
            v-model="fromDate"
            type="date"
            :max="toDate"
            class="form-control-with-button mb-3 mb-md-0 carbon-date"
            :state="getValidationState(v$.fromDate)"
            @update:model-value="v$.fromDate.$touch()"
          />
          <BFormInvalidFeedback role="alert">
            {{ $t('global.form.dateMustBeBefore', { date: toDate }) }}
          </BFormInvalidFeedback>
        </BInputGroup>
      </BFormGroup>
      <BFormGroup
        :label="$t('global.table.toDate')"
        label-for="input-to-date"
        class="my-0 w-100"
      >
        <BInputGroup>
          <BFormInput
            id="input-to-date"
            v-model="toDate"
            type="date"
            :min="fromDate"
            class="form-control-with-button carbon-date"
            :state="getValidationState(v$.toDate)"
            @update:model-value="v$.toDate.$touch()"
          />
          <BFormInvalidFeedback role="alert">
            {{ $t('global.form.dateMustBeAfter', { date: fromDate }) }}
          </BFormInvalidFeedback>
        </BInputGroup>
      </BFormGroup>
    </BCol>
  </BRow>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import event from '../../eventBus';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
const fromDate = ref('');
const toDate = ref('');
const { getValidationState } = useVuelidateComposable();
const offsetToDate = ref('');

const rules = computed(() => ({
  fromDate: {
    maxDate: (value) => {
      if (!toDate.value) return true;
      const date = new Date(value);
      const maxDate = new Date(toDate.value);
      if (date.getTime() > maxDate.getTime()) return false;
      return true;
    },
  },
  toDate: {
    minDate: (value) => {
      if (!fromDate.value) return true;
      const date = new Date(value);
      const minDate = new Date(fromDate.value);
      if (date.getTime() < minDate.getTime()) return false;
      return true;
    },
  },
}));

const v$ = useVuelidate(rules, { fromDate, toDate });
watch(fromDate, () => {
  emitChange();
});

watch(toDate, (newVal) => {
  // Offset the end date to end of day to make sure all
  // entries from selected end date are included in filter
  offsetToDate.value = new Date(newVal).setUTCHours(23, 59, 59, 999);
  emitChange();
});

const emitChange = () => {
  event.emit('change', {
    fromDate: fromDate.value ? new Date(fromDate.value) : null,
    toDate: toDate.value ? new Date(offsetToDate.value) : null,
  });
};
</script>
<style scoped>
.carbon-date {
  border-bottom: 1px solid;
  border-top: none;
  border-left: none;
  border-right: none;
  margin-left: 1px;
  margin-right: 1px;
}
.form-control.is-invalid {
  padding-right: 12px;
}
.form-control.is-valid {
  padding-right: 12px;
}
</style>
