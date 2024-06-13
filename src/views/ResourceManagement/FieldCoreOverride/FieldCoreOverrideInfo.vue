<template>
  <b-row>
    <b-col xl="8">
      <page-section
        :section-title="$t('pageFieldCoreOverride.currentConfiguration')"
      >
        <b-card bg-variant="light" border-variant="light" class="mb-4">
          <p>
            {{ $t('pageFieldCoreOverride.totalInstalledCores') }}:
            {{ isUndefined(totalInstalledCores) ? '--' : totalInstalledCores }}
          </p>
          <p>
            {{ $t('pageFieldCoreOverride.licensedCores') }}:
            {{ isUndefined(licensedCores) ? '--' : licensedCores }}
          </p>
          <p class="mb-0">
            {{ $t('pageFieldCoreOverride.configuredCores') }}:
            {{ isFieldCoreOverrideEnabled ? configuredCores : '--' }}
            <info-tooltip
              v-if="isFieldCoreOverridePending"
              :title="$t('pageFieldCoreOverride.scheduledForNextReboot')"
            >
              <icon-time />
            </info-tooltip>
          </p>
        </b-card>
      </page-section>
    </b-col>
  </b-row>
</template>

<script>
import { mapGetters } from 'vuex';
import { isUndefined } from 'lodash';
import IconTime from '@carbon/icons-vue/es/time/16';

import PageSection from '@/components/Global/PageSection';
import InfoTooltip from '@/components/Global/InfoTooltip';

export default {
  name: 'FieldCoreOverrideInfo',
  components: { PageSection, IconTime, InfoTooltip },
  computed: {
    ...mapGetters({
      systems: 'system/systems',
      processorInfo: 'licenses/licenses',
      configuredCores: 'fieldCoreOverride/configuredCores',
      isFieldCoreOverrideEnabled: 'fieldCoreOverride/isEnabled',
      isFieldCoreOverridePending: 'fieldCoreOverride/isPending',
    }),
    totalInstalledCores() {
      return this.systems?.[0]?.processorSummaryCoreCount;
    },
    licensedCores() {
      return this.processorInfo?.PermProcs?.MaxAuthorizedDevices;
    },
  },
  methods: { isUndefined },
};
</script>
