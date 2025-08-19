import GlobalStore from './modules/GlobalStore';
import AuthenticationStore from './modules/Authentication/AuthenticationStore';
import SessionsStore from './modules/SecurityAndAccess/SessionsStore';
import LdapStore from './modules/SecurityAndAccess/LdapStore';
import UserManagementStore from './modules/SecurityAndAccess/UserManagementStore';
import CertificatesStore from './modules/SecurityAndAccess/CertificatesStore';
import FirmwareStore from './modules/Operations/FirmwareStore';
import BootSettingsStore from './modules/Operations/BootSettingsStore';
import ControlStore from './modules/Operations/ControlStore';
import PowerControlStore from './modules/ResourceManagement/PowerControlStore';
import PowerPolicyStore from './modules/Settings/PowerPolicyStore';
import NetworkStore from './modules/Settings/NetworkStore';
import EventLogStore from './modules/Logs/EventLogStore';
// import SensorsStore from './modules/HardwareStatus/SensorsStore';
// import ServerLedStore from './modules/HardwareStatus/ServerLedStore';
import SystemStore from './modules/HardwareStatus/SystemStore';
import PowerSupplyStore from './modules/HardwareStatus/PowerSupplyStore';
import MemoryStore from './modules/HardwareStatus/MemoryStore';
import FanStore from './modules/HardwareStatus/FanStore';
import ChassisStore from './modules/HardwareStatus/ChassisStore';
import BmcStore from './modules/HardwareStatus/BmcStore';
import ProcessorStore from './modules/HardwareStatus/ProcessorStore';
import AssemblyStore from './modules/HardwareStatus/AssemblyStore';
import PcieTopologyStore from './modules/HardwareStatus/PcieTopologyStore';
import PostCodeLogsStore from './modules/Logs/PostCodeLogsStore';
import AuditLogsStore from './modules/Logs/AuditLogsStore';
// import PoliciesStore from './modules/SecurityAndAccess/PoliciesStore';
import FactoryResetStore from './modules/Operations/FactoryResetStore';
import HardwareDeconfigurationStore from './modules/Settings/HardwareDeconfigurationStore';
// import KeyClearStore from './modules/Operations/KeyClearStore';
import NetworkSettingsStore from './modules/Operations/NetworkSettingsStore';
import IBMiServiceFunctionsStore from './modules/Logs/IBMiServiceFunctionsStore';
import SnmpAlertsStore from './modules/Settings/SnmpAlertsStore';
// import WebSocketPlugin from './plugins/WebSocketPlugin';
import DateTimeStore from './modules/Settings/DateTimeStore';
// import VirtualMediaStore from './modules/Operations/VirtualMediaStore';
import ResourceMemoryStore from './modules/ResourceManagement/ResourceMemoryStore';
import SystemParametersStore from './modules/ResourceManagement/SystemParametersStore';
import DeconfigurationRecordsStore from './modules/Logs/DeconfigurationRecordsStore';
import ConcurrentMaintenanceStore from './modules/HardwareStatus/ConcurrentMaintenanceStore';
import PcieSlotsStore from './modules/HardwareStatus/PcieSlotsStore';
import FabricAdaptersStore from './modules/HardwareStatus/FabricAdaptersStore';
// import stores from '@/store';
import DumpsStore from './modules/Logs/DumpsStore.js';
import KeyClearStore from './modules/Operations/KeyClearStore';
import LicenseStore from './modules/ResourceManagement/LicenseStore';
import FieldCoreOverrideStore from './modules/ResourceManagement/FieldCoreOverrideStore.js';

const stores = {};

  Object.assign(stores, {
    DumpsStore: DumpsStore,
  });
  // Object.assign(stores, {
  //   KeyClearStore: KeyClearStore,
  // });
  Object.assign(stores, {
    LicenseStore: LicenseStore,
  });
  Object.assign(stores, {
    FieldCoreOverrideStore: FieldCoreOverrideStore,
  });
// ... (export use other stores)

  Object.assign(stores, {
    GlobalStore: GlobalStore,
  });
    Object.assign(stores, {
    AuthenticationStore: AuthenticationStore,
  });
    Object.assign(stores, {
    ConcurrentMaintenanceStore: ConcurrentMaintenanceStore,
  });
    Object.assign(stores, {
    SessionsStore: SessionsStore,
  });
    Object.assign(stores, {
    DateTimeStore: DateTimeStore,
  });
    Object.assign(stores, {
    LdapStore: LdapStore,
  });
    Object.assign(stores, {
    UserManagementStore: UserManagementStore,
  });
    Object.assign(stores, {
    FirmwareStore: FirmwareStore,
  });
    Object.assign(stores, {
    BootSettingsStore: BootSettingsStore,
  });
    Object.assign(stores, {
    ControlStore: ControlStore,
  });
      Object.assign(stores, {
    PcieTopologyStore: PcieTopologyStore,
  });
      Object.assign(stores, {
    PowerControlStore: PowerControlStore,
  });
      Object.assign(stores, {
    PowerPolicyStore: PowerPolicyStore,
  });
      Object.assign(stores, {
    PowerPolicyStore: PowerPolicyStore,
  });
      Object.assign(stores, {
    PowerSupplyStore: PowerSupplyStore,
  });
      Object.assign(stores, {
    NetworkStore: NetworkStore,
  });
      Object.assign(stores, {
    EventLogStore: EventLogStore,
  });
      Object.assign(stores, {
    SnmpAlertsStore: SnmpAlertsStore,
  });
      Object.assign(stores, {
    CertificatesStore: CertificatesStore,
  });
      Object.assign(stores, {
    SystemStore: SystemStore,
  });
      Object.assign(stores, {
    MemoryStore: MemoryStore,
  });
      Object.assign(stores, {
    FanStore: FanStore,
  });
      Object.assign(stores, {
    ChassisStore: ChassisStore,
  });
      Object.assign(stores, {
    BmcStore: BmcStore,
  });
      Object.assign(stores, {
    ProcessorStore: ProcessorStore,
  });
      Object.assign(stores, {
    AssemblyStore: AssemblyStore,
  });
      Object.assign(stores, {
    PcieSlotsStore: PcieSlotsStore,
  });
      Object.assign(stores, {
    PostCodeLogsStore: PostCodeLogsStore,
  });
      Object.assign(stores, {
    AuditLogsStore: AuditLogsStore,
  });
      Object.assign(stores, {
    FactoryResetStore: FactoryResetStore,
  });
      Object.assign(stores, {
    KeyClearStore: KeyClearStore,
  });
      Object.assign(stores, {
    NetworkSettingsStore: NetworkSettingsStore,
  });
      Object.assign(stores, {
    ResourceMemoryStore: ResourceMemoryStore,
  });
      Object.assign(stores, {
    HardwareDeconfigurationStore: HardwareDeconfigurationStore,
  });
      Object.assign(stores, {
    DeconfigurationRecordsStore: DeconfigurationRecordsStore,
  });
      Object.assign(stores, {
    SystemParametersStore: SystemParametersStore,
  });
      Object.assign(stores, {
    FabricAdaptersStore: FabricAdaptersStore,
  });
      Object.assign(stores, {
    IBMiServiceFunctionsStore: IBMiServiceFunctionsStore,
  });

  export default stores;
