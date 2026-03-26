<template>
  <div
    role="main"
    aria-label="terminal"
    :class="isFullWindow ? 'full-window-container' : 'terminal-container'"
  >
    <BRow class="d-flex">
      <BCol class="d-flex flex-column justify-content-end">
        <dl role="group" class="mb-2" sm="6" md="6">
          <dt class="d-inline fw-bold me-1">
            {{ $t('pageHostConsole.status') }}:
          </dt>
          <dd class="d-inline">
            <status-icon :status="serverStatusIcon" /> {{ connectionStatus }}
          </dd>
        </dl>
      </BCol>

      <BCol v-if="!isFullWindow" class="d-flex justify-content-end">
        <BButton variant="link" type="button" @click="openConsoleWindow()">
          <icon-launch />
          {{ $t('global.action.openNewTab') }}
        </BButton>
      </BCol>
    </BRow>
    <div id="terminal" ref="panel" role="log"></div>
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
import i18n from '@/i18n';
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Terminal } from 'xterm';
import { throttle } from 'lodash';
import IconLaunch from '@carbon/icons-vue/es/launch/20';
import StatusIcon from '@/components/Global/StatusIcon.vue';
import stores from '@/store';
import { buildWsUrl, buildUrlNewTab } from '@/utilities/url';

defineProps({
  isFullWindow: {
    type: Boolean,
    default: true,
  },
});

const panel = useTemplateRef('panel');

const chassisStore = stores.ChassisStore();
const authenticationStore = stores.AuthenticationStore();

const checkingServerStatus = ref(null); // used to prevent extra api calls
const resizeConsoleWindow = ref(null);
const ws = ref(null); // websocket object
const wsConnection = ref(null); // websocket connection status

onBeforeMount(() => {
  chassisStore.getPowerState();
});

onMounted(() => {
  openTerminal();
});

onBeforeUnmount(() => {
  ws.value.close();
  window.removeEventListener('resize', resizeConsoleWindow.value);
});

const serverStatus = computed(() => {
  return chassisStore.powerStateGetter !== 'Off' && wsConnection.value;
});

const serverStatusIcon = computed(() => {
  return serverStatus.value ? 'success' : 'danger';
});

const connectionStatus = computed(() => {
  return serverStatus.value
    ? i18n.global.t('global.status.connected')
    : i18n.global.t('global.status.disconnected');
});

watch(checkingServerStatus, async (value) => {
  if (value) {
    setTimeout(async () => {
      await chassisStore.getPowerState().finally(() => {
        checkingServerStatus.value = false;
      });
    }, 5000); // 5 seconds
  }
});

function openTerminal() {
  const token = authenticationStore.token;

  ws.value = new WebSocket(buildWsUrl('/console0'), [token]);

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

  const xtermElement = panel.value.querySelector('.terminal.xterm');
  if (xtermElement) {
    xtermElement.setAttribute('role', 'application');
    xtermElement.setAttribute('aria-label', 'host-console');
  }

  resizeConsoleWindow.value = throttle(() => {
    fitAddon.fit();
  }, 1000);
  window.addEventListener('resize', resizeConsoleWindow.value);

  try {
    ws.value.onopen = () => {
      wsConnection.value = true;
      console.log('websocket console0/ opened');
    };
    ws.value.onclose = (event) => {
      wsConnection.value = false;
      console.log(
        `websocket console0/ closed.
            code: ${event.code}
            reason: ${event.reason}`,
      );
    };
    ws.value.onmessage = () => {
      if (!checkingServerStatus.value) {
        checkingServerStatus.value = true;
        chassisStore.getPowerState();
      }
    };
  } catch (error) {
    console.log(error);
  }
}

function openConsoleWindow() {
  window.open(
    buildUrlNewTab(`/#/console/host-console-console`),
    '_blank',
    'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=600,height=550',
  );
}
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
