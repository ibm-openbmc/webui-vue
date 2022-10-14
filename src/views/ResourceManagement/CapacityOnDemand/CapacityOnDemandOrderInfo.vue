<template>
  <b-row>
    <b-col>
      <page-section :section-title="$t('pageCapacityOnDemand.orderInfo.title')">
        <p>
          {{ $t('pageCapacityOnDemand.orderInfo.description.message') }}
          <b-link to="/logs/dumps">
            {{ $t('pageCapacityOnDemand.orderInfo.description.link') }}
          </b-link>
        </p>
        <b-card bg-variant="light" border-variant="light" class="mb-4">
          <!-- System information -->
          <b-row class="mb-5">
            <b-col>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.systemInfo') }}
              </h3>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemType') }}
                <span class="font-weight-bold">
                  {{ systemInfo.model || '--' }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemSerialNumber') }}
                <span class="font-weight-bold">
                  {{ systemInfo.serialNumber || '--' }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemAnchor') }}
                <span class="font-weight-bold">
                  {{ systemAnchor || '--' }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemCodUniqueId') }}
                <span class="font-weight-bold">
                  {{ dataFormatter(apid) }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemCodPublicKey') }}:
                <span class="font-weight-bold">
                  {{ dataFormatter(systemCodPublicKey) }}
                </span>
              </p>
            </b-col>
          </b-row>

          <!-- Processor information -->
          <b-row class="mb-5">
            <b-col>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.processorInfo') }}
              </h3>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.previousActivated') }}
                <span class="font-weight-bold">
                  {{ processorPreviousActivated }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.processorResourceId') }}
                <span class="font-weight-bold">
                  {{ processorInfo.resourceId }}
                </span>
              </p>
              <p>
                {{
                  $t('pageCapacityOnDemand.orderInfo.processorSequenceNumber')
                }}

                <span class="font-weight-bold">
                  {{ processorInfo.sequenceNumber }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.processorsLicensed') }}
                <span class="font-weight-bold">
                  {{ dataFormatter(processorLicensed) }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.entryCheck') }}:
                <span class="font-weight-bold">
                  {{ processorEntryCheck }}
                </span>
              </p>
            </b-col>
          </b-row>

          <!-- Memory information -->
          <b-row class="mb-5">
            <b-col>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.memoryInfo') }}
              </h3>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.previousActivated') }}
                <span class="font-weight-bold">
                  {{ memoryPreviousActivated }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.memoryResourceId') }}
                <span class="font-weight-bold">
                  {{ memoryInfo.resourceId }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.memorySequenceNumber') }}

                <span class="font-weight-bold">
                  {{ memoryInfo.sequenceNumber }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.memoryLicensed') }}
                <span class="font-weight-bold">
                  {{ dataFormatter(memoryLicensed) }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.entryCheck') }}:
                <span class="font-weight-bold">
                  {{ memoryEntryCheck }}
                </span>
              </p>
            </b-col>
          </b-row>

          <b-row class="mb-5">
            <b-col>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.accessKeyInfo') }}
              </h3>
              <p>
                {{
                  $t(
                    'pageCapacityOnDemand.orderInfo.firmwareAccessKeyExpiration'
                  )
                }}
                <span v-if="hasLicenses" class="font-weight-bold">--</span>
                <span v-else class="font-weight-bold">
                  {{
                    dataFormatter(firmwareAccessKeyInfo.expirationDate)
                      | formatDate
                  }}
                </span>
              </p>
              <p>
                {{
                  $t('pageCapacityOnDemand.orderInfo.aixAccessKeyExpiration')
                }}
                <span v-if="hasLicenses" class="font-weight-bold">--</span>
                <span v-else class="font-weight-bold">
                  {{
                    dataFormatter(aixAccessKeyInfo.expirationDate) | formatDate
                  }}
                </span>
              </p>
            </b-col>
          </b-row>
        </b-card>
      </page-section>
    </b-col>
  </b-row>
</template>

<script>
import { mapGetters } from 'vuex';
import PageSection from '@/components/Global/PageSection';
import DataFormatterMixin from '@/components/Mixins/DataFormatterMixin';

export default {
  name: 'CapacityOnDemandOrderInfo',
  components: { PageSection },
  mixins: [DataFormatterMixin],
  computed: {
    ...mapGetters('licenses', [
      'licenses',
      'processorInfo',
      'memoryInfo',
      'firmwareAccessKeyInfo',
      'aixAccessKeyInfo',
    ]),
    hasLicenses() {
      // This logic checks to see if there are any licences in the store.
      // If there are none, the result is true, otherwise false.
      return !Object.keys(this.$store.getters['licenses/licenses']).length;
    },
    memoryPreviousActivated() {
      return this.licenses?.PermMem?.AuthDeviceNumber
        ? this.licenses?.PermMem?.AuthDeviceNumber
        : '0000';
    },
    processorPreviousActivated() {
      return this.licenses?.PermProcs?.AuthDeviceNumber
        ? this.licenses?.PermProcs?.AuthDeviceNumber
        : '0000';
    },
    processorEntryCheck() {
      return this.licenses?.PermProcs?.EntryCheck
        ? this.licenses?.PermProcs?.EntryCheck
        : 'XX';
    },
    memoryEntryCheck() {
      return this.licenses?.PermMem?.EntryCheck
        ? this.licenses?.PermMem?.EntryCheck
        : 'XX';
    },
    processorLicensed() {
      return this.licenses?.PermProcs?.MaxAuthorizedDevices;
    },
    apid() {
      return this.licenses?.APID?.SerialNumber;
    },
    systemCodPublicKey() {
      return this.licenses?.APPublicKey?.SerialNumber;
    },
    memoryLicensed() {
      return this.licenses?.PermMem?.MaxAuthorizedDevices;
    },
    systemInfo() {
      return this.$store.getters['system/systems']?.[0] || {};
    },
    systemAnchor() {
      return this.licenses?.SystemAnchor?.SerialNumber;
    },
  },
};
</script>
