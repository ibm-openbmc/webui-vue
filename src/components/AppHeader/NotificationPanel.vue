<template>
  <div class="notification-panel">
    <div class="notification-header">
      <h5 class="mb-0">{{ $t('appHeader.systemMonitor') }}</h5>
      <b-button
        variant="link"
        size="sm"
        class="close-btn"
        @click="$emit('close')"
      >
        <icon-close :title="$t('global.action.close')" />
      </b-button>
    </div>

    <!-- Tabs -->
    <b-tabs v-model="activeTab" class="notification-tabs" nav-class="tabs-nav">
      <!-- Active Tab -->
      <b-tab :title="$t('appHeader.active')">
        <div class="notification-body">
          <!-- Firmware Switch Progress Widget -->
          <div
            v-if="firmwareSwitchInProgress"
            class="widget-card firmware-progress"
          >
            <div class="widget-header">
              <icon-upgrade class="widget-icon" />
              <h6>{{ $t('appHeader.firmwareSwitchProgress') }}</h6>
            </div>

            <div class="progress-content">
              <!-- Progress Steps -->
              <div class="steps-list">
                <div
                  v-for="(step, index) in steps"
                  :key="index"
                  class="step-item"
                  :class="{
                    'step-completed': index < currentStep - 1,
                    'step-active': index === currentStep - 1,
                    'step-pending': index > currentStep - 1,
                  }"
                >
                  <div class="step-indicator">
                    <icon-checkmark-filled v-if="index < currentStep - 1" />
                    <div
                      v-else-if="index === currentStep - 1"
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
                  >{{ $t('appHeader.elapsedTime') }}: {{ elapsedTime }}</span
                >
              </div>
            </div>
          </div>

          <!-- No Active Operations -->
          <div v-else class="no-operations">
            <icon-checkmark class="success-icon-large" />
            <h6>{{ $t('appHeader.noActiveOperations') }}</h6>
            <p>{{ $t('appHeader.noActiveOperationsMessage') }}</p>
          </div>
        </div>
      </b-tab>

      <!-- Completed Tab -->
      <b-tab>
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
              <b-button
                variant="link"
                size="sm"
                class="notification-close"
                @click="removeOperation(operation.id)"
              >
                <icon-close-small />
              </b-button>
            </div>
          </div>

          <!-- No Completed Operations -->
          <div v-else class="no-operations">
            <icon-checkmark class="success-icon-large" />
            <h6>{{ $t('appHeader.noCompletedOperations') }}</h6>
            <p>{{ $t('appHeader.noCompletedOperationsMessage') }}</p>
          </div>
        </div>
      </b-tab>
    </b-tabs>
  </div>
</template>

<script>
import IconClose from '@carbon/icons-vue/es/close/20';
import IconCloseSmall from '@carbon/icons-vue/es/close/16';
import IconUpgrade from '@carbon/icons-vue/es/upgrade/20';
import IconCheckmark from '@carbon/icons-vue/es/checkmark--filled/32';
import IconCheckmarkFilled from '@carbon/icons-vue/es/checkmark--filled/16';
import IconTime from '@carbon/icons-vue/es/time/16';

export default {
  name: 'NotificationPanel',
  components: {
    IconClose,
    IconCloseSmall,
    IconUpgrade,
    IconCheckmark,
    IconCheckmarkFilled,
    IconTime,
  },
  data() {
    return {
      activeTab: 0,
      elapsedTime: '0:00',
      timeInterval: null,
      steps: [
        {
          title: this.$t('appHeader.firmwareStep1'),
          description: this.$t('appHeader.firmwareStep1Desc'),
        },
        {
          title: this.$t('appHeader.firmwareStep2'),
          description: this.$t('appHeader.firmwareStep2Desc'),
        },
        {
          title: this.$t('appHeader.firmwareStep3'),
          description: this.$t('appHeader.firmwareStep3Desc'),
        },
      ],
    };
  },
  computed: {
    firmwareSwitchInProgress() {
      return this.$store.getters['global/firmwareSwitchInProgress'] || false;
    },
    startTime() {
      return this.$store.getters['global/firmwareSwitchStartTime'];
    },
    currentStep() {
      return this.$store.getters['global/firmwareSwitchCurrentStep'] || 1;
    },
    currentStepTitle() {
      if (this.currentStep <= this.steps.length) {
        return this.steps[this.currentStep - 1].title;
      }
      return this.$t('appHeader.completed');
    },
    currentStepMessage() {
      if (this.currentStep <= this.steps.length) {
        return this.steps[this.currentStep - 1].description;
      }
      return this.$t('appHeader.firmwareSwitchComplete');
    },
    completedOperations() {
      return this.$store.getters['global/completedOperations'] || [];
    },
    hasUnviewedNotifications() {
      return this.$store.getters['global/hasUnviewedNotifications'];
    },
  },
  watch: {
    firmwareSwitchInProgress(newVal) {
      if (newVal) {
        this.startTracking();
        this.activeTab = 0; // Switch to Active tab
      } else {
        this.stopTracking();
      }
    },
    activeTab(newVal) {
      // When user clicks on Done tab (index 1), mark notifications as viewed
      if (newVal === 1) {
        this.$store.commit('global/markNotificationsAsViewed');
      }
    },
  },
  mounted() {
    if (this.firmwareSwitchInProgress) {
      this.startTracking();
    }
  },
  beforeDestroy() {
    this.stopTracking();
  },
  methods: {
    startTracking() {
      this.updateElapsedTime();
      this.timeInterval = setInterval(this.updateElapsedTime, 1000);
    },
    stopTracking() {
      if (this.timeInterval) {
        clearInterval(this.timeInterval);
        this.timeInterval = null;
      }
    },
    updateElapsedTime() {
      if (!this.startTime) return;
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      this.elapsedTime = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    },
    formatCompletedTime(timestamp) {
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
    },
    formatDuration(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
      }
      return `${seconds}s`;
    },
    removeOperation(operationId) {
      this.$store.commit('global/removeCompletedOperation', operationId);
    },
  },
};
</script>

