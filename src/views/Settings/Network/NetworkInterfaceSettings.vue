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
                id="useDomainNameSwitch"
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
                id="useDnsSwitch"
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
                id="useNtpSwitch"
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
import useToast from '@/components/Composables/useToastComposable';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import PageSection from '@/components/Global/PageSection.vue';
import stores from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { successToast, errorToast } = useToast();
const { dataFormatter } = useDataFormatterGlobal();

const networkStore = stores.NetworkStore();

const props = defineProps({
  tabIndex: {
    type: Number,
    default: 0,
  },
});

const selectedInterface = ref('');
const macAddress = ref('');

onBeforeMount(() => {
  getSettings();
});

const isDisabled = computed(() => {
  return networkStore.isTableBusyGetter;
});

const network = computed(() => {
  return networkStore.networkSettingsGetter;
});

const dhcpState = computed(() => {
  const ipv4Dhcp =
    networkStore.networkSettingsGetter[selectedInterface.value].dhcpEnabled;
  const ipv6Dhcp =
    networkStore.networkSettingsGetter[selectedInterface.value]
      .ipv6OperatingMode === 'Enabled'
      ? true
      : false;
  return ipv4Dhcp || ipv6Dhcp ? true : false;
});

const useDomainNameState = computed({
  get() {
    return networkStore.networkSettingsGetter[selectedInterface.value]
      .useDomainNameEnabled;
  },
  set(newValue) {
    return newValue;
  },
});

const useDnsState = computed({
  get() {
    return networkStore.networkSettingsGetter[selectedInterface.value]
      .useDnsEnabled;
  },
  set(newValue) {
    return newValue;
  },
});

const useNtpState = computed({
  get() {
    return networkStore.networkSettingsGetter[selectedInterface.value]
      .useNtpEnabled;
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
  macAddress.value = network.value[selectedInterface.value].macAddress;
};

const changeDomainNameState = (state) => {
  networkStore
    .saveDomainNameState(state)
    .then((message) => {
      successToast(message);
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};

const changeDnsState = (state) => {
  networkStore
    .saveDnsState(state)
    .then((message) => {
      successToast(message);
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};

const changeNtpState = (state) => {
  networkStore
    .saveNtpState(state)
    .then((message) => {
      successToast(message);
      startLoader();
      setTimeout(() => {
        endLoader();
      }, 15000);
    })
    .catch(({ message }) => errorToast(message));
};
</script>
