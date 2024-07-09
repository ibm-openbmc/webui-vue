//TODO: Work Requird -->
import EventLogStore from './modules/Logs/EventLogStore';
import GlobalStore from './modules/GlobalStore';
import AuthenticationStore from './modules/Authentication/AuthenticationStore';
import FirmwareStore from './modules/Operations/FirmwareStore';
import SystemStore from './modules/HardwareStatus/SystemStore';
import NetworkStore from './modules/Settings/NetworkStore';
import PowerControlStore from './modules/ResourceManagement/PowerControlStore';
import KeyClearStore from './modules/Operations/KeyClearStore';

// ... (export use other stores)
export {
  EventLogStore,
  GlobalStore,
  AuthenticationStore,
  FirmwareStore,
  SystemStore,
  NetworkStore,
  PowerControlStore,
  KeyClearStore,
};
