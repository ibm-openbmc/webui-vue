<template>
  <BRow>
    <BCol>
      <page-section :section-title="$t('pageCapacityOnDemand.orderInfo.title')">
        <p>
          {{ $t('pageCapacityOnDemand.orderInfo.description.message') }}
          <BLink to="/logs/dumps">
            {{ $t('pageCapacityOnDemand.orderInfo.description.link') }}
          </BLink>
        </p>
        <b-card bg-variant="light" border-variant="light" class="mb-4">
          <!-- System information -->
          <BRow class="mb-5">
            <BCol>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.systemInfo') }}
              </h3>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemType') }}
                <span class="fw-bold">
                  {{ systemInfo.model || '--' }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemSerialNumber') }}
                <span class="fw-bold">
                  {{ systemInfo.serialNumber || '--' }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemAnchor') }}
                <span class="fw-bold">
                  {{ systemAnchor || '--' }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemCodUniqueId') }}
                <span class="fw-bold">
                  {{ dataFormatter(apid) }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.systemCodPublicKey') }}:
                <span class="fw-bold">
                  {{ dataFormatter(systemCodPublicKey) }}
                </span>
              </p>
            </BCol>
          </BRow>

          <!-- Processor information -->
          <BRow class="mb-5">
            <BCol>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.processorInfo') }}
              </h3>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.previousActivated') }}
                <span class="fw-bold">
                  {{ processorPreviousActivated }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.processorResourceId') }}
                <span class="fw-bold">
                  {{ processorInfo.resourceId }}
                </span>
              </p>
              <p>
                {{
                  $t('pageCapacityOnDemand.orderInfo.processorSequenceNumber')
                }}

                <span class="fw-bold">
                  {{ processorInfo.sequenceNumber }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.processorsLicensed') }}
                <span class="fw-bold">
                  {{ dataFormatter(processorLicensed) }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.entryCheck') }}:
                <span class="fw-bold">
                  {{ processorEntryCheck }}
                </span>
              </p>
            </BCol>
          </BRow>

          <!-- Memory information -->
          <BRow class="mb-5">
            <BCol>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.memoryInfo') }}
              </h3>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.previousActivated') }}
                <span class="fw-bold">
                  {{ memoryPreviousActivated }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.memoryResourceId') }}
                <span class="fw-bold">
                  {{ memoryInfo.resourceId }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.memorySequenceNumber') }}

                <span class="fw-bold">
                  {{ memoryInfo.sequenceNumber }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.memoryLicensed') }}
                <span class="fw-bold">
                  {{ dataFormatter(memoryLicensed) }}
                </span>
              </p>
              <p>
                {{ $t('pageCapacityOnDemand.orderInfo.entryCheck') }}:
                <span class="fw-bold">
                  {{ memoryEntryCheck }}
                </span>
              </p>
            </BCol>
          </BRow>

          <BRow class="mb-5">
            <BCol>
              <h3 class="h4 mb-3">
                {{ $t('pageCapacityOnDemand.orderInfo.accessKeyInfo') }}
              </h3>
              <p>
                {{
                  $t(
                    'pageCapacityOnDemand.orderInfo.firmwareAccessKeyExpiration',
                  )
                }}
                <span v-if="hasLicenses" class="fw-bold">--</span>
                <span v-else class="fw-bold">
                  {{
                    $filters.formatDate(firmwareAccessKeyInfo.expirationDate)
                  }}
                </span>
              </p>
              <p>
                {{
                  $t('pageCapacityOnDemand.orderInfo.aixAccessKeyExpiration')
                }}
                <span v-if="hasLicenses" class="fw-bold">--</span>
                <span v-else class="fw-bold">
                  {{
                    $filters.formatDate(aixAccessKeyInfo.expirationDate)
                  }}
                </span>
              </p>
            </BCol>
          </BRow>
        </b-card>
      </page-section>
    </BCol>
  </BRow>
</template>

<script setup>
import { computed } from 'vue';
import PageSection from '@/components/Global/PageSection.vue';
import useDataFormatterGlobal from '@/components/Composables/useDataFormatterGlobal';
import { LicenseStore, SystemStore } from '@/store';

const licenseStore = LicenseStore();
const systemStore = SystemStore();
const { dataFormatter } = useDataFormatterGlobal();

const processorInfo = computed(() => {
  return licenseStore.processorInfo;
})
const memoryInfo = computed(() => {
  return licenseStore.memoryInfo;
})
const firmwareAccessKeyInfo = computed(() => {
  return licenseStore.firmwareAccessKeyInfo;
})
const aixAccessKeyInfo = computed(() => {
  return licenseStore.aixAccessKeyInfo;
})
const hasLicenses = computed(() => {
      // This logic checks to see if there are any licences in the store.
      // If there are none, the result is true, otherwise false.
      return !Object.keys(licenseStore.licensesGetter).length;
    });
const memoryPreviousActivated = computed(() => {
      return licenseStore.licensesGetter?.PermMem?.AuthDeviceNumber
        ? licenseStore.licensesGetter?.PermMem?.AuthDeviceNumber
        : '0000';
    });
const processorPreviousActivated = computed(() => {
      return licenseStore.licensesGetter?.PermProcs?.AuthDeviceNumber
        ? licenseStore.licensesGetter?.PermProcs?.AuthDeviceNumber
        : '0000';
    });
const processorEntryCheck = computed(() => {
      return licenseStore.licensesGetter?.PermProcs?.EntryCheck
        ? licenseStore.licensesGetter?.PermProcs?.EntryCheck
        : 'XX';
    });
const memoryEntryCheck = computed(() => {
      return licenseStore.licensesGetter?.PermMem?.EntryCheck
        ? licenseStore.licensesGetter.PermMem?.EntryCheck
        : 'XX';
    });
const processorLicensed = computed(() => {
      return licenseStore.licensesGetter?.PermProcs?.MaxAuthorizedDevices;
    });
const apid = computed(() => {
      return licenseStore.licensesGetter?.APID?.SerialNumber;
    });
const systemCodPublicKey = computed(() => {
      return licenseStore.licensesGetter?.APPublicKey?.SerialNumber;
    });
const memoryLicensed = computed(() => {
      return licenseStore.licensesGetter?.PermMem?.MaxAuthorizedDevices;
    });
const systemInfo = computed(() => {
      return systemStore.getSystems?.[0] || {};
    });
const systemAnchor = computed(() => {
      return licenseStore.licensesGetter?.SystemAnchor?.SerialNumber;
    });
</script>
