import Vue from 'vue';
import Vuex from 'vuex';

import GlobalStore from './modules/GlobalStore';
import AuthenticationStore from './modules/Authentication/AuthenticanStore';
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
import SensorsStore from './modules/HardwareStatus/SensorsStore';
import ServerLedStore from './modules/HardwareStatus/ServerLedStore';
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
import PoliciesStore from './modules/SecurityAndAccess/PoliciesStore';
import FactoryResetStore from './modules/Operations/FactoryResetStore';
import HardwareDeconfigurationStore from './modules/Settings/HardwareDeconfigurationStore';
import KeyClearStore from './modules/Operations/KeyClearStore';
import IBMiServiceFunctionsStore from './modules/Logs/IBMiServiceFunctionsStore';
import SnmpAlertsStore from './modules/Settings/SnmpAlertsStore';
import WebSocketPlugin from './plugins/WebSocketPlugin';
import DateTimeStore from './modules/Settings/DateTimeStore';
import VirtualMediaStore from './modules/Operations/VirtualMediaStore';
import ResourceMemoryStore from './modules/ResourceManagement/ResourceMemoryStore';
import SystemParametersStore from './modules/ResourceManagement/SystemParametersStore';
import DeconfigurationRecordsStore from './modules/Logs/DeconfigurationRecordsStore';
import ConcurrentMaintenanceStore from './modules/HardwareStatus/ConcurrentMaintenanceStore';
import PcieSlotsStore from './modules/HardwareStatus/PcieSlotsStore';
import FabricAdaptersStore from './modules/HardwareStatus/FabricAdaptersStore';
Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  mutations: {},
  actions: {},
  modules: {
    global: GlobalStore,
    authentication: AuthenticationStore,
    concurrent: ConcurrentMaintenanceStore,
    sessions: SessionsStore,
    dateTime: DateTimeStore,
    ldap: LdapStore,
    userManagement: UserManagementStore,
    firmware: FirmwareStore,
    serverBootSettings: BootSettingsStore,
    controls: ControlStore,
    pcieTopology: PcieTopologyStore,
    powerControl: PowerControlStore,
    powerPolicy: PowerPolicyStore,
    powerSupply: PowerSupplyStore,
    network: NetworkStore,
    eventLog: EventLogStore,
    sensors: SensorsStore,
    serverLed: ServerLedStore,
    snmpAlerts: SnmpAlertsStore,
    certificates: CertificatesStore,
    system: SystemStore,
    memory: MemoryStore,
    fan: FanStore,
    chassis: ChassisStore,
    bmc: BmcStore,
    processors: ProcessorStore,
    assemblies: AssemblyStore,
    pcieSlots: PcieSlotsStore,
    postCodeLogs: PostCodeLogsStore,
    virtualMedia: VirtualMediaStore,
    policies: PoliciesStore,
    factoryReset: FactoryResetStore,
    keyClear: KeyClearStore,
    resourceMemory: ResourceMemoryStore,
    hardwareDeconfiguration: HardwareDeconfigurationStore,
    deconfigurationRecords: DeconfigurationRecordsStore,
    systemParameters: SystemParametersStore,
    fabricAdapters: FabricAdaptersStore,
    ibmiServiceFunctions: IBMiServiceFunctionsStore,
  },
  plugins: [WebSocketPlugin],
});