<style lang="scss" scoped>
// Carbon notification panel style
.notification-panel {
  position: fixed;
  top: $header-height;
  right: 0;
  width: 320px;
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

  ::v-deep .tabs-nav {
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
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
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

        &:focus {
          outline: none !important;
          box-shadow: none !important;
        }

        &.active {
          color: #f4f4f4 !important;
          border-bottom-color: #0f62fe;
          background-color: #262626;
          font-weight: 400;
          outline: none !important;
          box-shadow: none !important;
        }
      }
    }
  }

  .tab-title-with-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tab-notification-badge {
    display: inline-block;
    width: 8px;
    height: 8px;
    background-color: #0f62fe;
    border-radius: 50%;
  }

  ::v-deep .tab-content {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  ::v-deep .tab-pane {
    flex: 1;
    overflow-y: auto;
    display: none;
    flex-direction: column;
    opacity: 1;
    transition: none;

    &.active {
      display: flex;
    }

    &.fade {
      transition: none;
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
  border: none;
  border-bottom: 1px solid #393939;
  box-shadow: none;
  margin-bottom: 0;
}

.widget-header {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: none;
  background-color: #262626;

  .widget-icon {
    margin-right: 0.75rem;
    fill: #f4f4f4;
  }

  h6 {
    margin: 0;
    font-weight: 600;
    font-size: 1rem;
    color: #f4f4f4;
    flex: 1;
  }
}

.firmware-progress {
  .progress-content {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .steps-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    padding: 1rem;
    background-color: #262626;
    border-bottom: 1px solid #393939;
    border-left: none;
    transition: $transition-base;

    &.step-completed {
      background-color: #262626;
      border-left: none;

      .step-indicator {
        background-color: transparent;
        color: #42be65;

        svg {
          fill: #42be65;
          width: 20px;
          height: 20px;
        }
      }

      .step-name {
        color: #f4f4f4;
        font-weight: 400;
      }
    }

    &.step-active {
      background-color: #262626;
      border-left: none;

      .step-indicator {
        background-color: transparent;
        color: #0f62fe;
      }

      .step-name {
        color: #f4f4f4;
        font-weight: 400;
      }
    }

    &.step-pending {
      background-color: #262626;
      border-left: none;

      .step-indicator {
        background-color: #525252;
        color: #c6c6c6;
      }

      .step-name {
        color: #c6c6c6;
      }
    }

    .step-indicator {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 0.75rem;
      flex-shrink: 0;
      font-weight: 600;
      font-size: 0.75rem;

      svg {
        width: 16px;
        height: 16px;
      }

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
        font-size: 0.875rem;
        margin-bottom: 0.25rem;
      }

      .step-desc {
        font-size: 0.75rem;
        color: #c6c6c6;
        line-height: 1.4;
      }
    }
  }

  .elapsed-time {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem;
    background-color: #262626;
    border-top: 1px solid #393939;
    font-size: 0.75rem;
    color: #c6c6c6;
    font-weight: 400;

    .time-icon {
      margin-right: 0.5rem;
      fill: #c6c6c6;
    }
  }
}

.completed-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.completed-notification {
  display: flex;
  align-items: flex-start;
  padding: 1rem;
  background-color: #262626;
  border-left: none;
  border-bottom: 1px solid #393939;
  transition: $transition-base;

  &:hover {
    background-color: #333333;
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
  }

  .notification-content {
    flex: 1;
    min-width: 0;
  }

  .notification-title {
    font-weight: 600;
    font-size: 0.875rem;
    color: #f4f4f4;
    margin-bottom: 0.25rem;
  }

  .notification-message {
    font-size: 0.875rem;
    color: #c6c6c6;
    margin-bottom: 0.5rem;
    line-height: 1.4;
  }

  .notification-meta {
    display: flex;
    gap: 0.75rem;
    font-size: 0.75rem;
    color: #8d8d8d;
  }

  .notification-time {
    font-style: normal;
  }

  .notification-duration {
    font-weight: 400;
  }

  .notification-close {
    padding: 0.25rem;
    color: #c6c6c6;
    margin-left: 0.5rem;
    transition: $transition-base;

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
  min-height: 300px;

  .success-icon-large {
    width: 48px;
    height: 48px;
    fill: #525252;
    margin-bottom: 1rem;
  }

  h6 {
    color: #f4f4f4;
    font-weight: 600;
    font-size: 1.125rem;
    margin-bottom: 0.5rem;
  }

  p {
    color: #8d8d8d;
    font-size: 0.875rem;
    line-height: 1.4;
    margin: 0;
    max-width: 280px;
  }
}
</style>
