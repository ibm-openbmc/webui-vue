import stores from '@/store';
import DumpsStore from '../../store/modules/Logs/DumpsStore.js';
import LicenseStore from '../../store/modules/ResourceManagement/LicenseStore';

Object.assign(stores, {
  DumpsStore: DumpsStore,
});
Object.assign(stores, {
  LicenseStore: LicenseStore,
});

export default stores;
