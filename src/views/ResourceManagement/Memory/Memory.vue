<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.memory')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert v-if="!isSectionEditable()" variant="warning" class="mb-4">
          <div class="fw-bold">
            {{ $t('pageMemory.alert.heading') }}
          </div>
          <div>
            {{
              $t('pageMemory.alert.message1') +
              ' ' +
              $t('pageMemory.alert.message2')
            }}
          </div>
        </alert>
        <alert v-if="isSectionEditable()" variant="warning" class="mb-4">
          <h5 class="fw-bold">
            {{ $t('pageMemory.alert.heading') }}
          </h5>
          <div>
            {{ $t('pageMemory.alert.message2') }}
          </div>
        </alert>
      </BCol>
    </BRow>
    <!-- Quicklinks section -->
    <page-section :section-title="$t('pageCapacityOnDemand.quickLinks')">
      <div v-for="item in quickLinks" :key="item.id">
        <BLink
          :href="item.href"
          :data-ref="item.dataRef"
          @click.prevent="scrollToOffset(refs, $event)"
        >
          <icon-jump-link /> {{ item.linkText }}
        </BLink>
      </div>
    </page-section>
    <page-section
      id="logicalMemorySizeOption"
      ref="logicalMemorySizeOption"
      :section-title="$t('pageMemory.logicalMemorySize')"
      class="mb-4"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>{{ $t('pageMemory.logicalMemorySizeHeading') }}</p>
        </BCol>
      </BRow>
      <BRow>
        <BCol md="8" xl="6">
          <BForm
            novalidate
            aria-label="memory-block-size"
            @submit.prevent="handleSubmit"
          >
            <BFormGroup
              :label="$t('pageMemory.memoryBlockSize')"
              label-for="logical-memory-size-option"
              class="mb-3"
            >
              <BFormSelect
                id="logical-memory-size-option"
                v-model="form.logicalMemorySizeOption"
                class="custom-select"
                :options="logicalMemorySizeOptions"
                :disabled="!isSectionEditable()"
              >
              </BFormSelect>
            </BFormGroup>
            <BButton
              variant="primary"
              type="submit"
              class="mt-3 mb-3"
              :disabled="!isSectionEditable()"
            >
              {{ $t('pageMemory.updateLogicalMemorySize') }}
            </BButton>
          </BForm>
        </BCol>
      </BRow>
    </page-section>
    <div class="section-divider mb-3 mt-3"></div>
    <page-section
      id="inputSystemMemoryPageSetup"
      ref="inputSystemMemoryPageSetup"
      :section-title="$t('pageMemory.systemMemoryPageSetupTitle')"
      class="mb-1"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>{{ $t('pageMemory.systemMemoryPageSetup') }}</p>
        </BCol>
      </BRow>
      <BRow>
        <BCol md="8" xl="6">
          <BForm
            aria-label="memory-page-setup"
            @submit.prevent="updatePageSetup()"
          >
            <BFormGroup
              :label="$t('pageMemory.maxNumHugePages')"
              label-for="system-memory-page-setup"
              class="mb-3"
              aria-label="max-huge-pass"
            >
              <BFormInput
                id="system-memory-page-setup"
                v-model.number="maxHugePageLimit"
                data-test-id="max-huge page-memory"
                :disabled="true"
              ></BFormInput>
            </BFormGroup>
            <BFormGroup
              :label="$t('pageMemory.requestedHugePageMemory')"
              label-for="input-system-memory-page-setup"
              aria-label="system-memory-page-setup"
              class="mb-3"
            >
              <BFormInput
                id="input-system-memory-page-setup"
                v-model.number="systemMemoryPageSetup"
                aria-label="Requested-huge-page-memory"
                data-test-id="system-memory-page-setup"
                type="number"
                :disabled="!isSectionEditable()"
                :state="getValidationState(v$.systemMemoryPageSetup)"
                @update:model-value="v$.systemMemoryPageSetup.$touch()"
              ></BFormInput>
              <BFormInvalidFeedback role="alert">
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: 0,
                    max: maxHugePageLimit,
                  })
                }}
              </BFormInvalidFeedback>
              <BButton
                variant="primary"
                type="submit"
                class="mt-3 mb-3"
                :disabled="!isSectionEditable()"
              >
                {{ $t('pageMemory.updatePageSetup') }}
              </BButton>
            </BFormGroup>
          </BForm>
        </BCol>
      </BRow>
    </page-section>
    <div class="section-divider mb-3 mt-3"></div>
    <page-section
      id="inputIoAdapterCapacity"
      ref="inputIoAdapterCapacity"
      :section-title="$t('pageMemory.ioAdapterEnlargedCapacityTitle')"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>{{ $t('pageMemory.ioAdapterEnlargedCapacity') }}</p>
        </BCol>
      </BRow>
      <BRow>
        <BCol md="8" xl="6">
          <BForm
            aria-label="io-adapter-capacity"
            @submit.prevent="updateAdapterCapacity()"
          >
            <BFormGroup
              aria-label="slot-count-for-Node-0-io-adapter-enlarged-capacity"
              :label="$t('pageMemory.slotCountForNode0')"
              label-for="io-adapter-enlarged-capacity"
              class="mb-3"
            >
              <BFormInput
                id="io-adapter-enlarged-capacity"
                v-model.number="ioAdapterCapacity"
                data-test-id="io-adapter-capacity"
                type="number"
                :min="0"
                :max="21"
                :state="getValidationState(v$.ioAdapterCapacity)"
                :disabled="!isSectionEditable()"
                @update:model-value="v$.ioAdapterCapacity.$touch()"
              ></BFormInput>
              <BFormInvalidFeedback role="alert">
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: 0,
                    max: 21,
                  })
                }}
              </BFormInvalidFeedback>
            </BFormGroup>
            <BButton
              variant="primary"
              type="submit"
              class="mt-3"
              :disabled="!isSectionEditable()"
            >
              {{ $t('pageMemory.updateIoAdapterEnlargedCapacity') }}
            </BButton>
          </BForm>
        </BCol>
      </BRow>
    </page-section>
    <div class="section-divider mb-3 mt-3"></div>
    <page-section
      id="inputDynamicIoDrawerAttachmentCapacity"
      ref="inputDynamicIoDrawerAttachmentCapacity"
      :section-title="$t('pageMemory.dynamicIoDrawerAttachmentTitle')"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>{{ $t('pageMemory.dynamicIoDrawerAttachment') }}</p>
        </BCol>
      </BRow>
      <BRow>
        <BCol md="8" xl="6">
          <BForm
            aria-label="update-io-drawer-attachment"
            @submit.prevent="updateDynamicAdapterCapacity()"
          >
            <span v-if="dynamicIoDrawerCapacityData === null">
              {{ '--' }}
            </span>
            <span v-else>
              <BFormGroup
                :label="$t('pageMemory.slotCountForNode0')"
                label-for="input-dynamic-io-adapter-drawer-capacity"
                aria-label="slot-count-for-node0-io-drawer-capacity"
                class="mb-3"
              >
                <BFormInput
                  id="input-dynamic-io-adapter-drawer-capacity"
                  v-model.number="dynamicIoDrawerCapacity"
                  data-test-id="dynamic-io-adapter-drawer-attachment"
                  type="number"
                  :min="0"
                  :max="dynamicIoDrawerDefaultCapacity"
                  :state="getValidationState(v$.dynamicIoDrawerCapacity)"
                  :disabled="!isSectionEditable()"
                  @update:model-value="v$.dynamicIoDrawerCapacity.$touch()"
                ></BFormInput>
                <BFormInvalidFeedback role="alert">
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: 0,
                      max: dynamicIoDrawerDefaultCapacity,
                    })
                  }}
                </BFormInvalidFeedback>
              </BFormGroup>
            </span>
            <span v-if="dynamicIoDrawerCapacityData !== null">
              <BButton
                variant="primary"
                type="submit"
                class="mt-3"
                :disabled="!isSectionEditable()"
              >
                {{ $t('pageMemory.updateDynamicIoDrawerAttachment') }}
              </BButton>
            </span>
          </BForm>
        </BCol>
      </BRow>
    </page-section>
    <div class="section-divider mb-3"></div>
    <page-section
      id="toggleActiveMemoryMirroring"
      ref="toggleActiveMemoryMirroring"
      :section-title="$t('pageMemory.activeMemoryMirroringTitle')"
      class="mb-1"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>{{ $t('pageMemory.activeMemoryMirroringDescription') }}</p>
        </BCol>
      </BRow>
      <BRow class="mt-3 mb-3">
        <BCol
          md="8"
          xl="6"
          class="mb-3 d-flex align-items-center justify-content-between"
        >
          <dl class="mr-3 w-75">
            <dt>
              {{ $t('pageMemory.activeMemoryMirroring') }}
            </dt>
            <dd v-if="!isSectionEditable()">
              <span v-if="activeMemoryMirroringState === null">
                {{ '--' }}
              </span>
              <span v-else-if="activeMemoryMirroringState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </dd>
            <dd v-else>
              <span v-if="activeMemoryMirroringState === null">
                {{ '--' }}
              </span>
              <BFormCheckbox
                v-else
                id="activeMemoryMirroringSwitch"
                v-model="activeMemoryMirroringState"
                switch
                :disabled="!isSectionEditable()"
                @update:model-value="changeActiveMemoryMirroringState"
              >
                <span v-if="activeMemoryMirroringState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
      </BRow>
    </page-section>
    <div class="section-divider mb-3"></div>
    <page-section
      id="togglePredictiveDynamicMemoryDeallocation"
      ref="togglePredictiveDynamicMemoryDeallocation"
      :section-title="$t('pageMemory.predictiveDynamicMemoryDeallocationTitle')"
      class="mb-1"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>
            {{
              $t('pageMemory.predictiveDynamicMemoryDeallocationDescription')
            }}
          </p>
        </BCol>
      </BRow>
      <BRow class="mt-3 mb-3">
        <BCol
          md="8"
          xl="6"
          class="mb-3 d-flex align-items-center justify-content-between"
        >
          <dl class="mr-3 w-75">
            <dt>
              {{ $t('pageMemory.predictiveDynamicMemoryDeallocationTitle') }}
            </dt>
            <dd v-if="!isSectionEditable()">
              <span v-if="predictiveDynamicMemoryDeallocationState === null">
                {{ '--' }}
              </span>
              <span v-else-if="predictiveDynamicMemoryDeallocationState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </dd>
            <dd v-else>
              <span v-if="predictiveDynamicMemoryDeallocationState === null">
                {{ '--' }}
              </span>
              <BFormCheckbox
                v-else
                id="predictiveDynamicMemoryDeallocationSwitch"
                v-model="predictiveDynamicMemoryDeallocationState"
                switch
                :disabled="!isSectionEditable()"
                @update:model-value="
                  changePredictiveDynamicMemoryDeallocationState
                "
              >
                <span v-if="predictiveDynamicMemoryDeallocationState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </BFormCheckbox>
            </dd>
          </dl>
        </BCol>
      </BRow>
    </page-section>
  </BContainer>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { minValue, maxValue } from '@vuelidate/validators';
