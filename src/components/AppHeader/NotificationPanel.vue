<template>
  <div class="notification-panel">
    <div class="notification-header">
      <h5 class="mb-0">{{ $t('appHeader.systemMonitor') }}</h5>
      <BButton
        variant="link"
        size="sm"
        class="close-btn"
        @click="$emit('close')"
      >
        <icon-close :title="$t('global.action.close')" />
      </BButton>
    </div>

    <!-- Tabs -->
    <BTabs v-model="activeTab" class="notification-tabs" nav-class="tabs-nav">
      <!-- Active Tab -->
      <BTab>
        <template #title>
          <span class="tab-title-with-badge">
            {{ $t('appHeader.active') }}
            <span
              v-if="hasActiveOperations"
              class="tab-active-indicator"
            ></span>
          </span>
        </template>
        <div class="notification-body">
          <!-- Firmware Switch Progress Widget -->
          <div
            v-if="firmwareSwitchInProgress"
            class="widget-card operation-progress"
          >
            <div class="widget-header">
              <icon-upgrade class="widget-icon" />
              <h6>{{ $t('appHeader.firmwareSwitchProgress') }}</h6>
            </div>

            <div class="progress-content">
              <!-- Progress Steps -->
              <div class="steps-list">
                <div
                  v-for="(step, index) in firmwareSwitchSteps"
                  :key="index"
                  class="step-item"
                  :class="{
                    'step-completed': index < firmwareSwitchCurrentStep - 1,
                    'step-active': index === firmwareSwitchCurrentStep - 1,
                    'step-pending': index > firmwareSwitchCurrentStep - 1,
                  }"
                >
                  <div class="step-indicator">
                    <icon-checkmark-filled
                      v-if="index < firmwareSwitchCurrentStep - 1"
                    />
                    <div
                      v-else-if="index === firmwareSwitchCurrentStep - 1"
                      class="loading-circle"
                    ></div>
                    <span v-else class="step-number">{{ index + 1 }}</span>
                  </div>
                  <div class="step-details">
                    <div class="step-name">{{ step.title }}</div>
                    <div class="step-desc">{{ step.description }}</div>
                  </div>
                </div>
              </div>

              <!-- Elapsed Time -->
              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ firmwareSwitchElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- Firmware Update Progress Widget -->
          <div
            v-if="firmwareUpdateInProgress"
            class="widget-card operation-progress"
          >
            <div class="widget-header">
              <icon-upgrade class="widget-icon" />
              <h6>
                {{
                  $t('appHeader.firmwareUpdateProgress') || 'Firmware Update'
                }}
              </h6>
            </div>

            <div class="progress-content">
              <div class="steps-list">
                <div
                  v-for="(step, index) in firmwareUpdateSteps"
                  :key="index"
                  class="step-item"
                  :class="{
                    'step-completed': index < firmwareUpdateCurrentStep - 1,
                    'step-active': index === firmwareUpdateCurrentStep - 1,
                    'step-pending': index > firmwareUpdateCurrentStep - 1,
                  }"
                >
                  <div class="step-indicator">
                    <icon-checkmark-filled
                      v-if="index < firmwareUpdateCurrentStep - 1"
                    />
                    <div
                      v-else-if="index === firmwareUpdateCurrentStep - 1"
                      class="loading-circle"
                    ></div>
                    <span v-else class="step-number">{{ index + 1 }}</span>
                  </div>
                  <div class="step-details">
                    <div class="step-name">{{ step.title }}</div>
                    <div class="step-desc">{{ step.description }}</div>
                  </div>
                </div>
              </div>

              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ firmwareUpdateElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- BMC Reboot Progress Widget -->
          <div
            v-if="bmcRebootInProgress"
            class="widget-card operation-progress"
          >
            <div class="widget-header">
              <icon-renew class="widget-icon" />
              <h6>{{ $t('appHeader.bmcRebootProgress') || 'BMC Reboot' }}</h6>
            </div>

            <div class="progress-content">
              <div class="steps-list">
                <div
                  v-for="(step, index) in bmcRebootSteps"
                  :key="index"
                  class="step-item"
                  :class="{
                    'step-completed': index < bmcRebootCurrentStep - 1,
                    'step-active': index === bmcRebootCurrentStep - 1,
                    'step-pending': index > bmcRebootCurrentStep - 1,
                  }"
                >
                  <div class="step-indicator">
                    <icon-checkmark-filled
                      v-if="index < bmcRebootCurrentStep - 1"
                    />
                    <div
                      v-else-if="index === bmcRebootCurrentStep - 1"
                      class="loading-circle"
                    ></div>
                    <span v-else class="step-number">{{ index + 1 }}</span>
                  </div>
                  <div class="step-details">
                    <div class="step-name">{{ step.title }}</div>
                    <div class="step-desc">{{ step.description }}</div>
                  </div>
                </div>
              </div>

              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ bmcRebootElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- Dump Generation Progress Widget -->
          <div
            v-if="dumpGenerationInProgress"
            class="widget-card operation-progress"
          >
            <div class="widget-header">
              <icon-download class="widget-icon" />
              <h6>
                {{ dumpGenerationType }}
                {{ $t('appHeader.dumpProgress') || 'Dump Generation' }}
              </h6>
            </div>

            <div class="progress-content">
              <div class="single-step-indicator">
                <div class="loading-circle"></div>
                <div class="step-details">
                  <div class="step-name">
                    {{
                      $t('appHeader.generatingDump') ||
                      'Generating dump file...'
                    }}
                  </div>
                  <div class="step-desc">
                    {{
                      $t('appHeader.generatingDumpDesc') ||
                      'Please wait while the dump data is assembled'
                    }}
                  </div>
                </div>
              </div>

              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ dumpElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- Server Power Operation Progress Widget -->
          <div
            v-if="serverPowerInProgress"
            class="widget-card operation-progress"
          >
            <div class="widget-header">
              <icon-power class="widget-icon" />
              <h6>{{ serverPowerOperationType }}</h6>
            </div>
            <div class="progress-content">
              <div class="single-step-indicator">
                <div class="loading-circle"></div>
                <div class="step-details">
                  <div class="step-name">
                    {{ $t('appHeader.serverPowerInProgress') }}
                  </div>
                  <div class="step-desc">
                    {{ $t('appHeader.serverPowerInProgressDesc') }}
                  </div>
                </div>
              </div>
              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ serverPowerElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- Immediate Test Progress Widget -->
          <div
            v-if="immediateTestInProgress"
            class="widget-card operation-progress"
          >
            <div class="widget-header">
              <icon-chart-activity class="widget-icon" />
              <h6>{{ $t('appHeader.immediateTestProgress') }}</h6>
            </div>
            <div class="progress-content">
              <div class="single-step-indicator">
                <div class="loading-circle"></div>
                <div class="step-details">
                  <div class="step-name">
                    {{ $t('appHeader.immediateTestRunning') }}
                  </div>
                  <div class="step-desc">
                    {{ $t('appHeader.immediateTestRunningDesc') }}
                  </div>
                </div>
              </div>
              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ immediateTestElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- Lamp Test Progress Widget -->
          <div v-if="lampTestInProgress" class="widget-card operation-progress">
            <div class="widget-header">
              <icon-light class="widget-icon" />
              <h6>{{ $t('appHeader.lampTestProgress') }}</h6>
            </div>
            <div class="progress-content">
              <div class="single-step-indicator">
                <div class="loading-circle"></div>
                <div class="step-details">
                  <div class="step-name">
                    {{ $t('appHeader.lampTestRunning') }}
                  </div>
                  <div class="step-desc">
                    {{ $t('appHeader.lampTestRunningDesc') }}
                  </div>
                </div>
              </div>
              <div class="elapsed-time">
                <icon-time class="time-icon" />
                <span
                  >{{ $t('appHeader.elapsedTime') }}:
                  {{ lampTestElapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- No Active Operations -->
          <div v-if="!hasActiveOperations" class="no-operations">
            <icon-checkmark class="success-icon-large" />
            <h6>{{ $t('appHeader.noActiveOperations') }}</h6>
            <p>{{ $t('appHeader.noActiveOperationsMessage') }}</p>
          </div>
        </div>
      </BTab>

      <!-- Completed Tab -->
      <BTab>
        <template #title>
          <span class="tab-title-with-badge">
            {{ $t('appHeader.completed') }}
            <span
              v-if="hasUnviewedNotifications"
              class="tab-notification-badge"
            ></span>
          </span>
        </template>
        <div class="notification-body">
          <!-- Completed Operations -->
          <div v-if="completedOperations.length > 0" class="completed-list">
            <div
              v-for="operation in completedOperations"
              :key="operation.id"
              class="completed-notification"
            >
              <div class="notification-icon">
                <icon-checkmark-filled class="success-icon" />
              </div>
              <div class="notification-content">
                <div class="notification-title">{{ operation.title }}</div>
                <div class="notification-message">{{ operation.message }}</div>
                <div class="notification-meta">
                  <span class="notification-time">{{
                    formatCompletedTime(operation.timestamp)
                  }}</span>
                  <span class="notification-duration">{{
                    formatDuration(operation.duration)
                  }}</span>
                </div>
              </div>
              <BButton
                variant="link"
                size="sm"
                class="notification-close"
                @click="removeOperation(operation.id)"
              >
                <icon-close-small />
              </BButton>
            </div>
          </div>

          <!-- No Completed Operations -->
          <div v-else class="no-operations">
            <icon-checkmark class="success-icon-large" />
            <h6>{{ $t('appHeader.noCompletedOperations') }}</h6>
            <p>{{ $t('appHeader.noCompletedOperationsMessage') }}</p>
          </div>
        </div>
      </BTab>

      <!-- System Alerts Tab -->
      <BTab>
        <template #title>
          <span class="tab-title-with-badge">
            {{ $t('appHeader.alerts') || 'Alerts' }}
            <span v-if="criticalEvents.length > 0" class="tab-alert-badge">
              {{ criticalEvents.length }}
            </span>
          </span>
        </template>
        <div class="notification-body">
          <div v-if="recentEvents.length > 0" class="completed-list">
            <div
              v-for="event in recentEvents"
              :key="event.id"
              class="completed-notification alert-notification"
              :class="{ 'alert-critical': event.severity === 'Critical' }"
            >
              <div class="notification-icon">
                <icon-warning-filled
                  v-if="event.severity === 'Critical'"
                  class="critical-icon"
                />
                <icon-warning v-else class="warning-icon" />
              </div>
              <div class="notification-content">
                <div class="notification-title">
                  {{ event.name || event.id }}
                </div>
                <div class="notification-message">
                  {{ event.description || event.message }}
                </div>
                <div class="notification-meta">
                  <span class="notification-time">{{
                    formatCompletedTime(event.date)
                  }}</span>
                  <span class="notification-severity">{{
                    event.severity
                  }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="no-operations">
            <icon-checkmark class="success-icon-large" />
            <h6>{{ $t('appHeader.noRecentEvents') }}</h6>
            <p>
              {{
                $t('appHeader.systemHealthyMessage') ||
                'System status is healthy with no unresolved events'
              }}
            </p>
          </div>
        </div>
      </BTab>
    </BTabs>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import IconClose from '@carbon/icons-vue/es/close/20';
import IconCloseSmall from '@carbon/icons-vue/es/close/16';
import IconUpgrade from '@carbon/icons-vue/es/upgrade/20';
import IconRenew from '@carbon/icons-vue/es/renew/20';
import IconDownload from '@carbon/icons-vue/es/download/20';
import IconPower from '@carbon/icons-vue/es/power/20';
import IconChartActivity from '@carbon/icons-vue/es/chart--bar/20';
import IconLight from '@carbon/icons-vue/es/light/20';
import IconCheckmark from '@carbon/icons-vue/es/checkmark--filled/32';
import IconCheckmarkFilled from '@carbon/icons-vue/es/checkmark--filled/16';
import IconWarningFilled from '@carbon/icons-vue/es/warning--filled/16';
import IconWarning from '@carbon/icons-vue/es/warning/16';
import IconTime from '@carbon/icons-vue/es/time/16';
import stores from '@/store';
import i18n from '@/i18n';

defineEmits(['close']);

const globalStore = stores.GlobalStore();
const controlStore = stores.ControlStore();
const eventLogStore = stores.EventLogStore();

const activeTab = ref(0);
const firmwareSwitchElapsedTime = ref('0:00');
const firmwareUpdateElapsedTime = ref('0:00');
const bmcRebootElapsedTime = ref('0:00');
const dumpElapsedTime = ref('0:00');
const serverPowerElapsedTime = ref('0:00');
const immediateTestElapsedTime = ref('0:00');
const lampTestElapsedTime = ref('0:00');
let timerInterval = null;

const firmwareSwitchSteps = computed(() => [
  {
    title: i18n.global.t('appHeader.firmwareStep1'),
    description: i18n.global.t('appHeader.firmwareStep1Desc'),
  },
  {
    title: i18n.global.t('appHeader.firmwareStep2'),
    description: i18n.global.t('appHeader.firmwareStep2Desc'),
  },
  {
    title: i18n.global.t('appHeader.firmwareStep3'),
    description: i18n.global.t('appHeader.firmwareStep3Desc'),
  },
]);

const firmwareUpdateSteps = computed(() => [
  {
    title:
      i18n.global.t('pageFirmware.toast.updateFirmware.step1') ||
      'Uploading Image',
    description:
      i18n.global.t('pageFirmware.toast.updateFirmware.step1Message') ||
      'Image upload in progress',
  },
  {
    title:
      i18n.global.t('pageFirmware.toast.updateFirmware.step2') ||
      'Activating Image',
    description:
      i18n.global.t('pageFirmware.toast.updateFirmware.step2Message') ||
      'Image activation in progress',
  },
  {
    title:
      i18n.global.t('pageFirmware.toast.updateFirmware.step3') || 'BMC Reboot',
    description:
      i18n.global.t('pageFirmware.toast.updateFirmware.step3Message') ||
      'Waiting for BMC to reboot',
  },
  {
    title:
      i18n.global.t('pageFirmware.toast.updateFirmware.step4') ||
      'Verification Complete',
    description:
      i18n.global.t('pageFirmware.toast.updateFirmware.step4Message') ||
      'Firmware update verified',
  },
]);

const bmcRebootSteps = computed(() => [
  {
    title: i18n.global.t('pageRebootBmc.rebootBmc') || 'Initiate Reboot',
    description:
      i18n.global.t('pageRebootBmc.modal.confirmTitle') ||
      'BMC reboot signal sent',
  },
  {
    title: i18n.global.t('appHeader.firmwareStep2') || 'BMC Rebooting',
    description:
      i18n.global.t('appHeader.firmwareStep2Desc') ||
      'Waiting for BMC services to come online',
  },
  {
    title: i18n.global.t('appHeader.completed') || 'Reboot Complete',
    description:
      i18n.global.t('pageRebootBmc.toast.successRebootCompleted') ||
      'BMC is accessible and ready',
  },
]);

const firmwareSwitchInProgress = computed(
  () => globalStore.firmwareSwitchInProgress,
);
const firmwareSwitchStartTime = computed(
  () => globalStore.firmwareSwitchStartTime,
);
const firmwareSwitchCurrentStep = computed(
  () => globalStore.firmwareSwitchCurrentStep || 1,
);

const firmwareUpdateInProgress = computed(
  () => globalStore.firmwareUpdateInProgress,
);
const firmwareUpdateStartTime = computed(
  () => globalStore.firmwareUpdateStartTime,
);
const firmwareUpdateCurrentStep = computed(
  () => globalStore.firmwareUpdateCurrentStep || 1,
);

const bmcRebootInProgress = computed(() => globalStore.bmcRebootInProgress);
const bmcRebootStartTime = computed(() => globalStore.bmcRebootStartTime);
const bmcRebootCurrentStep = computed(
  () => globalStore.bmcRebootCurrentStep || 1,
);

const dumpGenerationInProgress = computed(
  () => globalStore.dumpGenerationInProgress,
);
const dumpGenerationStartTime = computed(
  () => globalStore.dumpGenerationStartTime,
);
const dumpGenerationType = computed(
  () => globalStore.dumpGenerationType || 'System',
);

const serverPowerInProgress = computed(() => globalStore.serverPowerInProgress);
const serverPowerStartTime = computed(() => globalStore.serverPowerStartTime);
const serverPowerOperationType = computed(
  () => globalStore.serverPowerOperationType || '',
);

const immediateTestInProgress = computed(
  () => globalStore.immediateTestInProgress,
);
const immediateTestStartTime = computed(
  () => globalStore.immediateTestStartTime,
);

const lampTestInProgress = computed(() => globalStore.lampTestInProgress);
const lampTestStartTime = computed(() => globalStore.lampTestStartTime);

const hasActiveOperations = computed(() => globalStore.hasActiveOperations);
const completedOperations = computed(
  () => globalStore.completedOperations || [],
);
const hasUnviewedNotifications = computed(
  () => globalStore.hasUnviewedNotifications,
);

const recentEvents = computed(() => {
  return (eventLogStore.allEventsGetter || []).slice(0, 15);
});

const criticalEvents = computed(() => {
  return (eventLogStore.allEventsGetter || []).filter(
    (e) => e.severity === 'Critical' && !e.status,
  );
});

const calculateTime = (startTime) => {
  if (!startTime) return '0:00';
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const updateAllTimers = () => {
  if (firmwareSwitchStartTime.value) {
    firmwareSwitchElapsedTime.value = calculateTime(
      firmwareSwitchStartTime.value,
    );
  }
  if (firmwareUpdateStartTime.value) {
    firmwareUpdateElapsedTime.value = calculateTime(
      firmwareUpdateStartTime.value,
    );
  }
  if (bmcRebootStartTime.value) {
    bmcRebootElapsedTime.value = calculateTime(bmcRebootStartTime.value);
  }
  if (dumpGenerationStartTime.value) {
    dumpElapsedTime.value = calculateTime(dumpGenerationStartTime.value);
  }
  if (serverPowerStartTime.value) {
    serverPowerElapsedTime.value = calculateTime(serverPowerStartTime.value);
  }
  if (immediateTestStartTime.value) {
    immediateTestElapsedTime.value = calculateTime(
      immediateTestStartTime.value,
    );
  }
  if (lampTestStartTime.value) {
    lampTestElapsedTime.value = calculateTime(lampTestStartTime.value);
  }
};

const startTimerLoop = () => {
  if (!timerInterval) {
    updateAllTimers();
    timerInterval = setInterval(updateAllTimers, 1000);
  }
};

const stopTimerLoop = () => {
  if (timerInterval && !hasActiveOperations.value) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

const formatCompletedTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
};

const formatDuration = (ms) => {
  if (!ms) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${seconds}s`;
};

const removeOperation = (operationId) => {
  globalStore.removeCompletedOperation(operationId);
};

// When controlStore.isOperationInProgress goes true→false, the server power
// operation has actually reached the target state. Mark it complete.
watch(
  () => controlStore.isOperationInProgress,
  (isInProgress) => {
    if (!isInProgress && globalStore.serverPowerInProgress) {
      globalStore.setServerPowerInProgress({
        inProgress: false,
        success: true,
      });
    }
  },
);

watch(hasActiveOperations, (newVal) => {
  if (newVal) {
    startTimerLoop();
    activeTab.value = 0;
  } else {
    stopTimerLoop();
  }
});

watch(activeTab, (newVal) => {
  if (newVal === 1) {
    globalStore.markNotificationsAsViewed();
  }
});

onMounted(() => {
  if (hasActiveOperations.value) {
    startTimerLoop();
  }
});

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
});
</script>

<style lang="scss" scoped>
.notification-panel {
  position: fixed;
  top: $header-height;
  right: 0;
  width: 360px;
  max-width: 90vw;
  height: calc(100vh - #{$header-height});
  background-color: #262626;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideIn $duration--moderate-02 $entrance-easing--productive;

  @include media-breakpoint-down(sm) {
    width: 100vw;
    max-width: 100vw;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #393939;
  background-color: #262626;
  flex-shrink: 0;

  h5 {
    color: #f4f4f4;
    font-weight: 600;
    font-size: 0.875rem;
    margin: 0;
  }

  .close-btn {
    padding: 0.25rem;
    color: #c6c6c6;
    transition: $transition-base;

    &:hover {
      background-color: #393939;
      color: #f4f4f4;
    }

    &:focus {
      outline: 2px solid $primary;
      outline-offset: -2px;
    }
  }
}

.notification-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.tabs-nav) {
    background-color: #262626;
    border-bottom: 1px solid #393939;
    padding: 0;
    margin: 0;
    flex-shrink: 0;

    .nav-item {
      flex: 1;
      margin: 0;

      .nav-link {
        border: none;
        border-bottom: 2px solid transparent;
        border-radius: 0;
        padding: 0.75rem 0.5rem;
        font-size: 0.8125rem;
        font-weight: 400;
        color: #c6c6c6 !important;
        text-align: center;
        transition: $transition-base;
        outline: none !important;
        box-shadow: none !important;

        &:hover {
          background-color: #393939;
          color: #f4f4f4 !important;
        }

        &.active {
          color: #f4f4f4 !important;
          border-bottom-color: #0f62fe;
          background-color: #262626;
        }
      }
    }
  }

  .tab-title-with-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
  }

  .tab-notification-badge,
  .tab-active-indicator {
    display: inline-block;
    width: 7px;
    height: 7px;
    background-color: #0f62fe;
    border-radius: 50%;
  }

  .tab-alert-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background-color: #da1e28;
    color: #ffffff;
    font-size: 0.6875rem;
    font-weight: 600;
    border-radius: 8px;
  }

  :deep(.tab-content) {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  :deep(.tab-pane) {
    flex: 1;
    overflow-y: auto;
    display: none;
    flex-direction: column;

    &.active {
      display: flex;
    }
  }
}

.notification-body {
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background-color: #262626;
}

.widget-card {
  background-color: #262626;
  padding: 0;
  border-bottom: 1px solid #393939;
}

.widget-header {
  display: flex;
  align-items: center;
  padding: 0.875rem 1rem;
  background-color: #262626;
  border-bottom: 1px solid #333333;

  .widget-icon {
    margin-right: 0.75rem;
    fill: #0f62fe;
  }

  h6 {
    margin: 0;
    font-weight: 600;
    font-size: 0.9375rem;
    color: #f4f4f4;
    flex: 1;
  }
}

.single-step-indicator {
  display: flex;
  align-items: center;
  padding: 1rem;
  gap: 0.75rem;

  .loading-circle {
    width: 20px;
    height: 20px;
    border: 2px solid #393939;
    border-top-color: #0f62fe;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    flex-shrink: 0;
  }

  .step-details {
    flex: 1;
    .step-name {
      font-size: 0.875rem;
      color: #f4f4f4;
      margin-bottom: 0.25rem;
    }
    .step-desc {
      font-size: 0.75rem;
      color: #c6c6c6;
    }
  }
}

.operation-progress {
  .steps-list {
    display: flex;
    flex-direction: column;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    padding: 0.875rem 1rem;
    border-bottom: 1px solid #333333;

    &.step-completed {
      .step-indicator {
        color: #42be65;
        svg {
          fill: #42be65;
          width: 18px;
          height: 18px;
        }
      }
      .step-name {
        color: #f4f4f4;
      }
    }

    &.step-active {
      background-color: #2a2a2a;
      .step-name {
        color: #f4f4f4;
        font-weight: 600;
      }
    }

    &.step-pending {
      .step-indicator {
        background-color: #525252;
        color: #c6c6c6;
      }
      .step-name {
        color: #8d8d8d;
      }
    }

    .step-indicator {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
      flex-shrink: 0;
      font-size: 0.75rem;

      .loading-circle {
        width: 16px;
        height: 16px;
        border: 2px solid #393939;
        border-top-color: #0f62fe;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
    }

    .step-details {
      flex: 1;
      .step-name {
        font-size: 0.8125rem;
        margin-bottom: 0.2rem;
      }
      .step-desc {
        font-size: 0.75rem;
        color: #a8a8a8;
        line-height: 1.35;
      }
    }
  }

  .elapsed-time {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1rem;
    background-color: #1f1f1f;
    font-size: 0.75rem;
    color: #c6c6c6;

    .time-icon {
      margin-right: 0.5rem;
      fill: #c6c6c6;
    }
  }
}

.completed-list {
  display: flex;
  flex-direction: column;
}

.completed-notification {
  display: flex;
  align-items: flex-start;
  padding: 0.875rem 1rem;
  background-color: #262626;
  border-bottom: 1px solid #393939;
  transition: $transition-base;

  &:hover {
    background-color: #333333;
  }

  &.alert-critical {
    border-left: 3px solid #da1e28;
  }

  .notification-icon {
    margin-right: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .success-icon {
      fill: #42be65;
      width: 16px;
      height: 16px;
    }
    .critical-icon {
      fill: #da1e28;
      width: 16px;
      height: 16px;
    }
    .warning-icon {
      fill: #f1c21b;
      width: 16px;
      height: 16px;
    }
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-title {
    font-weight: 600;
    font-size: 0.8125rem;
    color: #f4f4f4;
    margin-bottom: 0.2rem;
  }

  .notification-message {
    font-size: 0.8125rem;
    color: #c6c6c6;
    margin-bottom: 0.35rem;
    line-height: 1.35;
    word-break: break-word;
  }

  .notification-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.6875rem;
    color: #8d8d8d;
  }

  .notification-severity {
    font-weight: 600;
  }

  .notification-close {
    padding: 0.25rem;
    color: #c6c6c6;
    margin-left: 0.5rem;

    &:hover {
      color: #f4f4f4;
      background-color: #393939;
    }

    svg {
      width: 16px;
      height: 16px;
    }
  }
}

.no-operations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
  min-height: 280px;

  .success-icon-large {
    width: 44px;
    height: 44px;
    fill: #525252;
    margin-bottom: 1rem;
  }

  h6 {
    color: #f4f4f4;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #8d8d8d;
    font-size: 0.8125rem;
    line-height: 1.4;
    margin: 0;
    max-width: 260px;
  }
}
</style>
