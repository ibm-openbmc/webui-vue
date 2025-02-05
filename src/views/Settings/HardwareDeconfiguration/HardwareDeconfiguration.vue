<template>
  <BContainer fluid="xl">
    <page-title
      :title="$t('appPageTitle.deconfigurationHardware')"
      :description="$t('pageDeconfigurationHardware.description')"
      :link="$t('pageDeconfigurationHardware.link')"
      to="/logs/deconfiguration-records"
    />
    <BRow>
      <BCol md="8" xl="6">
        <alert variant="info" class="mb-4">
          <div>
            {{ $t('pageDeconfigurationHardware.alert.message') }}
          </div>
        </alert>
      </BCol>
    </BRow>
    <page-section>
      <BRow>
        <BCol>
          <b-card no-body>
            <b-tabs content-class="mt-3" fill>
              <b-tab :title="$t('pageDeconfigurationHardware.memoryDimms')">
                <memory-dimms />
              </b-tab>
              <b-tab :title="$t('pageDeconfigurationHardware.processorCores')">
                <processor-cores />
              </b-tab>
            </b-tabs>
          </b-card>
        </BCol>
      </BRow>
    </page-section>
  </BContainer>
</template>

<script setup>
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import Alert from '@/components/Global/Alert.vue';
import ProcessorCores from './ProcessorCores.vue';
import MemoryDimms from './MemoryDimms.vue';
import { onBeforeMount } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
const { startLoader, hideLoader } = useLoadingBar();

onBeforeRouteLeave(() => {
  hideLoader();
});
onBeforeMount(() =>  {
  startLoader();
});

</script>
