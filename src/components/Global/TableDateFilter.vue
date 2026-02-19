<template>
  <BRow class="mb-2">
    <BCol class="d-sm-flex">
      <BFormGroup
        :label="$t('global.table.fromDate')"
        label-for="input-from-date"
        class="mr-3 my-0 w-100"
      >
        <BInputGroup>
          <DatePicker
            id="input-from-date"
            v-model="fromDate"
            :max-date="toDate"
            mode="date"
            :class="[
              'carbon-date-picker',
              { 'is-invalid': v$.fromDate.$error },
            ]"
            @update:model-value="v$.fromDate.$touch()"
          >
            <template #default="{ inputValue, togglePopover }">
              <div class="date-input-wrapper">
                <input
                  :value="inputValue"
                  class="dp-input"
                  placeholder="mm/dd/yyyy"
                  readonly
                  @click="togglePopover()"
                />
                <button
                  type="button"
                  class="calendar-icon-btn"
                  @click="togglePopover()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="calendar-icon"
                  >
                    <path
                      d="M26,4h-4V2h-2v2h-8V2h-2v2H6C4.9,4,4,4.9,4,6v20c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2V6C28,4.9,27.1,4,26,4z M26,26H6V12h20 V26z M26,10H6V6h4v2h2V6h8v2h2V6h4V10z"
                    />
                  </svg>
                </button>
              </div>
            </template>
          </DatePicker>
          <BFormInvalidFeedback
            v-if="v$.fromDate.$error"
            role="alert"
            :state="false"
          >
            {{
              $t('global.form.dateMustBeBefore', {
                date: formatDateDisplay(toDate),
              })
            }}
          </BFormInvalidFeedback>
        </BInputGroup>
      </BFormGroup>
      <BFormGroup
        :label="$t('global.table.toDate')"
        label-for="input-to-date"
        class="my-0 w-100"
      >
        <BInputGroup>
          <DatePicker
            id="input-to-date"
            v-model="toDate"
            :min-date="fromDate"
            mode="date"
            :class="['carbon-date-picker', { 'is-invalid': v$.toDate.$error }]"
            @update:model-value="v$.toDate.$touch()"
          >
            <template #default="{ inputValue, togglePopover }">
              <div class="date-input-wrapper">
                <input
                  :value="inputValue"
                  class="dp-input"
                  placeholder="mm/dd/yyyy"
                  readonly
                  @click="togglePopover()"
                />
                <button
                  type="button"
                  class="calendar-icon-btn"
                  @click="togglePopover()"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 32 32"
                    class="calendar-icon"
                  >
                    <path
                      d="M26,4h-4V2h-2v2h-8V2h-2v2H6C4.9,4,4,4.9,4,6v20c0,1.1,0.9,2,2,2h20c1.1,0,2-0.9,2-2V6C28,4.9,27.1,4,26,4z M26,26H6V12h20 V26z M26,10H6V6h4v2h2V6h8v2h2V6h4V10z"
                    />
                  </svg>
                </button>
              </div>
            </template>
          </DatePicker>
          <BFormInvalidFeedback
            v-if="v$.toDate.$error"
            role="alert"
            :state="false"
          >
            {{
              $t('global.form.dateMustBeAfter', {
                date: formatDateDisplay(fromDate),
              })
            }}
          </BFormInvalidFeedback>
        </BInputGroup>
      </BFormGroup>
    </BCol>
  </BRow>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { DatePicker } from 'v-calendar';
import 'v-calendar/style.css';
import { useVuelidate } from '@vuelidate/core';

const fromDate = ref(null);
const toDate = ref(null);
const offsetToDate = ref('');

const emit = defineEmits(['change']);

// Date format function for display
const formatDateDisplay = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month}/${day}/${year}`;
};

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
      if (!fromDate.value || !value) return true;
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
  if (newVal) {
    offsetToDate.value = new Date(newVal).setUTCHours(23, 59, 59, 999);
  }
  emitChange();
});

const emitChange = () => {
  emit('change', {
    fromDate: fromDate.value ? new Date(fromDate.value) : null,
    toDate: toDate.value ? new Date(offsetToDate.value) : null,
  });
};
</script>

<style scoped>
/* Carbon Design System date picker styling */
:deep(.carbon-date-picker) {
  width: 100%;
  position: relative;
  z-index: 10;
}

.date-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

:deep(.dp-input) {
  border: none;
  border-bottom: 1px solid #3ac4bf !important;
  border-radius: 0;
  padding: 0.5rem 2.5rem 0.5rem 0.5rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  background-color: #f4f4f4;
  color: #161616;
  transition: all 0.11s cubic-bezier(0.2, 0, 0.38, 0.9);
  margin-left: 1px;
  margin-right: 1px;
  height: 40px;
  width: 100%;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
  cursor: pointer;
}

:deep(.dp-input::placeholder) {
  color: #6f6f6f;
}

:deep(.dp-input:hover) {
  background-color: #e8e8e8;
}

:deep(.dp-input:focus) {
  outline: 2px solid #0f62fe;
  outline-offset: -2px;
  background-color: #ffffff;
  border-bottom-color: #0f62fe;
}

.calendar-icon-btn {
  position: absolute;
  right: 0.5rem;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.calendar-icon {
  width: 16px;
  height: 16px;
  fill: #161616;
}

.calendar-icon-btn:hover .calendar-icon {
  fill: #0f62fe;
}

/* V-Calendar popover - keep default styling with high z-index */
:deep(.vc-popover-content-wrapper) {
  z-index: 9999 !important;
}

/* Remove background from arrow and month buttons */
:deep(.vc-arrow) {
  background-color: transparent !important;
}

:deep(.vc-title) {
  background-color: transparent !important;
}

/* Blue dot below today's date */
:deep(.vc-day.is-today .vc-day-content) {
  position: relative;
}

:deep(.vc-day.is-today .vc-day-content::after) {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background-color: #0f62fe;
  border-radius: 50%;
}

/* Invalid state styling */
:deep(.carbon-date-picker.is-invalid .dp-input) {
  border-bottom: 2px solid #da1e28;
  outline: 2px solid #da1e28;
  outline-offset: -2px;
}

:deep(.carbon-date-picker.is-invalid .dp-input:focus) {
  outline: 2px solid #da1e28;
  border-bottom-color: #da1e28;
}

/* Responsive adjustments */
@media (max-width: 576px) {
  :deep(.dp-input) {
    margin-bottom: 1rem;
  }
}
</style>
