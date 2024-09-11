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
import FactoryResetStore from './modules/Operations/FactoryResetStore';
import ResourceMemoryStore from './modules/ResourceManagement/ResourceMemoryStore';
import PowerPolicyStore from './modules/Settings/PowerPolicyStore';
import IBMiServiceFunctionsStore from './modules/Logs/IBMiServiceFunctionsStore';
import AuditLogsStore from './modules/Logs/AuditLogsStore';
import CertificatesStore from './modules/SecurityAndAccess/CertificatesStore';
import UserManagementStore from './modules/SecurityAndAccess/UserManagementStore';
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
  FactoryResetStore,
  ResourceMemoryStore,
  PowerPolicyStore,
  IBMiServiceFunctionsStore,
  CertificatesStore,
  UserManagementStore,
  AuditLogsStore,
};