import i18n from '@/i18n';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import { usePageLoadingBar } from '@/components/Composables/usePageLoadingBar';
import useJumpLinkComposable from '@/components/Composables/useJumpLinkComposable';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import Alert from '@/components/Global/Alert.vue';
import { default as IconJumpLink } from '@carbon/icons-vue/es/jump-link/16';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import stores from '@/store';
import { useMemory } from '@/api/composables/useMemory';

const { startLoader, endLoader } = useLoadingBar();
const { scrollToOffset } = useJumpLinkComposable();
const { successToast, errorToast } = useToast();
const { getValidationState } = useVuelidateComposable();

const globalStore = stores.GlobalStore();

// Use the new VueQuery composable
const {
  logicalMemorySize,
  logicalMemorySizeOptions,
  ioAdapterCapacity: ioAdapterCapacityData,
  dynamicIoDrawerCapacity: dynamicIoDrawerCapacityData,
  dynamicIoDrawerDefaultCapacity,
  maxNumHugePages: maxHugePageLimit,
  numHugePages: numHugePagesData,
  memoryMirroringMode,
  predictiveDynamicMemoryDeallocation,
  isLoading,
  isFetching,
  isError,
  saveLogicalMemorySize,
  savePageSetup,
  saveEnlargedCapacity,
  saveDynamicCapacity,
  saveActiveMemoryMirroringMode,
  savePredictiveDynamicMemoryDeallocation,
  isUpdating,
} = useMemory();

