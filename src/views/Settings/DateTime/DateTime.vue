<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.dateTime')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <span class="no-underline-link">
            {{ $t('pageDateTime.alert.message') }}
            <router-link to="/profile-settings">
              {{ $t('pageDateTime.alert.link') }}</router-link
            >
          </span>
        </alert>
      </BCol>
    </BRow>
    <page-section>
      <BRow>
        <BCol lg="3">
          <dl>
            <dt>{{ $t('pageDateTime.form.date') }}</dt>
            <dd v-if="bmcTime">{{ $filters.formatDate(bmcTime) }}</dd>
            <dd v-else>--</dd>
          </dl>
        </BCol>
        <BCol lg="3">
          <dl>
            <dt>{{ $t('pageDateTime.form.time.label') }}</dt>
            <dd v-if="bmcTime">{{ $filters.formatTime(bmcTime) }}</dd>
            <dd v-else>--</dd>
          </dl>
        </BCol>
      </BRow>
    </page-section>
    <page-section v-show="showDhcpNtpServers">
      <BButton v-b-toggle.collapse-dhcp-ntp variant="link" class="mt-3">
        <icon-chevron />
        {{ $t('pageDateTime.viewDynamicNtp') }}
        <info-tooltip
          :title="$t('pageDateTime.dhcpNtpInfoTooltip')"
          class="infoToolTipClass"
        />
      </BButton>

      <BCollapse id="collapse-dhcp-ntp">
        <BRow
          v-for="(group, rowIndex) in chunkedDhcpNtp"
          :key="rowIndex"
          class="mt-3 ms-3"
        >
          <BCol
            v-for="(item, colIndex) in group"
            :key="colIndex"
            sm="6"
            lg="4"
            xl="3"
          >
            <BFormGroup
              :label="`Server ${rowIndex * 3 + colIndex + 1}`"
              :label-for="`${colIndex + 1}`"
            >
              <BFormInput
                :id="`${colIndex + 1}`"
                class="custom-form-group"
                disabled="true"
                :placeholder="item"
              />
            </BFormGroup>
          </BCol>
        </BRow>
      </BCollapse>
    </page-section>
    <page-section :section-title="$t('pageDateTime.configureSettings')">
      <BRow>
        <BCol md="8" xl="6">
          <alert v-if="!isServerOff()" variant="warning" class="mb-4">
            <span>
              {{ $t('pageDateTime.alert.messagePowerOff') }}
            </span>
          </alert>
          <alert v-if="globalMfaValue" variant="info" class="mb-2">
            <span>
              {{ $t('pageDateTime.alert.mfaMessage') }}
            </span>
          </alert>
          <alert variant="info" class="mb-4">
            <span>
              {{ $t('pageDateTime.alert.messageNtp') }}
            </span>
          </alert>
          <alert
            v-if="showNtpAlert && !manualOptionSelected"
            variant="warning"
            class="mb-4"
          >
            <span>
              {{ $t('pageDateTime.alert.alertNtp') }}
            </span>
          </alert>
        </BCol>
      </BRow>
      <BForm novalidate @submit.prevent="submitForm">
        <BFormGroup
          aria-label="configure-date-time-settings"
          label="Configure date and time"
          :disabled="loading || !isServerOff()"
          label-sr-only
        >
          <BFormRadio
            v-model="form.configurationSelected"
            value="manual"
            data-test-id="dateTime-radio-configureManual"
          >
            {{ $t('pageDateTime.form.manual') }}
          </BFormRadio>
          <BRow class="mt-3 ms-3">
            <BCol sm="6" lg="4" xl="3">
              <BFormGroup
                aria-label="date-input-from"
                :label="$t('pageDateTime.form.date')"
                label-for="input-manual-date"
              >
                <BFormText id="date-format-help">{{
                  $t('global.calendar.dateFormat')
                }}</BFormText>
                <BInputGroup aria-label="date-input-group">
                  <BFormInput
                    id="input-manual-date"
                    v-model="form.manual.date"
                    aria-label="date-input"
                    type="date"
                    :state="getValidationState(v$.form.manual.date)"
                    :disabled="ntpOptionSelected"
                    data-test-id="dateTime-input-manualDate"
                    class="form-control-with-button"
                    @blur="v$.form.manual.date.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    <template
                      v-if="
                        v$.form.manual.date.$errors.length > 0
                          ? v$.form.manual.date.$errors[0].$validator ===
                            'pattern'
                          : false
                      "
                    >
                      {{ $t('global.form.invalidFormat') }}
                    </template>
                    <template
                      v-if="
                        v$.form.manual.date.$errors.length > 0
                          ? v$.form.manual.date.$errors[0].$validator ===
                            'required'
                          : false
                      "
                    >
                      {{ $t('global.form.fieldRequired') }}
                    </template>
                  </BFormInvalidFeedback>
                </BInputGroup>
              </BFormGroup>
            </BCol>
            <BCol sm="6" lg="4" xl="3">
              <BFormGroup
                aria-label="time-input-form"
                :label="$t('pageDateTime.form.time.timezone', { timezone })"
                label-for="input-manual-time"
              >
                <BFormText id="time-format-help">HH:MM</BFormText>
                <BInputGroup aria-label="time-input-group">
                  <BFormInput
                    id="input-manual-time"
                    v-model="form.manual.time"
                    aria-label="24-hour time (UTC)"
                    :state="getValidationState(v$.form.manual.time)"
                    :disabled="ntpOptionSelected"
                    data-test-id="dateTime-input-manualTime"
                    @blur="v$.form.manual.time.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    <template
                      v-if="
                        v$.form.manual.time.$errors.length > 0
                          ? v$.form.manual.time.$errors[0].$validator ===
                            'pattern'
                          : false
                      "
                    >
                      {{ $t('global.form.invalidFormat') }}
                    </template>
                    <template
                      v-if="
                        v$.form.manual.time.$errors.length > 0
                          ? v$.form.manual.time.$errors[0].$validator ===
                            'required'
                          : false
                      "
                    >
                      {{ $t('global.form.fieldRequired') }}
                    </template>
                  </BFormInvalidFeedback>
                </BInputGroup>
              </BFormGroup>
            </BCol>
          </BRow>
          <BFormRadio
            v-model="form.configurationSelected"
            value="ntp"
            data-test-id="dateTime-radio-configureNTP"
          >
            {{ $t('pageDateTime.staticNtp') }}
          </BFormRadio>
          <BRow class="mt-3 ms-3">
            <template v-for="(_server, index) in form.ntp.servers" :key="index">
              <BCol sm="6" lg="4" xl="3">
                <BFormGroup
                  :aria-label="`static-ntp-server-${index + 1}-form-group`"
                  :label="
                    $t('pageDateTime.form.ntpServers.server', {
                      number: index + 1,
                    })
                  "
                  :label-for="`input-ntp-${index + 1}`"
                >
                  <BInputGroup
                    :aria-label="`static-ntp-server-${index + 1}-input-group`"
                  >
                    <BFormInput
                      :id="`input-ntp-${index + 1}`"
                      v-model="form.ntp.servers[index]"
                      :state="getValidationState(v$.form.ntp.servers[index])"
                      :disabled="manualOptionSelected"
                      :data-test-id="`dateTime-input-ntpServer${index + 1}`"
                      @blur="v$.form.ntp.servers[index].$touch()"
                    />
                    <BFormInvalidFeedback role="alert">
                      <template
                        v-if="
                          v$.form.ntp.servers[index].$errors.length > 0 &&
                          v$.form.ntp.servers[index].$errors[0].$validator ===
                            'required'
                        "
                      >
                        {{ $t('global.form.fieldRequired') }}
                      </template>
                      <template
                        v-else-if="
                          v$.form.ntp.servers[index].$errors.length > 0 &&
                          v$.form.ntp.servers[index].$errors[0].$validator ===
                            'isDuplicate'
                        "
                      >
                        {{ $t('pageDateTime.form.validators.serverExists') }}
                      </template>
                    </BFormInvalidFeedback>
                  </BInputGroup>
                </BFormGroup>
              </BCol>
              <div
                v-if="
                  (index + 1) % 3 === 0 && index < form.ntp.servers.length - 1
                "
                class="w-100 d-none d-lg-block"
              ></div>
            </template>
            <BCol sm="6" lg="4" xl="3" class="d-flex flex-column mb-3">
              <span class="form-label invisible" aria-hidden="true">
                &nbsp;
              </span>
              <BButton
                variant="secondary"
                class="add-ntp-server-button align-self-start"
                :disabled="manualOptionSelected"
                data-test-id="dateTime-button-addNtpServer"
                @click="addNtpServer"
              >
                <icon-add />
                {{ $t('pageDateTime.form.ntpServers.add') }}
              </BButton>
            </BCol>
          </BRow>
          <BButton
            variant="primary"
            type="submit"
            data-test-id="dateTime-button-saveSettings"
          >
            {{ $t('global.action.save') }}
          </BButton>
        </BFormGroup>
      </BForm>
    </page-section>
  </BContainer>
