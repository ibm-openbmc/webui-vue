<template>
  <page-section :section-title="$t('pageNetwork.networkSettings')">
    <BRow>
      <BCol md="3">
        <dl>
          <dt>
            {{ $t('pageNetwork.hostname') }}
            <BButton variant="link" class="p-1" @click="initSettingsModal()">
              <icon-edit :title="$t('pageNetwork.modal.editHostnameTitle')" />
            </BButton>
          </dt>
          <dd>{{ dataFormatter(hostname) }}</dd>
        </dl>
      </BCol>
    </BRow>
  </page-section>
</template>

<script setup>
import { computed } from 'vue';
import eventBus from '@/eventBus';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import IconEdit from '@carbon/icons-vue/es/edit/16';
import PageSection from '@/components/Global/PageSection.vue';
import { useNetwork } from '@/api/composables/useNetwork';

const { dataFormatter } = useDataFormatterGlobal();
const { networkSettings } = useNetwork();

const hostname = computed(() => {
  return networkSettings.value[0]?.hostname ?? '';
});

const initSettingsModal = () => {
  eventBus.emit('modal-hostname');
};
</script>
