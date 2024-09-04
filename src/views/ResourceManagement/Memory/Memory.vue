<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.memory')" />
    <BRow>
      <BCol md="8" xl="6">
        <alert v-if="!isSectionEditable()" variant="warning" class="mb-4">
          <div class="font-weight-bold">
            {{ $t('pageMemory.alert.heading') }}
          </div>
          <div>
            {{ $t('pageMemory.alert.message') }}
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
          <BForm novalidate @submit.prevent="handleSubmit">
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
          <BForm @submit.prevent="updatePageSetup()">
            <BFormGroup
              :label="$t('pageMemory.maxNumHugePages')"
              label-for="system-memory-page-setup"
              class="mb-3"
            >
              <BFormInput
                id="max-huge page-memory"
                v-model.number="maxHugePageLimit"
                data-test-id="max-huge page-memory"
                :disabled="true"
              ></BFormInput>
            </BFormGroup>
            <BFormGroup
              :label="$t('pageMemory.requestedHugePageMemory')"
              label-for="system-memory-page-setup"
              class="mb-3"
            >
              <BFormInput
                id="input-system-memory-page-setup"
                v-model.number="systemMemoryPageSetup"
                data-test-id="system-memory-page-setup"
                type="number"
                :disabled="!isSectionEditable()"
                :state="getValidationState(v$.systemMemoryPageSetup)"
              ></BFormInput>
              <BFormInvalidFeedback role="alert">
                <template
                  v-if="
                    !v$.systemMemoryPageSetup.minLength ||
                    !v$.systemMemoryPageSetup.maxLength
                  "
                >
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: 0,
                      max: maxHugePageLimit,
                    })
                  }}
                </template>
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
          <BForm @submit.prevent="updateAdapterCapacity()">
            <BFormGroup
              :label="$t('pageMemory.slotCountForNode0')"
              label-for="io-adapter-enlarged-capacity"
              class="mb-3"
            >
              <BFormInput
                id="input-io-adapter-capacity"
                v-model.number="ioAdapterCapacity"
                data-test-id="io-adapter-capacity"
                type="number"
                :min="0"
                :max="21"
                :state="getValidationState(v$.ioAdapterCapacity)"
                :disabled="!isSectionEditable()"
              ></BFormInput>
              <BFormInvalidFeedback role="alert">
                <template
                  v-if="
                    !v$.ioAdapterCapacity.minLength ||
                    !v$.ioAdapterCapacity.maxLength
                  "
                >
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: 0,
                      max: 21,
                    })
                  }}
                </template>
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
          <BForm @submit.prevent="updateDynamicAdapterCapacity()">
            <span v-if="dynamicIoDrawerCapacity === null">
              {{ '--' }}
            </span>
            <span v-else>
              <BFormGroup
                :label="$t('pageMemory.slotCountForNode0')"
                label-for="dynamic-io-drawer-capacity"
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
                ></BFormInput>
                <BFormInvalidFeedback role="alert">
                  <template
                    v-if="
                      !v$.dynamicIoDrawerCapacity.minLength ||
                      !v$.dynamicIoDrawerCapacity.maxLength
                    "
                  >
                    {{
                      $t('global.form.valueMustBeBetween', {
                        min: 0,
                        max: dynamicIoDrawerDefaultCapacity,
                      })
                    }}
                  </template>
                </BFormInvalidFeedback>
              </BFormGroup>
            </span>
            <span v-if="dynamicIoDrawerCapacity !== null">
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
      id="togglePredictiveMemoryGuard"
      ref="togglePredictiveMemoryGuard"
      :section-title="$t('pageMemory.predictiveMemoryGuardTitle')"
      class="mb-1"
    >
      <BRow>
        <BCol md="8" xl="6">
          <p>{{ $t('pageMemory.predictiveMemoryGuardDescription') }}</p>
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
              {{ $t('pageMemory.predictiveMemoryGuardHeader') }}
            </dt>
            <dd v-if="!isSectionEditable()">
              <span v-if="predictiveMemoryGuardState === null">
                {{ '--' }}
              </span>
              <span v-else-if="predictiveMemoryGuardState">
                {{ $t('global.status.enabled') }}
              </span>
              <span v-else>{{ $t('global.status.disabled') }}</span>
            </dd>
            <dd v-else>
              <span v-if="predictiveMemoryGuardState === null">
                {{ '--' }}
              </span>
              <BFormCheckbox
                v-else
                id="predictiveMemoryGuardSwitch"
                v-model="predictiveMemoryGuardState"
                switch
                :disabled="!isSectionEditable()"
                @update:model-value="changePredictiveMemoryGuardState"
              >
                <span v-if="predictiveMemoryGuardState">
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
import { ref, computed, watch, onBeforeMount } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { minValue, maxValue } from '@vuelidate/validators';
import { storeToRefs } from 'pinia';
import i18n from '@/i18n';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import useJumpLinkComposable from '@/components/Composables/useJumpLinkComposable';
import useToast from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import Alert from '@/components/Global/Alert.vue';
import { default as IconJumpLink } from '@carbon/icons-vue/es/jump-link/16';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import { GlobalStore, ResourceMemoryStore } from '@/store';