</template>

<script setup>
import { ref, onMounted, watch, computed, getCurrentInstance } from 'vue';
import Alert from '@/components/Global/Alert.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import IconAdd from '@carbon/icons-vue/es/add--alt/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useLocalTimezoneLabelComposable from '@/components/Composables/useLocalTimezoneLabelComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import stores from '@/store';
import eventBus from '@/eventBus';
import { helpers, requiredIf } from '@vuelidate/validators';
import UserManagementStore from '../../../store/modules/SecurityAndAccess/UserManagementStore';
import { useDateTime } from '@/api/composables/useDateTime';

const { proxy } = getCurrentInstance();
const { startLoader, endLoader } = useLoadingBar();
const userManagementStore = UserManagementStore();
const { getValidationState } = useVuelidateComposable();
const { localOffset } = useLocalTimezoneLabelComposable();

const formatDate = proxy.$filters.formatDate;
const formatTime = proxy.$filters.formatTime;

const notSameAs = (value1, value2) => {
  return value2 ? value1 !== value2 : true;
};
const globalStore = stores.GlobalStore();

// Use the new composable instead of Vuex store
const {
  ntpServers: ntpServersFromQuery,
  isNtpProtocolEnabled: isNtpProtocolEnabledFromQuery,
  networkSuppliedServers: networkSuppliedServersFromQuery,
  isFetching: isDateTimeFetching,
  isError: isDateTimeError,
  updateDateTime: updateDateTimeAction,
} = useDateTime();

