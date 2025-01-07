import JSONbig from 'json-bigint';
import { AuthenticationStore, GlobalStore, EventLogStore } from '@/store';
/**
 * WebSocketPlugin will allow us to get new data from the server
 * without having to poll for changes on the frontend.
 *
 * This plugin is subscribed to host state property and logging
 * changes, indicated in the app header Health and Power status.
 *
 * https://github.com/openbmc/docs/blob/b41aff0fabe137cdb0cfff584b5fe4a41c0c8e77/rest-api.md#event-subscription-protocol
 */

let ws;
const data = {
  paths: [
    '/xyz/openbmc_project/state/host0',
    '/xyz/openbmc_project/logging',
    '/xyz/openbmc_project/state/boot/raw0',
  ],
  interfaces: [
    'xyz.openbmc_project.State.Host',
    'xyz.openbmc_project.Logging.Entry',
    'xyz.openbmc_project.State.Boot.Raw',
  ],
};

export const initWebSocket = () => {
  const globalStore = GlobalStore();
  const authenticationStore = AuthenticationStore();
  const eventLogStore = EventLogStore();

  const socketDisabled =
    import.meta.env.VITE_APP_SUBSCRIBE_SOCKET_DISABLED === 'true'
      ? true
      : false;

  if (socketDisabled) return;

  const token = authenticationStore.token;

  var host = window.location.origin.replace('https://', '');
  host = host.replace(/\/$/, '');
  ws = new WebSocket(`wss://${host}/subscribe`, [token]);
  ws.onopen = () => {
    ws.send(JSON.stringify(data));
  };
  ws.onerror = (event) => {
    console.error(event);
  };
  ws.onmessage = (event) => {
    var data = JSONbig.parse(event.data);
    const eventInterface = data.interface;
    const path = data.path;
    if (eventInterface === 'xyz.openbmc_project.State.Boot.Raw') {
      if (path === '/xyz/openbmc_project/state/boot/raw0') {
        const { properties: { Value } = {} } = data;
        if (Value) {
          if (Array.isArray(Value) && Value.length) {
            var finalValue = Value[0].c.join('');
          }
          globalStore.postCodeValue = finalValue;
        }
      }
    }
    if (eventInterface === 'xyz.openbmc_project.State.Host') {
      const { properties: { CurrentHostState } = {} } = data;
      if (CurrentHostState) {
        globalStore.serverStatus = CurrentHostState;
      }
    } else if (path === '/xyz/openbmc_project/logging') {
      eventLogStore.getEventLogData();
    }
  };
};

function WebSocketPlugin({ store }) {
  store.$onAction(({ name, _, after }) => {
    after(() => {
      if (name === 'authSuccess') {
        initWebSocket();
      }
      if (name === 'logout') {
        if (ws) ws.close();
      }
    });
  });
}

export default WebSocketPlugin;
