//TODO: Work Requird -->
import EventLogStore from './modules/Logs/EventLogStore';
import GlobalStore from './modules/GlobalStore';
import AuthenticationStore from './modules/Authentication/AuthenticationStore';
import FirmwareStore from './modules/Operations/FirmwareStore';
import SystemStore from './modules/HardwareStatus/SystemStore';
import NetworkStore from './modules/Settings/NetworkStore';
import PowerControlStore from './modules/ResourceManagement/PowerControlStore';
import KeyClearStore from './modules/Operations/KeyClearStore';
import ControlStore from './modules/Operations/ControlStore';
import BootSettingsStore from './modules/Operations/BootSettingsStore';
import PowerPolicyStore from './modules/Settings/PowerPolicyStore';

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
  ControlStore,
  BootSettingsStore,
  PowerPolicyStore,
};