// 1120-vue3 waited for getBmcTime() + getNtpData() + getAccountSettings().
// Track the Vuex side-calls as an extra loading flag and combine with the
// NTP query isFetching so the bar ends only after all three settle.
const isExtraLoading = ref(true);
const isPageFetching = computed(
  () => isDateTimeFetching.value || isExtraLoading.value,
);

const MIN_NTP_INPUTS = 3;
const isoDateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
const isoTimeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const globalMfaValue = computed({
  get() {
    return userManagementStore.isGlobalMfaEnabledGetter;
  },
  set(newValue) {
    return newValue;
  },
});

const manualDate = ref('');
const form = ref({
  configurationSelected: '',
  manual: {
    date: '',
    time: '',
  },
  ntp: { servers: ['', '', ''] },
});
const loading = ref('');
const showDhcpNtpServers = ref(false);
const showNtpAlert = ref(false);
const isSaving = ref(false);

usePageLoadingBar(isPageFetching, isDateTimeError);

onMounted(() => {
  Promise.all([
    globalStore.getBmcTime(),
    userManagementStore.getAccountSettings(),
  ]).finally(() => {
    isExtraLoading.value = false;
    showCollapse();
    setInitialNtpValues();
  });
});

const ntpServers = computed(() => {
  return ntpServersFromQuery.value;
});
const isNtpProtocolEnabled = computed(() => {
  return isNtpProtocolEnabledFromQuery.value;
});
const networkSuppliedServers = computed(() => {
  return networkSuppliedServersFromQuery.value;
});
const bmcTime = computed(() => {
  return globalStore.bmcTimeGetter;
});
const ntpOptionSelected = computed(() => {
  return form.value.configurationSelected === 'ntp';
});
const manualOptionSelected = computed(() => {
  return form.value.configurationSelected === 'manual';
});
const isUtcDisplay = computed(() => {
  return globalStore.isUtcDisplayGetter;
});
const timezone = computed(() => {
  if (isUtcDisplay.value) {
    return 'UTC';
  }
  return localOffset();
});
const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});
const chunkedDhcpNtp = computed(() => {
  const chunkSize = 3;
  const result = [];
  const servers = networkSuppliedServers.value;
  for (let i = 0; i < servers.length; i += chunkSize) {
    result.push(servers.slice(i, i + chunkSize));
  }
  return result;
});
const rules = computed(() => ({
  form: {
    manual: {
      date: {
        required: requiredIf(function () {
          return form.value.configurationSelected === 'manual';
        }),
        pattern: helpers.regex(isoDateRegex),
      },
      time: {
        required: requiredIf(function () {
          return form.value.configurationSelected === 'manual';
        }),
        pattern: helpers.regex(isoTimeRegex),
      },
    },
    ntp: {
      servers: form.value.ntp.servers.reduce((serverRules, _server, index) => {
        serverRules[index] =
          index === 0
            ? {
                required: requiredIf(function () {
                  return form.value.configurationSelected === 'ntp';
                }),
              }
            : {
                isDuplicate: (value) =>
                  form.value.ntp.servers
                    .slice(0, index)
                    .every((previous) => notSameAs(previous, value)),
              };
        return serverRules;
      }, {}),
    },
  },
}));
const v$ = useVuelidate(rules, { form });

