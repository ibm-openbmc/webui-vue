<template>
  <overview-card
    :title="$t('pageOverview.serverInformation')"
    :to="`/hardware-status/inventory`"
  >
    <BRow class="mt-3">
      <BCol sm="6" lg="6">
        <dl>
          <dt>{{ $t('pageOverview.model') }}</dt>
          <dd>{{ dataFormatter(modelType) }}</dd>
          <dt>{{ $t('pageOverview.serialNumber') }}</dt>
          <dd>{{ dataFormatter(serialNumber) }}</dd>
          <dt>
            {{ $t('pageOverview.assetTag') }}
            <BButton variant="link" class="p-1" @click="initAssetTagModal()">
              <icon-edit :title="$t('pageOverview.modal.editAssetTag')" />
            </BButton>
          </dt>
          <dd>{{ dataFormatter(assetTag) }}</dd>
        </dl>
      </BCol>
      <BCol sm="6" lg="6">
        <dl>
          <dt>{{ $t('pageOverview.operatingMode') }}</dt>
          <dd v-if="operatingMode === 'Manual'">
            {{ $t('pageOverview.manual') }}
          </dd>
          <dd v-else-if="operatingMode === 'Normal'">
            {{ $t('pageOverview.normal') }}
          </dd>
          <div v-if="!isReadOnlyUser">
            <dt>{{ $t('pageOverview.serviceLogin') }}</dt>
            <dd>
              <status-icon :status="serviceLoginStatusIcon" />
              {{ dataFormatter(serviceLogin) }}
            </dd>
          </div>
        </dl>
      </BCol>
    </BRow>
    <modal-asset-tag v-modal="openModal" :tag="assetTagValue" />
  </overview-card>
</template>

<script setup>
import i18n from '@/i18n';
import { computed, ref, onBeforeMount, onBeforeUnmount } from 'vue';
import OverviewCard from './OverviewCard.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import IconEdit from '@carbon/icons-vue/es/edit/16';
import { onBeforeRouteLeave } from 'vue-router';
import stores from '@/store';
import eventBus from '@/eventBus';
import ModalAssetTag from './ModalAssetTag.vue';
import {
  useSystemInfo,
  useUpdateAssetTag,
} from '@/api/composables/useSystemInfo';

const { hideLoader } = useLoadingBar();
const { dataFormatter } = useDataFormatterGlobal();

const systemStore = stores.SystemStore();
const global = stores.GlobalStore();
const bootSettingsStore = stores.BootSettingsStore();

// Use VueQuery composables for system info and asset tag updates
const { assetTag, modelType, serialNumber } = useSystemInfo();
const { updateAssetTagAsync } = useUpdateAssetTag();

const openModal = ref(false);
const serviceLoginStatus = ref(null);

onBeforeRouteLeave(() => {
  hideLoader();
});

onBeforeMount(() => {
  eventBus.on('okAssetTag', okAssetTagHandler);

  Promise.all([
    global.getServiceLogin(),
    bootSettingsStore.fetchBiosAttributes(),
    bootSettingsStore.getBiosAttributes,
    systemStore.getSystem(),
  ]).finally(() => {
    eventBus.emit('overview-server-complete');
  });
});

onBeforeUnmount(() => {
  eventBus.off('okAssetTag', okAssetTagHandler);
});

const serviceLogin = computed(() => {
  const date = new Date(global.bmcTime);
  const expirationDate = new Date(global.expirationDate);
  const dateTimeStamp = date.getTime();
  const expirationDateTimeStamp = expirationDate.getTime();

  if (
    global?.acfInstalled &&
    expirationDateTimeStamp >= dateTimeStamp &&
    global?.isServiceLoginEnabled
  ) {
    setServiceLoginStatus(i18n.global.t('global.status.enabled'));
  } else {
    setServiceLoginStatus(i18n.global.t('global.status.disabled'));
  }
  return serviceLoginStatus.value;
});

const biosAttributes = computed(() => {
  return bootSettingsStore.getBiosAttributes;
});

const operatingMode = computed(() => {
  return biosAttributes.value?.pvm_system_operating_mode;
});

const assetTagValue = computed(() => {
  return assetTag.value || global.assetTag;
});

const isReadOnlyUser = computed(() => {
  return global.isReadOnlyUserGetter;
});

const serviceLoginStatusIcon = computed(() => {
  switch (serviceLoginStatus.value) {
    case i18n.global.t('global.status.enabled'):
      return 'success';
    case i18n.global.t('global.status.disabled'):
      return 'danger';
    default:
      return 'secondary';
  }
});

const setServiceLoginStatus = (value) => {
  serviceLoginStatus.value = value;
  return;
};

const initAssetTagModal = () => {
  openModal.value = true;
  eventBus.emit('openmodal-true');
};

const okAssetTagHandler = (value) => {
  saveAssetTag(value);
};

const saveAssetTag = async (modalFormData) => {
  try {
    await updateAssetTagAsync(modalFormData);
  } catch (error) {
    // Error toast is handled by the composable
  }
};
</script>
