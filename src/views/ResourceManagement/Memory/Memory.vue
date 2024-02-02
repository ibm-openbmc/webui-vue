<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.memory')" />
    <b-row>
      <b-col md="8" xl="6">
        <alert v-if="!isSectionEditable()" variant="warning" class="mb-4">
          <div class="font-weight-bold">
            {{ $t('pageMemory.alert.heading') }}
          </div>
          <div>
            {{ $t('pageMemory.alert.message') }}
          </div>
        </alert>
      </b-col>
    </b-row>
    <!-- Quicklinks section -->
    <page-section :section-title="$t('pageCapacityOnDemand.quickLinks')">
      <div v-for="item in quickLinks" :key="item.id">
        <b-link
          :href="item.href"
          :data-ref="item.dataRef"
          @click.prevent="scrollToOffset"
        >
          <icon-jump-link /> {{ item.linkText }}
        </b-link>
      </div>
    </page-section>
    <page-section
      id="logicalMemorySizeOption"
      ref="logicalMemorySizeOption"
      :section-title="$t('pageMemory.logicalMemorySize')"
      class="mb-4"
    >
      <b-row>
        <b-col md="8" xl="6">
          <p>{{ $t('pageMemory.logicalMemorySizeHeading') }}</p>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="8" xl="6">
          <b-form novalidate @submit.prevent="handleSubmit">
            <b-form-group
              :label="$t('pageMemory.memoryBlockSize')"
              label-for="logical-memory-size-option"
              class="mb-3"
            >
              <b-form-select
                id="logical-memory-size-option"
                v-model="form.logicalMemorySizeOption"
                :options="logicalMemorySizeOptions"
                :disabled="!isSectionEditable()"
              >
              </b-form-select>
            </b-form-group>
            <b-button
              variant="primary"
              type="submit"
              class="mt-3 mb-3"
              :disabled="!isSectionEditable()"
            >
              {{ $t('pageMemory.updateLogicalMemorySize') }}
            </b-button>
          </b-form>
        </b-col>
      </b-row>
    </page-section>
    <div class="section-divider mb-3 mt-3"></div>
    <page-section
      id="inputSystemMemoryPageSetup"
      ref="inputSystemMemoryPageSetup"
      :section-title="$t('pageMemory.systemMemoryPageSetupTitle')"
      class="mb-1"
    >
      <b-row>
        <b-col md="8" xl="6">
          <p>{{ $t('pageMemory.systemMemoryPageSetup') }}</p>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="8" xl="6">
          <b-form @submit.prevent="updatePageSetup()">
            <b-form-group
              :label="$t('pageMemory.maxNumHugePages')"
              label-for="system-memory-page-setup"
              class="mb-3"
            >
              <b-form-input
                id="max-huge page-memory"
                v-model.number="maxHugePageLimit"
                data-test-id="max-huge page-memory"
                :disabled="true"
              ></b-form-input>
            </b-form-group>
            <b-form-group
              :label="$t('pageMemory.requestedHugePageMemory')"
              label-for="system-memory-page-setup"
              class="mb-3"
            >
              <b-form-input
                id="input-system-memory-page-setup"
                v-model.number="systemMemoryPageSetup"
                data-test-id="system-memory-page-setup"
                type="number"
                :disabled="!isSectionEditable()"
                :state="getValidationState($v.systemMemoryPageSetup)"
              ></b-form-input>
              <b-form-invalid-feedback role="alert">
                <template
                  v-if="
                    !$v.systemMemoryPageSetup.minLength ||
                    !$v.systemMemoryPageSetup.maxLength
                  "
                >
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: 0,
                      max: maxHugePageLimit,
                    })
                  }}
                </template>
              </b-form-invalid-feedback>
              <b-button
                variant="primary"
                type="submit"
                class="mt-3 mb-3"
                :disabled="!isSectionEditable()"
              >
                {{ $t('pageMemory.updatePageSetup') }}
              </b-button>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
    </page-section>
    <div class="section-divider mb-3 mt-3"></div>
    <page-section
      id="inputIoAdapterCapacity"
      ref="inputIoAdapterCapacity"
      :section-title="$t('pageMemory.ioAdapterEnlargedCapacityTitle')"
    >
      <b-row>
        <b-col md="8" xl="6">
          <p>{{ $t('pageMemory.ioAdapterEnlargedCapacity') }}</p>
        </b-col>
      </b-row>
      <b-row>
        <b-col md="8" xl="6">
          <b-form @submit.prevent="updateAdapterCapacity()">
            <b-form-group
              :label="$t('pageMemory.slotCountForNode0')"
              label-for="io-adapter-enlarged-capacity"
              class="mb-3"
            >
              <b-form-input
                id="input-io-adapter-capacity"
                v-model.number="ioAdapterCapacity"
                data-test-id="io-adapter-capacity"
                type="number"
                :min="0"
                :max="21"
                :state="getValidationState($v.ioAdapterCapacity)"
                :disabled="!isSectionEditable()"
              ></b-form-input>
              <b-form-invalid-feedback role="alert">
                <template
                  v-if="
                    !$v.ioAdapterCapacity.minLength ||
                    !$v.ioAdapterCapacity.maxLength
                  "
                >
                  {{
                    $t('global.form.valueMustBeBetween', {
                      min: 0,
                      max: 21,
                    })
                  }}
                </template>
              </b-form-invalid-feedback>
            </b-form-group>
            <b-button
              variant="primary"
              type="submit"
              class="mt-3"
              :disabled="!isSectionEditable()"
            >
              {{ $t('pageMemory.updateIoAdapterEnlargedCapacity') }}
            </b-button>
          </b-form>
        </b-col>
      </b-row>
    </page-section>
    <div class="section-divider mb-3"></div>
    <page-section
      id="toggleActiveMemoryMirroring"
      ref="toggleActiveMemoryMirroring"
      :section-title="$t('pageMemory.activeMemoryMirroringTitle')"
      class="mb-1"
    >
      <b-row>
        <b-col md="8" xl="6">
          <p>{{ $t('pageMemory.activeMemoryMirroringDescription') }}</p>
        </b-col>
      </b-row>
      <b-row class="mt-3 mb-3">
        <b-col
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
              <b-form-checkbox
                v-else
                id="activeMemoryMirroringSwitch"
                v-model="activeMemoryMirroringState"
                switch
                :disabled="!isSectionEditable()"
                @change="changeActiveMemoryMirroringState"
              >
                <span v-if="activeMemoryMirroringState">
                  {{ $t('global.status.enabled') }}
                </span>
                <span v-else>{{ $t('global.status.disabled') }}</span>
              </b-form-checkbox>
            </dd>
          </dl>
        </b-col>
      </b-row>
    </page-section>
  </b-container>
