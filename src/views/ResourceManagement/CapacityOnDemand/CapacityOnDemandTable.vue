<template>
  <b-row>
    <b-col>
      <page-section :section-title="$t('pageCapacityOnDemand.vetCapabilities')">
        <b-table
          show-empty
          hover
          :no-border-collapse="true"
          :items="items"
          :fields="fields"
          :empty-text="$t('global.table.emptyMessage')"
        >
          <template #cell(settings)="{ value }">
            <div v-if="value == 'AIX allowed'">
              {{ $t('pageCapacityOnDemand.setting.aixAllowed') }}
            </div>
            <div v-else-if="value == 'AIX Diagnostics'">
              {{ $t('pageCapacityOnDemand.setting.aixDiagnostics') }}
            </div>
            <div v-else-if="value == 'AIX Update Access Key'">
              {{ $t('pageCapacityOnDemand.setting.aixUpdateAccessKey') }}
            </div>
            <div v-else-if="value == 'Asset Protection Machine ID'">
              {{ $t('pageCapacityOnDemand.setting.assetProtectionMachineID') }}
            </div>
            <div v-else-if="value == 'Asset Protection Public Key'">
              {{ $t('pageCapacityOnDemand.setting.assetProtectionPublicKey') }}
            </div>
            <div v-else-if="value == 'Active memory expansion'">
              {{ $t('pageCapacityOnDemand.setting.activeMemoryExpansion') }}
            </div>
            <div v-else-if="value == 'Active memory mirroring'">
              {{ $t('pageCapacityOnDemand.setting.activeMemoryMirroring') }}
            </div>
            <div v-else-if="value == 'CAPI'">
              {{ $t('pageCapacityOnDemand.setting.capi') }}
            </div>
            <div v-else-if="value == 'Elastic MemoryGB*Days Available'">
              {{ $t('pageCapacityOnDemand.setting.elasticMemoryGBAvailable') }}
            </div>
            <div v-else-if="value == 'Elastic Processor*Days Available'">
              {{ $t('pageCapacityOnDemand.setting.elasticProcessorAvailable') }}
            </div>
            <div v-else-if="value == 'IBMi 100% interactive capacity'">
              {{ $t('pageCapacityOnDemand.setting.interactiveCapacity') }}
            </div>
            <div v-else-if="value == 'IBMi partitions allowed'">
              {{ $t('pageCapacityOnDemand.setting.ibmiPartitions') }}
            </div>
            <div v-else-if="value == 'IBMi permitted to use native I/O'">
              {{ $t('pageCapacityOnDemand.setting.inmiPermitted') }}
            </div>
            <div v-else-if="value == 'LPAR creation allowed'">
              {{ $t('pageCapacityOnDemand.setting.lparCreationAllowed') }}
            </div>
            <div v-else-if="value == 'Live partition mobility'">
              {{ $t('pageCapacityOnDemand.setting.livePartitionMobility') }}
            </div>
            <div
              v-else-if="value == 'Greater than 128 processors per partition'"
            >
              {{ $t('pageCapacityOnDemand.setting.perPartition') }}
            </div>
            <div v-else-if="value == 'P05 Virtual Tier'">
              {{ $t('pageCapacityOnDemand.setting.p05VirtualTier') }}
            </div>
            <div v-else-if="value == 'P10 Virtual Tier'">
              {{ $t('pageCapacityOnDemand.setting.p10VirtualTier') }}
            </div>
            <div v-else-if="value == 'P20 Virtual Tier'">
              {{ $t('pageCapacityOnDemand.setting.p20VirtualTier') }}
            </div>
            <div v-else-if="value == 'P30 Virtual Tier'">
              {{ $t('pageCapacityOnDemand.setting.p30VirtualTier') }}
            </div>
            <div v-else-if="value == 'Permanent Memory Licenses (GB)'">
              {{ $t('pageCapacityOnDemand.setting.permanentMemoryLicenses') }}
            </div>
            <div v-else-if="value == 'Permanent Processor Licenses'">
              {{
                $t('pageCapacityOnDemand.setting.permanentProcessorLicenses')
              }}
            </div>
            <div v-else-if="value == 'Subprocessor partitioning'">
              {{ $t('pageCapacityOnDemand.setting.subprocessorPartitioning') }}
            </div>
            <div v-else-if="value == 'Trial Memory Licenses (GB)'">
              {{ $t('pageCapacityOnDemand.setting.trialMemoryLicenses') }}
            </div>
            <div v-else-if="value == 'Trial Processor Licenses'">
              {{ $t('pageCapacityOnDemand.setting.trialProcessorLicenses') }}
            </div>
            <div v-else-if="value == 'Firmware Update Access Key'">
              {{ $t('pageCapacityOnDemand.setting.firmwareUpdateAccessKey') }}
            </div>
            <div v-else-if="value == 'Virtualization Engine Technology'">
              {{
                $t(
                  'pageCapacityOnDemand.setting.virtualizationEngineTechnology',
                )
              }}
            </div>
            <div v-else-if="value == 'Virtual I/O server capable'">
              {{ $t('pageCapacityOnDemand.setting.virtualIoServer') }}
            </div>
            <div v-else-if="value == 'Virtual tiers allowed'">
              {{ $t('pageCapacityOnDemand.setting.virtualTiersAllowed') }}
            </div>
            <div v-else>{{ value }}</div>
          </template>
          <!-- Status column -->
          <template #cell(status)="{ value }">
            <status-icon v-if="value" :status="statusIcon(value)" /><span
              v-if="value == 'Enabled'"
              >{{ $t('pageCapacityOnDemand.enabled') }}</span
            >
            <span v-else-if="value == 'Disabled'">{{
              $t('pageCapacityOnDemand.disabled')
            }}</span>
            <span v-else-if="value == 'StandbyOffline'">{{
              $t('pageCapacityOnDemand.standbyOffline')
            }}</span>
            <span v-else-if="value == 'StandbySpare'">{{
              $t('pageCapacityOnDemand.standbySpare')
            }}</span>
            <span v-else-if="value == 'InTest'">{{
              $t('pageCapacityOnDemand.inTest')
            }}</span>
            <span v-else-if="value == 'Starting'">{{
              $t('pageCapacityOnDemand.starting')
            }}</span>
            <span v-else-if="value == 'Absent'">{{
              $t('pageCapacityOnDemand.absent')
            }}</span>
            <span v-else-if="value == 'UnavailableOffline'">{{
              $t('pageCapacityOnDemand.unavailableOffline')
            }}</span>
            <span v-else-if="value == 'Deferring'">{{
              $t('pageCapacityOnDemand.deferring')
            }}</span>
            <span v-else-if="value == 'Quiesced'">{{
              $t('pageCapacityOnDemand.quiesced')
            }}</span>
            <span v-else-if="value == 'Updating'">{{
              $t('pageCapacityOnDemand.updating')
            }}</span>
            <span v-else-if="value == 'Qualified'">{{
              $t('pageCapacityOnDemand.qualified')
            }}</span>
          </template>
        </b-table>
      </page-section>
    </b-col>
  </b-row>
</template>

<script>
import { forOwn } from 'lodash';
import PageSection from '@/components/Global/PageSection';
import StatusIcon from '@/components/Global/StatusIcon';

export default {
  name: 'CapacityOnDemandTable',
  components: { PageSection, StatusIcon },
  data() {
    return {
      fields: [
        {
          key: 'settings',
          label: this.$t('pageCapacityOnDemand.table.setting'),
        },
        {
          key: 'status',
          label: this.$t('pageCapacityOnDemand.table.bitCapabilityStatus'),
        },
      ],
    };
  },
  computed: {
    items() {
      const vetCapabilities = this.$store.getters['licenses/vetCapabilities'];

      const items = [];

      forOwn(vetCapabilities, (license) => {
        items.push({
          settings: license.Name,
          status: license.Status?.State,
        });
      });

      return items;
    },
  },
  methods: {
    statusIcon(value) {
      if (value === 'Enabled') {
        return 'success';
      } else if (value === 'Disabled') {
        return 'danger';
      } else {
        return 'secondary';
      }
    },
  },
};
</script>
