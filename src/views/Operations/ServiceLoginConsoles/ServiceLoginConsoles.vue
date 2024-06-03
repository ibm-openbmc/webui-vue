<template>
  <div :class="isFullWindow ? 'full-window-container' : 'terminal-container'">
    <b-row class="d-flex">
      <b-col
        sm="6"
        lg="5"
        xl="4"
        class="d-flex flex-column justify-content-end"
      >
        <dl class="mb-2" sm="6" md="6">
          <dt class="d-inline font-weight-bold mr-1">
            {{ $t('pageServiceLoginConsoles.status') }}:
          </dt>
          <dd class="d-inline">
            <status-icon :status="serverStatusIcon" /> {{ connectionStatus }}
          </dd>
        </dl>
      </b-col>

      <b-col
        v-if="!isFullWindow"
        class="d-flex justify-content-end align-items-end"
      >
        <b-button variant="link" type="button" @click="openConsoleWindow()">
          <icon-launch />
          {{ $t('global.action.openNewTab') }}
        </b-button>
      </b-col>
    </b-row>
    <div id="terminal" ref="panel"></div>
  </div>
</template>

<script>
import { AttachAddon } from 'xterm-addon-attach';
import { FitAddon } from 'xterm-addon-fit';
import { Terminal } from 'xterm';
import { throttle } from 'lodash';
import IconLaunch from '@carbon/icons-vue/es/launch/20';
import StatusIcon from '@/components/Global/StatusIcon';

export default {
  name: 'ServiceLoginConsoles',
  components: {
    IconLaunch,
    StatusIcon,
  },
  props: {
    isFullWindow: {
      type: Boolean,
      default: true,
    },
    consoleType: {
      type: String,
      default: sessionStorage.getItem('storedConsoleType'),
    },
  },
  data() {
    return {
      checkingServerStatus: null, // used to prevent extra api calls
      resizeConsoleWindow: null,
      ws: null, // websocket object
      wsConnection: null, // websocket connection status
    };
  },
  computed: {
    serverStatus() {
      let status = null;
      if (this.consoleType === 'bmc-console') status = this.wsConnection;
      if (this.consoleType === 'console1')
        status =
          this.$store.getters['chassis/powerState'] !== 'Off' &&
          this.wsConnection;

      return status;
    },
    serverStatusIcon() {
      return this.serverStatus ? 'success' : 'danger';
    },
    connectionStatus() {
      return this.serverStatus
        ? this.$t('global.status.connected')
        : this.$t('global.status.disconnected');
    },
  },
  watch: {
    async checkingServerStatus(value) {
      if (value) {
        setTimeout(async () => {
          await this.$store.dispatch('global/getSystemInfo').finally(() => {
            this.checkingServerStatus = false;
          });
        }, 5000); // 5 seconds
      }
    },
  },
  created() {
    this.$store.dispatch('global/getSystemInfo');
  },
  mounted() {
    this.openTerminal();
  },
  beforeDestroy() {
    this.ws.close();
    window.removeEventListener('resize', this.resizeConsoleWindow);
  },
  methods: {
    openTerminal(selectedConsole = this.consoleType) {
      const token = this.$store.getters['authentication/token'];
      const host = `${window.location.origin.replace(
        'https://',
        ''
      )}${window.location.pathname.replace(/\/$/, '')}`;
      this.ws = new WebSocket(`wss://${host}/${selectedConsole}`, [token]);

      // Refer https://github.com/xtermjs/xterm.js/ for xterm implementation and addons.

      const term = new Terminal({
        fontSize: 15,
        fontFamily:
          'SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, Courier New, monospace',
      });

      const attachAddon = new AttachAddon(this.ws);
      term.loadAddon(attachAddon);

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);

      const SOL_THEME = {
        background: '#19273c',
        cursor: 'rgba(83, 146, 255, .5)',
        scrollbar: 'rgba(83, 146, 255, .5)',
      };
      term.setOption('theme', SOL_THEME);

      term.open(this.$refs.panel);
      fitAddon.fit();

      this.resizeConsoleWindow = throttle(() => {
        fitAddon.fit();
      }, 1000);
      window.addEventListener('resize', this.resizeConsoleWindow);

      try {
        this.ws.onopen = () => {
          this.wsConnection = true;
          console.log(`websocket ${selectedConsole}/ opened`);
        };
        this.ws.onclose = (event) => {
          this.wsConnection = false;
          console.log(
            `websocket ${selectedConsole}/ closed.
            code: ${event.code}
            reason: ${event.reason}`
          );
        };
        this.ws.onmessage = () => {
          if (!this.checkingServerStatus) {
            this.checkingServerStatus = true;
          }
        };
      } catch (error) {
        console.log(error);
      }
    },
    openConsoleWindow() {
      sessionStorage.setItem('storedConsoleType', this.consoleType);
      window.open(
        '#/console/service-login-consoles',
        '_blank',
        'directories=no,titlebar=no,toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=yes,width=600,height=550'
      );
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~xterm/css/xterm.css';

#terminal {
  overflow: auto;
}

.full-window-container {
  width: 97%;
  margin: 1.5%;
}
</style>