const logicalMemorySizeOption = ref(null);
const inputSystemMemoryPageSetup = ref(null);
const inputIoAdapterCapacity = ref(null);
const inputDynamicIoDrawerAttachmentCapacity = ref(null);
const toggleActiveMemoryMirroring = ref(null);
const togglePredictiveDynamicMemoryDeallocation = ref(null);

const refs = {
  logicalMemorySizeOption,
  inputSystemMemoryPageSetup,
  inputIoAdapterCapacity,
  inputDynamicIoDrawerAttachmentCapacity,
  toggleActiveMemoryMirroring,
  togglePredictiveDynamicMemoryDeallocation,
};

const form = ref({
  logicalMemorySizeOption: null,
});

const quickLinks = ref([
  {
    id: 'logicalMemorySizeOption',
    dataRef: 'logicalMemorySizeOption',
    href: '#logicalMemorySizeOption',
    linkText: i18n.global.t('pageMemory.logicalMemorySize'),
  },
  {
    id: 'inputSystemMemoryPageSetup',
    dataRef: 'inputSystemMemoryPageSetup',
    href: '#inputSystemMemoryPageSetup',
    linkText: i18n.global.t('pageMemory.systemMemoryPageSetupTitle'),
  },
  {
    id: 'inputIoAdapterCapacity',
    dataRef: 'inputIoAdapterCapacity',
    href: '#inputIoAdapterCapacity',
    linkText: i18n.global.t('pageMemory.ioAdapterEnlargedCapacityTitle'),
  },
  {
    id: 'inputDynamicIoDrawerAttachmentCapacity',
    dataRef: 'inputDynamicIoDrawerAttachmentCapacity',
    href: '#inputDynamicIoDrawerAttachmentCapacity',
    linkText: i18n.global.t('pageMemory.dynamicIoDrawerAttachmentTitle'),
  },
  {
    id: 'toggleActiveMemoryMirroring',
    dataRef: 'toggleActiveMemoryMirroring',
    href: '#toggleActiveMemoryMirroring',
    linkText: i18n.global.t('pageMemory.activeMemoryMirroringTitle'),
  },
  {
    id: 'togglePredictiveDynamicMemoryDeallocation',
    dataRef: 'togglePredictiveDynamicMemoryDeallocation',
    href: '#togglePredictiveDynamicMemoryDeallocation',
    linkText: i18n.global.t(
      'pageMemory.predictiveDynamicMemoryDeallocationTitle',
    ),
  },
]);

