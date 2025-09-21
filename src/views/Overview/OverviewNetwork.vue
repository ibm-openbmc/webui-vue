<template>
  <overview-card
    v-if="network"
    :title="$t('pageOverview.networkInformation')"
    :to="`/settings/network`"
  >
    <BRow class="mt-3">
      <BCol sm="6">
        <dl>
          <dt>{{ $t('pageOverview.hostName') }}</dt>
          <dd>{{ dataFormatter(network.hostname) }}</dd>
        </dl>
      </BCol>
    </BRow>
    <BRow>
      <BCol>
        <dl>
          <dt>{{ $t('pageOverview.ipv4') }}</dt>
          <dd>
            {{ dataFormatter(network.staticAddress) }}
          </dd>
        </dl>
      </BCol>
      <BCol>
        <dl>
          <dt>{{ $t('pageOverview.dhcp') }}</dt>
          <dd>
            {{
              dataFormatter(
                network.dhcpAddress.length !== 0
                  ? network.dhcpAddress[0].Address
                  : null,
              )
            }}
          </dd>
        </dl>
      </BCol>
    </BRow>
  </overview-card>
</template>

<script setup>
import { computed, onBeforeMount } from 'vue';
import OverviewCard from './OverviewCard.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import stores from '@/store';
import eventBus from '@/eventBus';

const { dataFormatter } = useDataFormatterGlobal();

const networkStore = stores.NetworkStore();

onBeforeMount(() => {
  networkStore?.getEthernetData().finally(() => {
    eventBus.emit('overview-network-complete');
  });
});

const network = computed(() => {
  return networkStore.networkSettings[0];
});
</script>
