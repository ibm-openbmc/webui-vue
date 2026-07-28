<template>
  <div>
    <page-section :section-title="$t('pageNetwork.interfaceSection')">
      <BRow>
        <BCol md="3">
          <dl class="text-nowrap">
            <dt>
              {{ $t('pageNetwork.macAddress') }}
            </dt>
            <dd>
              {{ dataFormatter(macAddress) }}
            </dd>
          </dl>
        </BCol>
      </BRow>
      <BRow class="mb-4">
        <BCol lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.useDomainName') }}</dt>
            <dd>
              <BFormCheckbox
                v-model="useDomainNameState"
                data-test-id="networkSettings-switch-useDomainName"
                switch
                :disabled="!dhcpState || isDisabled"
                @update:model-value="changeDomainNameState"
              >
                <span v-if="useDomainNameState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
        <BCol lg="2" md="6">
          <dl>
            <dt>{{ $t('pageNetwork.useDns') }}</dt>
            <dd>
              <BFormCheckbox
                v-model="useDnsState"
                data-test-id="networkSettings-switch-useDns"
                switch
                :disabled="!dhcpState || isDisabled"
                @update:model-value="changeDnsState"
              >
                <span v-if="useDnsState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
        <BCol md="3">
          <dl>
            <dt>{{ $t('pageNetwork.useNtp') }}</dt>
            <dd>
              <BFormCheckbox
                v-model="useNtpState"
                data-test-id="networkSettings-switch-useNtp"
                switch
                :disabled="!dhcpState || isDisabled"
                @update:model-value="changeNtpState"
              >
                <span v-if="useNtpState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
      </BRow>
    </page-section>
  </div>
</template>

<script setup>
import { computed, watch, ref } from 'vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import PageSection from '@/components/Global/PageSection.vue';
import { useNetwork } from '@/api/composables/useNetwork';

const { startLoader, endLoader } = useLoadingBar();
const { dataFormatter } = useDataFormatterGlobal();

const {
  networkSettings,
  isTableBusy,
  saveDomainNameState: saveDomainNameApi,
  saveDnsState: saveDnsApi,
  saveNtpState: saveNtpApi,
} = useNetwork();

const props = defineProps({
  tabIndex: {
    type: Number,
    default: 0,
  },
});

const macAddress = ref('');

const isDisabled = computed(() => isTableBusy.value);

const currentInterface = computed(() => {
  return networkSettings.value[props.tabIndex];
});

const dhcpState = computed(() => {
  const iface = currentInterface.value;
  if (!iface) return false;
  const ipv4Dhcp = iface.dhcpEnabled;
  const ipv6Dhcp = iface.ipv6OperatingMode === 'Enabled';
  return ipv4Dhcp || ipv6Dhcp;
});

const useDomainNameState = computed({
  get() {
    return currentInterface.value?.useDomainNameEnabled ?? false;
  },
  set(_newValue) {
    // controlled via changeDomainNameState
  },
});

const useDnsState = computed({
  get() {
    return currentInterface.value?.useDnsEnabled ?? false;
  },
  set(_newValue) {
    // controlled via changeDnsState
  },
});

const useNtpState = computed({
  get() {
    return currentInterface.value?.useNtpEnabled ?? false;
  },
  set(_newValue) {
    // controlled via changeNtpState
  },
});

watch(
  () => props.tabIndex,
  () => {
    macAddress.value = networkSettings.value[props.tabIndex]?.macAddress ?? '';
  },
  { immediate: true },
);

watch(networkSettings, () => {
  macAddress.value = networkSettings.value[props.tabIndex]?.macAddress ?? '';
});

const changeDomainNameState = (state) => {
  startLoader();
  saveDomainNameApi(state).finally(() => {
    setTimeout(() => endLoader(), 15000);
  });
};

const changeDnsState = (state) => {
  startLoader();
  saveDnsApi(state).finally(() => {
    setTimeout(() => endLoader(), 15000);
  });
};

const changeNtpState = (state) => {
  startLoader();
  saveNtpApi(state).finally(() => {
    setTimeout(() => endLoader(), 15000);
  });
};
</script>
