<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.dateTime')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <span>
            {{ $t('pageDateTime.alert.message') }}
            <b-link to="/profile-settings">
              {{ $t('pageDateTime.alert.link') }}</b-link
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
          class="mt-3 ml-3"
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
                :disabled="true"
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
          <BRow class="mt-3 ml-3">
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
                    :state="getValidationState($v.form.manual.date)"
                    :disabled="ntpOptionSelected"
                    data-test-id="dateTime-input-manualDate"
                    class="form-control-with-button"
                    @blur="$v.form.manual.date.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    <div v-if="!$v.form.manual.date.pattern">
                      {{ $t('global.form.invalidFormat') }}
                    </div>
                    <div v-if="!$v.form.manual.date.required">
                      {{ $t('global.form.fieldRequired') }}
                    </div>
                  </BFormInvalidFeedback>
                  <BFormGroup
                    :label="$t('global.calendar.selectDate')"
                    label-for="input-date"
                    class="mr-3 my-0 w-100"
                  >
                    <BInputGroup>
                      <BFormInput
                        id="input-date"
                        v-model="form.manual.date"
                        type="date"
                        :disabled="ntpOptionSelected"
                        class="form-control-with-button mb-3 mb-md-0 carbon-date"
                      />
                    </BInputGroup>
                  </BFormGroup>
                  <!-- <b-form-datepicker
                    v-model="form.manual.date"
                    class="btn-datepicker btn-icon-only"
                    button-only
                    right
                    :hide-header="true"
                    :locale="locale"
                    :label-help="
                      $t('global.calendar.useCursorKeysToNavigateCalendarDates')
                    "
                    :title="$t('global.calendar.selectDate')"
                    :disabled="ntpOptionSelected"
                    button-variant="link"
                    aria-controls="input-manual-date"
                  >
                    <template #button-content>
                      <icon-calendar />
                      <span class="sr-only">
                        {{ $t('global.calendar.selectDate') }}
                      </span>
                    </template>
                  </b-form-datepicker> -->
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
                    :state="getValidationState($v.form.manual.time)"
                    :disabled="ntpOptionSelected"
                    data-test-id="dateTime-input-manualTime"
                    @blur="$v.form.manual.time.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    <div v-if="!$v.form.manual.time.pattern">
                      {{ $t('global.form.invalidFormat') }}
                    </div>
                    <div v-if="!$v.form.manual.time.required">
                      {{ $t('global.form.fieldRequired') }}
                    </div>
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
          <BRow class="mt-3 ml-3">
            <BCol sm="6" lg="4" xl="3">
              <BFormGroup
                :label="$t('pageDateTime.form.ntpServers.server1')"
                label-for="input-ntp-1"
              >
                <BInputGroup>
                  <BFormInput
                    id="input-ntp-1"
                    v-model="form.ntp.firstAddress"
                    :state="getValidationState($v.form.ntp.firstAddress)"
                    :disabled="manualOptionSelected"
                    data-test-id="dateTime-input-ntpServer1"
                    @blur="$v.form.ntp.firstAddress.$touch()"
                  />
                  <BFormInvalidFeedback role="alert">
                    <div v-if="!$v.form.ntp.firstAddress.required">
                      {{ $t('global.form.fieldRequired') }}
                    </div>
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
                    :state="getValidationState($v.form.ntp.secondAddress)"
                    :disabled="manualOptionSelected"
                    data-test-id="dateTime-input-ntpServer2"
                  />
                  <BFormInvalidFeedback role="alert">
                    <div v-if="!$v.form.ntp.secondAddress.isSameAsFirstAddress">
                      {{ $t('pageDateTime.form.validators.serverExists') }}
                    </div>
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
                    :state="getValidationState($v.form.ntp.thirdAddress)"
                    :disabled="manualOptionSelected"
                    data-test-id="dateTime-input-ntpServer3"
                  />
                  <BFormInvalidFeedback role="alert">
                    <div
                      v-if="
                        !$v.form.ntp.thirdAddress.isSameAsFirstAddress ||
                        !$v.form.ntp.thirdAddress.isSameAsSecondAddress
                      "
                    >
                      {{ $t('pageDateTime.form.validators.serverExists') }}
                    </div>
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
import { ref, onMounted, computed, onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';

import Alert from '@/components/Global/Alert.vue';
import IconChevron from '@carbon/icons-vue/es/chevron--up/20';
import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';

import useToastComposable from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import LocalTimezoneLabelMixin from '@/components/Mixins/LocalTimezoneLabelMixin';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import InfoTooltip from '@/components/Global/InfoTooltip';

import { requiredIf, helpers, sameAs, not } from 'vuelidate/lib/validators';

onBeforeRouteLeave(() => {
  hideLoader();
});

const isoDateRegex = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
const isoTimeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const Toast = useToastComposable();
const { startLoader, hideLoader, endLoader } = useLoadingBar();
const { getValidationState } = useVuelidateComposable();


const locale = ref(this.$store.getters['global/languagePreference']);
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

  // validations() {
  //   return {
  //     form: {
  //       manual: {
  //         date: {
  //           required: requiredIf(function () {
  //             return this.form.configurationSelected === 'manual';
  //           }),
  //           pattern: helpers.regex('pattern', isoDateRegex),
  //         },
  //         time: {
  //           required: requiredIf(function () {
  //             return this.form.configurationSelected === 'manual';
  //           }),
  //           pattern: helpers.regex('pattern', isoTimeRegex),
  //         },
  //       },
  //       ntp: {
  //         firstAddress: {
  //           required: requiredIf(function () {
  //             return this.form.configurationSelected === 'ntp';
  //           }),
  //         },
  //         secondAddress: {
  //           isSameAsFirstAddress: not(sameAs('firstAddress')),
  //         },
  //         thirdAddress: {
  //           isSameAsFirstAddress: not(sameAs('firstAddress')),
  //           isSameAsSecondAddress: not(sameAs('secondAddress')),
  //         },
  //       },
  //     },
  //   };
  // }


  // computed: {
  //   ...mapState('dateTime', [
  //     'ntpServers',
  //     'isNtpProtocolEnabled',
  //     'networkSuppliedServers',
  //   ]),
const dateTime = computed(() => {
  return ;
});
const ntpServers = computed(() => {
  return ;
});
const isNtpProtocolEnabled = computed(() => {
  return ;
});
const networkSuppliedServers = computed(() => {
    this.$store.getters['dateTime/networkSuppliedServers'].map((server) =>
    this.dhcpNtp.push(server)
  );
  return this.dhcpNtp;
});
const bmcTime = computed(() => {
  return this.$store.getters['global/bmcTime'];
});
const ntpOptionSelected = computed(() => {
  return this.form.configurationSelected === 'ntp';
});
const manualOptionSelected = computed(() => {
  return this.form.configurationSelected === 'manual';
});
const isUtcDisplay = computed(() => {
  return this.$store.getters['global/isUtcDisplay'];
});
const timezone = computed(() => {
  if (this.isUtcDisplay) {
    return 'UTC';
  }
  return this.localOffset();
});
const serverStatus = computed(() => {
  return this.$store.getters['global/serverStatus'];
});
const chunkedDhcpNtp = computed(() => {
  const chunkSize = 3;
  const result = [];
  for (let i = 0; i < this.dhcpNtp.length; i += chunkSize) {
    result.push(this.dhcpNtp.slice(i, i + chunkSize));
  }
  return result;
});

  watch(ntpServers, () => {
    this.setInitialNtpValues();
  })
  watch(manualDate, () => {
    this.emitChange();
  })
  watch(bmcTime, () => {
      this.form.manual.date = this.$options.filters.formatDate(
        this.$store.getters['global/bmcTime']
      );
      this.form.manual.time = this.$options.filters
        .formatTime(this.$store.getters['global/bmcTime'])
        .slice(0, 5);    
  })
  
  onMounted(() => {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('global/getBmcTime'),
      this.$store.dispatch('dateTime/getNtpData'),
    ]).finally(() => {
      this.showCollapse();
      this.setInitialNtpValues();
      this.endLoader();
    });
  })
    const isServerOff = () => {
      return this.serverStatus === 'off' ? true : false;
    }
    const emitChange = () => {
      if (this.$v.$invalid) return;
      this.$v.$reset(); //reset to re-validate on blur
      this.$emit('change', {
        manualDate: this.manualDate ? new Date(this.manualDate) : null,
      });
    }
    const setInitialNtpValues = () => {
      this.form.configurationSelected = this.isNtpProtocolEnabled
        ? 'ntp'
        : 'manual';
      this.setNtpValues();
    }
    const setNtpValues = () => {
      [
        this.form.ntp.firstAddress = '',
        this.form.ntp.secondAddress = '',
        this.form.ntp.thirdAddress = '',
      ] = [this.ntpServers[0], this.ntpServers[1], this.ntpServers[2]];
    }
    const submitForm = () => {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.startLoader();

      let dateTimeForm = {};
      let isNTPEnabled = this.form.configurationSelected === 'ntp';

      if (!isNTPEnabled) {
        const isUtcDisplay = this.$store.getters['global/isUtcDisplay'];
        let date;

        dateTimeForm.ntpProtocolEnabled = false;

        if (isUtcDisplay) {
          // Create UTC Date
          date = this.getUtcDate(this.form.manual.date, this.form.manual.time);
        } else {
          // Create local Date
          date = new Date(`${this.form.manual.date} ${this.form.manual.time}`);
        }

        dateTimeForm.updatedDateTime = date.toISOString();
      } else {
        dateTimeForm.ntpProtocolEnabled = true;

        const ntpArray = [
          this.form.ntp.firstAddress,
          this.form.ntp.secondAddress,
          this.form.ntp.thirdAddress,
        ];

        // Filter the ntpArray to remove empty strings,
        // per Redfish spec there should be no empty strings or null on the ntp array.
        const ntpArrayFiltered = ntpArray.filter((x) => x);

        dateTimeForm.ntpServersArray = [...ntpArrayFiltered];

        [this.ntpServers[0], this.ntpServers[1], this.ntpServers[2]] = [
          ...dateTimeForm.ntpServersArray,
        ];
        this.setNtpValues();
      }

      this.$store
        .dispatch('dateTime/updateDateTime', dateTimeForm)
        .then((success) => {
          this.successToast(success);
          if (!isNTPEnabled) return;
          // Shift address up if second address is empty
          // to avoid refreshing after delay when updating NTP
          if (!this.form.ntp.secondAddress && this.form.ntp.thirdAddres) {
            this.form.ntp.secondAddress = this.form.ntp.thirdAddres;
            this.form.ntp.thirdAddress = '';
          }
        })
        .then(() => {
          if (!isNTPEnabled) {
            this.$store.dispatch('global/getBmcTime');
            this.$v.form.$reset();
            this.endLoader();
          } else {
            this.startLoader();
            setTimeout(() => {
              this.$store.dispatch('global/getBmcTime');
              this.endLoader();
            }, 20000);
          }
        })
        .catch(({ message }) => {
          this.errorToast(message);
          this.$v.form.$reset();
          this.endLoader();
        });
    }
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
        timeArray[1] // User input minute
      );
      return new Date(utcDate);
    }
    const showCollapse = () => {
      if (this.networkSuppliedServers.length == 0) {
        this.showDhcpNtpServers = false;
      } else {
        this.showDhcpNtpServers = true;
      }
    }
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
</style>