watch(ntpServers, () => {
  if (isSaving.value) return;
  setInitialNtpValues();
});
watch(isNtpProtocolEnabled, () => {
  if (isSaving.value) return;
  setInitialNtpValues();
});
watch(manualDate, () => {
  emitChange();
});
watch(bmcTime, () => {
  form.value.manual.date = formatDate(globalStore.bmcTimeGetter);
  form.value.manual.time = formatTime(globalStore.bmcTimeGetter).slice(0, 5);
});

watch(
  () => form.value.configurationSelected,
  (newValue, oldValue) => {
    // Show alert when switching to NTP (from manual, not from initial empty state)
    if (newValue === 'ntp' && oldValue !== '') {
      showNtpAlert.value = true;
    } else if (newValue === 'manual') {
      showNtpAlert.value = false;
    }
  },
);

const isServerOff = () => {
  return serverStatus.value === 'off' ? true : false;
};
const emitChange = () => {
  if (v$.value.$invalid) return;
  v$.value.$reset(); //reset to re-validate on blur
  eventBus.emit('change', {
    manualDate: manualDate.value ? new Date(manualDate.value) : null,
  });
};
const setInitialNtpValues = () => {
  form.value.configurationSelected = isNtpProtocolEnabled.value
    ? 'ntp'
    : 'manual';
  // Set showNtpAlert to true if NTP is enabled initially
  showNtpAlert.value = isNtpProtocolEnabled.value;
  setNtpValues();
};
const setNtpValues = (savedServers = ntpServers.value) => {
  const servers = [...savedServers];
  while (servers.length < MIN_NTP_INPUTS) servers.push('');
  form.value.ntp.servers = servers;
};
const addNtpServer = () => {
  form.value.ntp.servers.push('');
};
const submitForm = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  startLoader();
  isSaving.value = true;

  let dateTimeForm = {};
  let isNTPEnabled = form.value.configurationSelected === 'ntp';

  if (!isNTPEnabled) {
    const isUtcDisplay = globalStore.isUtcDisplayGetter;
    let date;

    dateTimeForm.ntpProtocolEnabled = false;

    if (isUtcDisplay) {
      // Create UTC Date
      date = getUtcDate(form.value.manual.date, form.value.manual.time);
    } else {
      // Create local Date
      date = new Date(`${form.value.manual.date} ${form.value.manual.time}`);
    }

    dateTimeForm.updatedDateTime = date.toISOString();
  } else {
    dateTimeForm.ntpProtocolEnabled = true;

    // Filter out empty strings,
    // per Redfish spec there should be no empty strings or null on the ntp array.
    const ntpArrayFiltered = form.value.ntp.servers.filter((x) => x);

    dateTimeForm.ntpServersArray = [...ntpArrayFiltered];
  }

  updateDateTimeAction(dateTimeForm)
    .then(() => {
      if (!isNTPEnabled) {
        isSaving.value = false;
        globalStore.getBmcTime();
        v$.value.form.$reset();
        endLoader();
      } else {
        setTimeout(() => {
          setNtpValues(dateTimeForm.ntpServersArray);
          isSaving.value = false;
          globalStore.getBmcTime();
          endLoader();
        }, 20000);
      }
    })
    .catch(() => {
      isSaving.value = false;
      setInitialNtpValues();
      v$.value.form.$reset();
      endLoader();
    });
};

const getUtcDate = (date, time) => {
  // Split user input string values to create
  // a UTC Date object
  const datesArray = date.split('-');
  const timeArray = time.split(':');
  let utcDate = Date.UTC(
    parseInt(datesArray[0]), // User input year
    //UTC expects zero-index month value 0-11 (January-December)
    //for reference https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC#Parameters
    parseInt(datesArray[1]) - 1, // User input month
    parseInt(datesArray[2]), // User input day
    parseInt(timeArray[0]), // User input hour
    parseInt(timeArray[1]), // User input minute
  );
  return new Date(utcDate);
};
const showCollapse = () => {
  showDhcpNtpServers.value = networkSuppliedServers.value.length > 0;
};
</script>

<style lang="scss" scoped>
.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
}
.add-ntp-server-button {
  margin-top: -3px;
  margin-bottom: 14px;
}
.infoToolTipClass {
  margin-left: 2px !important;
  margin-top: 2px !important;
}
.custom-form-group::placeholder {
  color: black !important;
}
.no-underline-link {
  :deep(a) {
    // For accessiblity compliance
    color: #084298;
    text-decoration: none;
    &:hover {
      text-decoration: underline;
      // For accessiblity compliance
      color: #062c62;
    }
  }
}
</style>
