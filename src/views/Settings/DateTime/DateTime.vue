<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.dateTime')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <span class="no-underline-link">
            {{ $t('pageDateTime.alert.message') }}
            <BLink to="/profile-settings">
              {{ $t('pageDateTime.alert.link') }}</BLink
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
          <alert variant="info" class="mb-4">
            <span>
              {{ $t('pageDateTime.alert.messageNtp') }}
            </span>
          </alert>
        </BCol>
      </BRow>
      <BForm novalidate @submit.prevent="submitForm">
        <BFormGroup
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
                :label="$t('pageDateTime.form.date')"
                label-for="input-manual-date"
              >
                <BFormText id="date-format-help">{{
                  $t('global.calendar.dateFormat')
                }}</BFormText>
                <BInputGroup>
                  <BFormInput
                    id="input-manual-date"
                    v-model="form.manual.date"
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
                :label="$t('pageDateTime.form.time.timezone', { timezone })"
                label-for="input-manual-time"
              >
                <BFormText id="time-format-help">HH:MM</BFormText>
                <BInputGroup>
                  <BFormInput
                    id="input-manual-time"
                    v-model="form.manual.time"
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
            <BCol sm="6" lg="4" xl="3">
              <BFormGroup
                :label="$t('pageDateTime.form.ntpServers.server1')"
                label-for="input-ntp-1"
              >
                <BInputGroup>
                  <BFormInput
                    id="input-ntp-1"
                    v-model="form.ntp.firstAddress"
                    :state="getValidationState(v$.form.ntp.firstAddress)"
                    :disabled="manualOptionSelected"
                    data-test-id="dateTime-input-ntpServer1"
                    @blur="v$.form.ntp.firstAddress.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    <template
                      v-if="
                        v$.form.ntp.firstAddress.$errors.length > 0
                          ? v$.form.ntp.firstAddress.$errors[0].$validator ===
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
                :label="$t('pageDateTime.form.ntpServers.server2')"
                label-for="input-ntp-2"
              >
                <BInputGroup>
                  <BFormInput
                    id="input-ntp-2"
                    v-model="form.ntp.secondAddress"
                    :state="getValidationState(v$.form.ntp.secondAddress)"
                    :disabled="manualOptionSelected"
                    data-test-id="dateTime-input-ntpServer2"
                  />
                  <BFormInvalidFeedback role="alert">
                    <template
                      v-if="
                        v$.form.ntp.secondAddress.$errors.length > 0
                          ? v$.form.ntp.secondAddress.$errors[0].$validator ===
                            'isSameAsFirstAddress'
                          : false
                      "
                    >
                      {{ $t('pageDateTime.form.validators.serverExists') }}
                    </template>
                  </BFormInvalidFeedback>
                </BInputGroup>
              </BFormGroup>
            </BCol>
            <BCol sm="6" lg="4" xl="3">
              <BFormGroup
                :label="$t('pageDateTime.form.ntpServers.server3')"
                label-for="input-ntp-3"
              >
                <BInputGroup>
                  <BFormInput
                    id="input-ntp-3"
                    v-model="form.ntp.thirdAddress"
                    :state="getValidationState(v$.form.ntp.thirdAddress)"
                    :disabled="manualOptionSelected"
                    data-test-id="dateTime-input-ntpServer3"
                  />
                  <BFormInvalidFeedback role="alert">
                    <template
                      v-if="
                        v$.form.ntp.thirdAddress.$errors.length > 0
                          ? v$.form.ntp.thirdAddress.$errors[0].$validator ===
                              'isSameAsFirstAddress' ||
                            v$.form.ntp.thirdAddress.$errors[0].$validator ===
                              'isSameAsSecondAddress'
                          : false
                      "
                    >
                      {{ $t('pageDateTime.form.validators.serverExists') }}
                    </template>
                  </BFormInvalidFeedback>
                </BInputGroup>
              </BFormGroup>
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
import {
  ref,
  onMounted,
  watch,
  computed,
  onBeforeMount,
  getCurrentInstance,
} from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import Alert from '@/components/Global/Alert.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useLocalTimezoneLabelComposable from '@/components/Composables/useLocalTimezoneLabelComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import InfoTooltip from '@/components/Global/InfoTooltip.vue';
import stores from '@/store';
import eventBus from '@/eventBus';
import {
  required,
  helpers,
  requiredIf,
  sameAs,
  not,
} from '@vuelidate/validators';

const { proxy } = getCurrentInstance();
const { startLoader, hideLoader, endLoader } = useLoadingBar();
const { getValidationState } = useVuelidateComposable();
const { localOffset } = useLocalTimezoneLabelComposable();
const toast = useToastComposable();

const formatDate = proxy.$filters.formatDate;
const formatTime = proxy.$filters.formatTime;

