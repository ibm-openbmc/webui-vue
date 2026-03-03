import JSONbig from 'json-bigint';
import stores from '@/store';
import { serverStateMapper } from '../modules/GlobalStore';
import { buildWsUrl } from '@/utilities/url';
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
  const globalStore = stores.GlobalStore();
  const authenticationStore = stores.AuthenticationStore();
  const eventLogStore = stores.EventLogStore();

  const socketDisabled =
    import.meta.env.VITE_APP_SUBSCRIBE_SOCKET_DISABLED === 'true'
      ? true
      : false;

  if (socketDisabled) return;

  const token = authenticationStore.token;

  ws = new WebSocket(buildWsUrl('/subscribe'), [token]);
  ws.onopen = () => {
    ws.send(JSON.stringify(data));
  };
  ws.onerror = (event) => {
    console.error(event);
  };
  ws.onmessage = (event) => {
    try {
      var data = JSONbig.parse(event.data);
      const eventInterface = data.interface;
      const path = data.path;
      if (eventInterface === 'xyz.openbmc_project.State.Boot.Raw') {
        if (path === '/xyz/openbmc_project/state/boot/raw0') {
          const { properties: { Value } = {} } = data;

          if (Value) {
            if (Array.isArray(Value) && Value.length) {
              const primaryPostCode = Value[0];
              if (Array.isArray(primaryPostCode)) {
                const finalValue = String.fromCharCode(...primaryPostCode);
                globalStore.postCodeValue = finalValue;
              }
            }
          }
        }
      }
      if (eventInterface === 'xyz.openbmc_project.State.Host') {
        const { properties: { CurrentHostState } = {} } = data;
        if (CurrentHostState) {
          globalStore.serverStatus = serverStateMapper(CurrentHostState);
        }
      } else if (path === '/xyz/openbmc_project/logging') {
        eventLogStore.getEventLogData();
      }
    } catch (error) {
      console.error('WebSocket message parse error:', error);
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