</template>

<script>
import JumpLink16 from '@carbon/icons-vue/es/jump-link/16';
import { mapState } from 'vuex';
import Alert from '@/components/Global/Alert';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import JumpLinkMixin from '@/components/Mixins/JumpLinkMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';
import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';
import { minValue, maxValue } from 'vuelidate/lib/validators';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';

export default {
  name: 'Memory',
  components: { Alert, PageSection, PageTitle, IconJumpLink: JumpLink16 },
  mixins: [VuelidateMixin, BVToastMixin, LoadingBarMixin, JumpLinkMixin],
  data() {
    return {
      form: {
        logicalMemorySizeOption: this.$store.getters[
          'resourceMemory/logicalMemorySize'
        ],
      },
      quickLinks: [
        {
          id: 'logicalMemorySizeOption',
          dataRef: 'logicalMemorySizeOption',
          href: '#logicalMemorySizeOption',
          linkText: this.$t('pageMemory.logicalMemorySize'),
        },
        {
          id: 'inputSystemMemoryPageSetup',
          dataRef: 'inputSystemMemoryPageSetup',
          href: '#inputSystemMemoryPageSetup',
          linkText: this.$t('pageMemory.systemMemoryPageSetupTitle'),
        },
        {
          id: 'inputIoAdapterCapacity',
          dataRef: 'inputIoAdapterCapacity',
          href: '#inputIoAdapterCapacity',
          linkText: this.$t('pageMemory.ioAdapterEnlargedCapacityTitle'),
        },
        {
          id: 'toggleActiveMemoryMirroring',
          dataRef: 'toggleActiveMemoryMirroring',
          href: '#toggleActiveMemoryMirroring',
          linkText: this.$t('pageMemory.activeMemoryMirroringTitle'),
        },
      ],
    };
  },
  computed: {
    ...mapState('resourceMemory', [
      'logicalMemorySizeOptions',
      'logicalMemorySize',
    ]),
    activeMemoryMirroringState: {
      get() {
        return this.$store.getters['resourceMemory/memoryMirroringMode'];
      },
      set(newValue) {
        return newValue;
      },
    },
    maxHugePageLimit() {
      return this.$store.getters['resourceMemory/maxNumHugePages'];
    },
    ioAdapterCapacity: {
      get() {
        return this.$store.getters['resourceMemory/ioAdapterCapacity'];
      },
      set(value) {
        this.$v.$touch();
        this.$store.commit('resourceMemory/setIoAdapterCapacity', value);
      },
    },
    systemMemoryPageSetup: {
      get() {
        return this.$store.getters['resourceMemory/numHugePages'];
      },
      set(value) {
        this.$v.$touch();
        this.$store.commit('resourceMemory/setNumHugePages', value);
      },
    },
    serverStatus() {
      return this.$store.getters['global/serverStatus'];
    },
  },
  watch: {
    logicalMemorySize: function (value) {
      this.form.logicalMemorySizeOption = value;
    },
  },
  validations() {
    // Empty validations to leverage vuelidate form states
    // to check for changed values
    return {
      form: {
        logicalMemorySizeOption: {},
      },
      ioAdapterCapacity: {
        minValue: minValue(0),
        maxValue: maxValue(21),
      },
      systemMemoryPageSetup: {
        minValue: minValue(0),
        maxValue: maxValue(this.maxHugePageLimit),
      },
    };
  },
  created() {
    this.startLoader();
    Promise.all([
      this.$store.dispatch('resourceMemory/getMemorySizeOptions'),
      this.$store.dispatch('resourceMemory/getLogicalMemorySize'),
      this.$store.dispatch('resourceMemory/getIoAdapterCapacity'),
      this.$store.dispatch('resourceMemory/getNumHugePages'),
      this.$store.dispatch('resourceMemory/getMaxNumHugePages'),
      this.$store.dispatch('resourceMemory/getHmcManaged'),
      this.$store.dispatch('resourceMemory/getActiveMemoryMirroring'),
    ]).finally(() => this.endLoader());
  },
  methods: {
    isServerOff() {
      return this.serverStatus === 'off' ? true : false;
    },
    isSectionEditable() {
      return this.isServerOff();
    },
    handleSubmit() {
      this.startLoader();
      let logicalMemorySize = this.form.logicalMemorySizeOption;
      this.$store
        .dispatch('resourceMemory/saveSettings', logicalMemorySize)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => {
          this.$v.form.$reset();
          this.endLoader();
        });
    },
    updatePageSetup() {
      if (this.$v.$invalid) return;
      this.startLoader();
      this.$store
        .dispatch('resourceMemory/savePageSetup')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => {
          this.$v.form.$reset();
          this.endLoader();
        });
    },
    updateAdapterCapacity() {
      this.startLoader();
      this.$store
        .dispatch('resourceMemory/saveEnlargedCapacity')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message))
        .finally(() => {
          this.$v.form.$reset();
          this.endLoader();
        });
    },
    changeActiveMemoryMirroringState(state) {
      this.$store
        .dispatch('resourceMemory/saveActiveMemoryMirroringMode', state)
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>
