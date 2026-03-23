<template>
  <overview-card
    :title="$t('pageOverview.firmwareInformation')"
    :to="`/operations/firmware`"
  >
    <BRow class="mt-3">
      <BCol sm="5">
        <dl>
          <dt>{{ $t('pageOverview.runningVersion') }}</dt>
          <dd>{{ dataFormatter(runningVersion) }}</dd>
          <dt>{{ $t('pageOverview.backupVersion') }}</dt>
          <dd>{{ dataFormatter(backupVersion) }}</dd>
        </dl>
      </BCol>
      <BCol sm="7">
        <dl>
          <dt>{{ $t('pageOverview.accessKeyExpiration') }}</dt>
          <dd>
            {{ $filters.formatDate(firmwareAccessKeyInfo.expirationDate) }}
          </dd>
        </dl>
      </BCol>
    </BRow>
  </overview-card>
</template>

<script setup>
import OverviewCard from './OverviewCard.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import {
  useOverviewFirmware,
  useOverviewLicense,
} from '@/api/composables/useOverview';

const { dataFormatter } = useDataFormatterGlobal();

// Use VueQuery composables
const { runningVersion, backupVersion } = useOverviewFirmware();
const { firmwareAccessKeyInfo } = useOverviewLicense();
</script>
