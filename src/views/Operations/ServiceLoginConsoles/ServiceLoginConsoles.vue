<template>
  <div :class="isFullWindow ? 'full-window-container' : 'terminal-container'">
    <BRow class="d-flex">
      <BCol sm="6" lg="5" xl="4" class="d-flex flex-column justify-content-end">
        <dl class="mb-2" sm="6" md="6">
          <dt class="d-inline font-weight-bold mr-1">
            {{ $t('pageServiceLoginConsoles.status') }}:
          </dt>
          <dd class="d-inline">
            <status-icon :status="serverStatusIcon" /> {{ connectionStatus }}
          </dd>
        </dl>
      </BCol>

      <BCol
        v-if="!isFullWindow"
        class="d-flex justify-content-end align-items-end"
      >
        <BButton variant="link" type="button" @click="openConsoleWindow()">
          <icon-launch />
          {{ $t('global.action.openNewTab') }}
        </BButton>
      </BCol>
    </BRow>
    <div id="terminal" ref="panel"></div>
  </div>
</template>

<script setup>
import {
  ref,
  computed,
  watch,
  onBeforeMount,
  onMounted,
  onBeforeUnmount,
  useTemplateRef,
} from 'vue';
import eventBus from '@/eventBus';
import i18n from '@/i18n';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Terminal } from 'xterm';
import { throttle } from 'lodash';
import IconLaunch from '@carbon/icons-vue/es/launch/20';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import { GlobalStore, ChassisStore, AuthenticationStore } from '@/store';

const props = defineProps({
  isFullWindow: {
    type: Boolean,
    default: true,
  },
  consoleType: {
    type: String,
    default: sessionStorage.getItem('storedConsoleType'),
  },
});

const panel = useTemplateRef('panel');

const chassisStore = ChassisStore();
const authenticationStore = AuthenticationStore();
const globalStore = GlobalStore();

const checkingServerStatus = ref(null); // used to prevent extra api calls
const resizeConsoleWindow = ref(null);
const ws = ref(null); // websocket object
const wsConnection = ref(null); // websocket connection status

const serverStatus = computed(() => {
  let status = false;
  if (props.consoleType === 'bmc-console') status = wsConnection.value;
  if (props.consoleType === 'console1') {
    status = powerStatus.value !== 'Off' && wsConnection.value;
  }

  return status;
});

const powerStatus = computed(() => {
  return chassisStore.powerStateGetter;
});

const serverStatusIcon = computed(() => {
  return serverStatus.value ? 'success' : 'danger';
});

const connectionStatus = computed(() => {
  return serverStatus.value
    ? i18n.global.t('global.status.connected')
    : i18n.global.t('global.status.disconnected');
});

watch(checkingServerStatus, (value) => {
  if (value) {
    setTimeout(async () => {
      await globalStore.getSystemInfo().finally(() => {
        checkingServerStatus.value = false;
      });
    }, 5000); // 5 seconds
  }
});

const openTerminal = (selectedConsole = props.consoleType) => {
  const token = authenticationStore.token;
  let host = window.location.origin.replace('https://', '');
  host = host.replace(/\/$/, '');
  ws.value = new WebSocket(`wss://${host}/${selectedConsole}`, [token]);

  // Refer https://github.com/xtermjs/xterm.js/ for xterm implementation and addons.

  const term = new Terminal({
    fontSize: 15,
    fontFamily:
      'SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
  });

  const attachAddon = new AttachAddon(ws.value);
  term.loadAddon(attachAddon);

  const fitAddon = new FitAddon();
  term.loadAddon(fitAddon);

  const SOL_THEME = {
    background: '#19273c',
    cursor: 'rgba(83, 146, 255, .5)',
    scrollbar: 'rgba(83, 146, 255, .5)',
  };
  term.setOption('theme', SOL_THEME);

  term.open(panel.value);
  fitAddon.fit();

  resizeConsoleWindow.value = throttle(() => {
    fitAddon.fit();
  }, 1000);
  window.addEventListener('resize', resizeConsoleWindow.value);

  try {
    ws.value.onopen = () => {
      wsConnection.value = true;
      console.log(`websocket ${selectedConsole}/ opened`);
    };
    ws.value.onclose = (event) => {
      wsConnection.value = false;
      console.log(
        `websocket ${selectedConsole}/ closed.
            code: ${event.code}
            reason: ${event.reason}`
      );
    };
    ws.value.onmessage = () => {
      if (!checkingServerStatus.value) {
        checkingServerStatus.value = true;
      }
    };
  } catch (error) {
    console.log(error);
  }
};

const openConsoleWindow = () => {
  sessionStorage.setItem('storedConsoleType', props.consoleType);
  window.open(
    `${window.location.origin}/console/service-login-consoles`,
    '_blank',
    'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=600,height=550'
  );
};

onBeforeMount(() => {
  Promise.all([globalStore.getSystemInfo(), chassisStore.getPowerState()]);
});

onMounted(() => {
  openTerminal();
  eventBus.emit('loading-bar-status', true);
});

onBeforeUnmount(() => {
  ws.value.close();
  window.removeEventListener('resize', resizeConsoleWindow.value);
});
</script>

<style lang="scss" scoped>
#terminal {
  overflow: auto;
}

.full-window-container {
  width: 97%;
  margin: 1.5%;
}
</style>
