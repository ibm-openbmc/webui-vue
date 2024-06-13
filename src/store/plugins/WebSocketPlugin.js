/**
 * WebSocketPlugin will allow us to get new data from the server
 * without having to poll for changes on the frontend.
 *
 * This plugin is subscribed to host state property and logging
 * changes, indicated in the app header Health and Power status.
 *
 * https://github.com/openbmc/docs/blob/b41aff0fabe137cdb0cfff584b5fe4a41c0c8e77/rest-api.md#event-subscription-protocol
 */
const WebSocketPlugin = (store) => {
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

  const initWebSocket = () => {
    const socketDisabled =
      process.env.VUE_APP_SUBSCRIBE_SOCKET_DISABLED === 'true' ? true : false;
    if (socketDisabled) return;
    const token = store.getters['authentication/token'];
    var host =
      window.location.origin.replace('https://', '') + window.location.pathname;
    host = host.replace(/\/$/, '');
    ws = new WebSocket(`wss://${host}/subscribe`, [token]);
    ws.onopen = () => {
      ws.send(JSON.stringify(data));
    };
    ws.onerror = (event) => {
      console.error(event);
    };
    ws.onmessage = (event) => {
      var JSONbig = require('json-bigint');
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
            store.commit('global/setPostCodeValue', finalValue);
          }
        }
      }
      if (eventInterface === 'xyz.openbmc_project.State.Host') {
        const { properties: { CurrentHostState } = {} } = data;
        if (CurrentHostState) {
          store.commit('global/setServerStatus', CurrentHostState);
        }
      } else if (path === '/xyz/openbmc_project/logging') {
        store.dispatch('eventLog/getEventLogData');
      }
    };
  };

  store.subscribe(({ type }) => {
    if (type === 'authentication/authSuccess') {
      initWebSocket();
    }
    if (type === 'authentication/logout') {
      if (ws) ws.close();
    }
  });

  if (store.getters['authentication/isLoggedIn']) initWebSocket();
};

export default WebSocketPlugin;
