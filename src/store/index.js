import GlobalStore from './modules/GlobalStore';
import AuthenticationStore from './modules/Authentication/AuthenticationStore';
import UserManagementStore from './modules/SecurityAndAccess/UserManagementStore';
import CertificatesStore from './modules/SecurityAndAccess/CertificatesStore';
import ControlStore from './modules/Operations/ControlStore';
import EventLogStore from './modules/Logs/EventLogStore';
import SystemStore from './modules/HardwareStatus/SystemStore';
import BmcStore from './modules/HardwareStatus/BmcStore';
import ChassisStore from './modules/HardwareStatus/ChassisStore';
import DumpsStore from './modules/Logs/DumpsStore';
import IBMiServiceFunctionsStore from './modules/Logs/IBMiServiceFunctionsStore';
import ResourceMemoryStore from './modules/ResourceManagement/ResourceMemoryStore';

const stores = {};

Object.assign(stores, {
  GlobalStore: GlobalStore,
});
Object.assign(stores, {
  AuthenticationStore: AuthenticationStore,
});
Object.assign(stores, {
  UserManagementStore: UserManagementStore,
});
Object.assign(stores, {
  CertificatesStore: CertificatesStore,
});
Object.assign(stores, {
  ControlStore: ControlStore,
});
Object.assign(stores, {
  EventLogStore: EventLogStore,
});
Object.assign(stores, {
  SystemStore: SystemStore,
});
Object.assign(stores, {
  BmcStore: BmcStore,
});
Object.assign(stores, {
  ChassisStore: ChassisStore,
});
Object.assign(stores, {
  DumpsStore: DumpsStore,
});
Object.assign(stores, {
  IBMiServiceFunctionsStore: IBMiServiceFunctionsStore,
});
Object.assign(stores, {
  ResourceMemoryStore: ResourceMemoryStore,
});

export default stores;