const notSameAs = (value1, value2) => {
  return value2 ? value1 !== value2 : true;
};
const dateTimeStore = stores.DateTimeStore();
const globalStore = stores.GlobalStore();

const isoDateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
const isoTimeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const manualDate = ref('');
const locale = ref(globalStore.languagePreferenceGetter);
const form = ref({
  configurationSelected: '',
  manual: {
    date: '',
    time: '',
  },
  ntp: { firstAddress: '', secondAddress: '', thirdAddress: '' },
});
const loading = ref('');
const showDhcpNtpServers = ref(false);
const dhcpNtp = ref([]);

onBeforeRouteLeave(() => {
  hideLoader();
});

onMounted(() => {
  startLoader();
  Promise.all([globalStore.getBmcTime(), dateTimeStore.getNtpData()]).finally(
    () => {
      showCollapse();
      setInitialNtpValues();
      endLoader();
    },
  );
});

const ntpServers = computed(() => {
  return dateTimeStore.ntpServersGetter;
});
const isNtpProtocolEnabled = computed(() => {
  return dateTimeStore.isNtpProtocolEnabledGetter;
});
const networkSuppliedServers = computed(() => {
  dateTimeStore.networkSuppliedServersGetter.map((server) =>
    dhcpNtp.value.push(server),
  );
  return dhcpNtp.value;
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
  for (let i = 0; i < dhcpNtp.value.length; i += chunkSize) {
    result.push(dhcpNtp.value.slice(i, i + chunkSize));
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
      firstAddress: {
        required: requiredIf(function () {
          return form.value.configurationSelected === 'ntp';
        }),
      },
      secondAddress: {
        isSameAsFirstAddress: () =>
          notSameAs(form.value.ntp.firstAddress, form.value.ntp.secondAddress),
      },
      thirdAddress: {
        isSameAsFirstAddress: () =>
          notSameAs(form.value.ntp.firstAddress, form.value.ntp.thirdAddress),
        isSameAsSecondAddress: () =>
          notSameAs(form.value.ntp.secondAddress, form.value.ntp.thirdAddress),
      },
    },
  },
}));
const v$ = useVuelidate(rules, { form });

watch(ntpServers, () => {
  setInitialNtpValues();
});
watch(manualDate, () => {
  emitChange();
});
watch(bmcTime, () => {
  form.value.manual.date = formatDate(globalStore.bmcTimeGetter);
  form.value.manual.time = formatTime(globalStore.bmcTimeGetter).slice(0, 5);
});

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
  setNtpValues();
};
const setNtpValues = () => {
  [
    form.value.ntp.firstAddress = '',
    form.value.ntp.secondAddress = '',
    form.value.ntp.thirdAddress = '',
  ] = [ntpServers.value[0], ntpServers.value[1], ntpServers.value[2]];
};
const submitForm = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  startLoader();

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

    const ntpArray = [
      form.value.ntp.firstAddress,
      form.value.ntp.secondAddress,
      form.value.ntp.thirdAddress,
    ];

    // Filter the ntpArray to remove empty strings,
    // per Redfish spec there should be no empty strings or null on the ntp array.
    const ntpArrayFiltered = ntpArray.filter((x) => x);

    dateTimeForm.ntpServersArray = [...ntpArrayFiltered];

    [ntpServers.value[0], ntpServers.value[1], ntpServers.value[2]] = [
      ...dateTimeForm.ntpServersArray,
    ];
    setNtpValues();
  }

  dateTimeStore
    .updateDateTime(dateTimeForm)
    .then((success) => {
      toast.successToast(success);
      if (!isNTPEnabled) return;
      // Shift address up if second address is empty
      // to avoid refreshing after delay when updating NTP
      if (!form.value.ntp.secondAddress && form.value.ntp.thirdAddres) {
        form.value.ntp.secondAddress = form.value.ntp.thirdAddres;
        form.value.ntp.thirdAddress = '';
      }
    })
    .then(() => {
      if (!isNTPEnabled) {
        globalStore.getBmcTime();
        v$.value.form.$reset();
        endLoader();
      } else {
        startLoader();
        setTimeout(() => {
          globalStore.getBmcTime();
          endLoader();
        }, 20000);
      }
    })
    .catch(({ message }) => {
      toast.errorToast(message);
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
    datesArray[0], // User input year
    //UTC expects zero-index month value 0-11 (January-December)
    //for reference https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC#Parameters
    parseInt(datesArray[1]) - 1, // User input month
    datesArray[2], // User input day
    timeArray[0], // User input hour
    timeArray[1], // User input minute
  );
  return new Date(utcDate);
};
const showCollapse = () => {
  if (networkSuppliedServers.value.length == 0) {
    showDhcpNtpServers.value = false;
  } else {
    showDhcpNtpServers.value = true;
  }
};
</script>

<style lang="scss" scoped>
.btn.collapsed {
  svg {
    transform: rotate(180deg);
  }
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
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