// Page navigation loading bar — fires once on mount fetch, ignores interval polls
usePageLoadingBar(isFetching, isError);

// Manage loading bar for user-triggered mutations (save/update actions)
watch(isUpdating, (updating) => {
  if (updating) {
    startLoader();
  } else {
    endLoader();
  }
});

// Local state for form inputs with validation
const ioAdapterCapacity = ref(0);
const dynamicIoDrawerCapacity = ref(0);
const systemMemoryPageSetup = ref(0);

// Sync local state with fetched data
watch(ioAdapterCapacityData, (value) => {
  if (value !== null) ioAdapterCapacity.value = value;
});

watch(dynamicIoDrawerCapacityData, (value) => {
  if (value !== null) dynamicIoDrawerCapacity.value = value;
});

watch(numHugePagesData, (value) => {
  if (value !== null) systemMemoryPageSetup.value = value;
});

watch(
  logicalMemorySize,
  (value) => {
    if (value !== null) form.value.logicalMemorySizeOption = value;
  },
  { immediate: true },
);

const activeMemoryMirroringState = computed({
  get() {
    return memoryMirroringMode.value;
  },
  set(newValue) {
    return newValue;
  },
});

const predictiveDynamicMemoryDeallocationState = computed({
  get() {
    return predictiveDynamicMemoryDeallocation.value;
  },
  set(newValue) {
    return newValue;
  },
});

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