const { startLoader, endLoader } = useLoadingBar();
const { scrollToOffset } = useJumpLinkComposable();
const { successToast, errorToast } = useToast();
const { getValidationState } = useVuelidateComposable();

const globalStore = GlobalStore();
const resourceMemoryStore = ResourceMemoryStore();

const logicalMemorySizeOption = ref(null);
const inputSystemMemoryPageSetup = ref(null);
const inputIoAdapterCapacity = ref(null);
const inputDynamicIoDrawerAttachmentCapacity = ref(null);
const toggleActiveMemoryMirroring = ref(null);
const togglePredictiveMemoryGuard = ref(null);

const refs = {
  logicalMemorySizeOption,
  inputSystemMemoryPageSetup,
  inputIoAdapterCapacity,
  inputDynamicIoDrawerAttachmentCapacity,
  toggleActiveMemoryMirroring,
  togglePredictiveMemoryGuard,
};

const form = ref({
  logicalMemorySizeOption: resourceMemoryStore.logicalMemorySizeGetter,
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
    id: 'togglePredictiveMemoryGuard',
    dataRef: 'togglePredictiveMemoryGuard',
    href: '#togglePredictiveMemoryGuard',
    linkText: i18n.global.t('pageMemory.predictiveMemoryGuardTitle'),
  },
]);

const { logicalMemorySizeOptions, logicalMemorySize } =
  storeToRefs(resourceMemoryStore);

const activeMemoryMirroringState = computed({
  get() {
    return resourceMemoryStore.memoryMirroringModeGetter;
  },
  set(newValue) {
    return newValue;
  },
});

const predictiveMemoryGuardState = computed({
  get() {
    return resourceMemoryStore.predictiveMemoryGuardGetter;
  },
  set(newValue) {
    return newValue;
  },
});

const maxHugePageLimit = computed(() => {
  return resourceMemoryStore.maxNumHugePagesGetter;
});

const dynamicIoDrawerDefaultCapacity = computed(() => {
  return resourceMemoryStore.dynamicIoDrawerDefaultCapacityGetter;
});

const ioAdapterCapacity = computed({
  get() {
    return resourceMemoryStore.ioAdapterCapacityGetter;
  },
  set(value) {
    v$.value.$touch();
    resourceMemoryStore.ioAdapterCapacity = value;
  },
});

const dynamicIoDrawerCapacity = computed({
  get() {
    return resourceMemoryStore.dynamicIoDrawerCapacityGetter;
  },
  set(value) {
    v$.value.$touch();
    resourceMemoryStore.dynamicIoDrawerCapacity = value;
  },
});

const systemMemoryPageSetup = computed({
  get() {
    return resourceMemoryStore.numHugePagesGetter;
  },
  set(value) {
    v$.value.$touch();
    resourceMemoryStore.numHugePages = value;
  },
});

const serverStatus = computed(() => {
  return globalStore.serverStatusGetter;
});

watch(logicalMemorySize, (value) => {
  form.value.logicalMemorySizeOption = value;
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
    maxValue: maxValue(dynamicIoDrawerDefaultCapacity.value),
  },
  systemMemoryPageSetup: {
    minValue: minValue(0),
    maxValue: maxValue(maxHugePageLimit.value),
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

function handleSubmit() {
  startLoader();
  let logicalMemorySize = form.value.logicalMemorySizeOption;
  resourceMemoryStore
    .saveSettings(logicalMemorySize)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => {
      v$.value.form.$reset();
      endLoader();
    });
}

function updatePageSetup() {
  if (v$.value.$invalid) return;
  startLoader();
  resourceMemoryStore
    .savePageSetup()
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => {
      v$.value.form.$reset();
      endLoader();
    });
}

function updateAdapterCapacity() {
  startLoader();
  resourceMemoryStore
    .saveEnlargedCapacity()
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => {
      v$.value.form.$reset();
      endLoader();
    });
}

function updateDynamicAdapterCapacity() {
  startLoader();
  resourceMemoryStore
    .saveDynamicCapacity()
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message))
    .finally(() => {
      v$.value.form.$reset();
      endLoader();
    });
}

function changeActiveMemoryMirroringState(state) {
  resourceMemoryStore
    .saveActiveMemoryMirroringMode(state)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

function changePredictiveMemoryGuardState(state) {
  resourceMemoryStore
    .savePredictiveMemoryGuard(state)
    .then((message) => successToast(message))
    .catch(({ message }) => errorToast(message));
}

onBeforeMount(() => {
  startLoader();
  Promise.all([
    resourceMemoryStore.getMemorySizeOptions(),
    resourceMemoryStore.getLogicalMemorySize(),
    resourceMemoryStore.getIoAdapterCapacity(),
    resourceMemoryStore.getNumHugePages(),
    resourceMemoryStore.getMaxNumHugePages(),
    resourceMemoryStore.getHmcManaged(),
    resourceMemoryStore.getActiveMemoryMirroring(),
    resourceMemoryStore.getPredictiveMemoryGuard(),
  ]).finally(() => endLoader());
});
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
  &:hover {
    text-decoration: underline;
  }
}
</style>
