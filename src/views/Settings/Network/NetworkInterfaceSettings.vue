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
import { ref, computed, watch, onBeforeMount } from 'vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import PageSection from '@/components/Global/PageSection.vue';
import { useNetwork } from '@/api/composables/useNetwork';

const { dataFormatter } = useDataFormatterGlobal();

const {
  networkSettings,
  isTableBusy,
  saveDomainNameState,
  saveDnsState,
  saveNtpState,
} = useNetwork();

const props = defineProps({
  tabIndex: {
    type: Number,
    default: 0,
  },
});

const selectedInterface = ref(0);
const macAddress = ref('');

onBeforeMount(() => {
  getSettings();
});

const isDisabled = computed(() => {
  return isTableBusy.value;
});

const network = computed(() => {
  return networkSettings.value;
});

const dhcpState = computed(() => {
  const currentInterface = network.value[selectedInterface.value];
  if (!currentInterface) return false;

  const ipv4Dhcp = currentInterface.dhcpEnabled;
  const ipv6Dhcp = currentInterface.ipv6OperatingMode === 'Enabled';
  return ipv4Dhcp || ipv6Dhcp;
});

const useDomainNameState = computed({
  get() {
    return (
      network.value[selectedInterface.value]?.useDomainNameEnabled || false
    );
  },
  set(newValue) {
    return newValue;
  },
});

const useDnsState = computed({
  get() {
    return network.value[selectedInterface.value]?.useDnsEnabled || false;
  },
  set(newValue) {
    return newValue;
  },
});

const useNtpState = computed({
  get() {
    return network.value[selectedInterface.value]?.useNtpEnabled || false;
  },
  set(newValue) {
    return newValue;
  },
});

watch(
  () => props.tabIndex,
  () => {
    getSettings();
  },
);

const getSettings = () => {
  selectedInterface.value = props.tabIndex;
  macAddress.value = network.value[selectedInterface.value]?.macAddress || '';
};

const changeDomainNameState = (state) => {
  saveDomainNameState(state);
};

const changeDnsState = (state) => {
  saveDnsState(state);
};

const changeNtpState = (state) => {
  saveNtpState(state);
};
</script>