const rules = computed(() => ({
  form: {
    logicalMemorySizeOption: {},
  },
  ioAdapterCapacity: {
    minValue: minValue(0),
    maxValue: maxValue(21),
  },
  dynamicIoDrawerCapacity: {
    minValue: minValue(0),
    maxValue: maxValue(dynamicIoDrawerDefaultCapacity.value ?? 0),
  },
  systemMemoryPageSetup: {
    minValue: minValue(0),
    maxValue: maxValue(maxHugePageLimit.value ?? 0),
  },
}));

const v$ = useVuelidate(rules, {
  form,
  ioAdapterCapacity,
  dynamicIoDrawerCapacity,
  systemMemoryPageSetup,
});

function isServerOff() {
  return serverStatus.value === 'off' ? true : false;
}

function isSectionEditable() {
  return isServerOff();
}

async function handleSubmit() {
  const size = form.value.logicalMemorySizeOption;
  if (!size) return;

  try {
    await saveLogicalMemorySize(size);
    successToast(i18n.global.t('pageMemory.toast.successSavingLogicalMemory'));
    v$.value.form.$reset();
  } catch (error) {
    errorToast(i18n.global.t('pageMemory.toast.errorSavingLogicalMemory'));
  }
}

async function updatePageSetup() {
  if (v$.value.$invalid) return;

  try {
    await savePageSetup(systemMemoryPageSetup.value);
    successToast(i18n.global.t('pageMemory.toast.successSavingPageSetup'));
    v$.value.systemMemoryPageSetup.$reset();
  } catch (error) {
    errorToast(i18n.global.t('pageMemory.toast.errorSavingPageSetup'));
  }
}

async function updateAdapterCapacity() {
  if (v$.value.ioAdapterCapacity.$invalid) return;

  try {
    await saveEnlargedCapacity(ioAdapterCapacity.value);
    successToast(
      i18n.global.t('pageMemory.toast.successSavingAdapterEnlargedCapacity'),
    );
    v$.value.ioAdapterCapacity.$reset();
  } catch (error) {
    errorToast(
      i18n.global.t('pageMemory.toast.errorSavingAdapterEnlargedCapacity'),
    );
  }
}

async function updateDynamicAdapterCapacity() {
  if (v$.value.dynamicIoDrawerCapacity.$invalid) return;

  try {
    await saveDynamicCapacity(dynamicIoDrawerCapacity.value);
    successToast(
      i18n.global.t('pageMemory.toast.successSavingAdapterDynamicCapacity'),
    );
    v$.value.dynamicIoDrawerCapacity.$reset();
  } catch (error) {
    errorToast(
      i18n.global.t('pageMemory.toast.errorSavingAdapterDynamicCapacity'),
    );
  }
}

async function changeActiveMemoryMirroringState(state) {
  try {
    await saveActiveMemoryMirroringMode(state);
    successToast(
      i18n.global.t('pageMemory.toast.successSavingActiveMemoryMirroringMode'),
    );
  } catch (error) {
    errorToast(
      i18n.global.t('pageMemory.toast.errorSavingActiveMemoryMirroringMode'),
    );
  }
}

async function changePredictiveDynamicMemoryDeallocationState(state) {
  try {
    await savePredictiveDynamicMemoryDeallocation(state);
    successToast(
      i18n.global.t(
        'pageMemory.toast.successSavingPredictiveDynamicMemoryDeallocation',
      ),
    );
  } catch (error) {
    errorToast(
      i18n.global.t(
        'pageMemory.toast.errorSavingPredictiveDynamicMemoryDeallocation',
      ),
    );
  }
}
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
