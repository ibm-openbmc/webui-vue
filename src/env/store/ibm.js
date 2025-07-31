import stores from '@/store';
import DumpsStore from '../../store/modules/Logs/DumpsStore.js';
import KeyClearStore from '../../store/modules/Operations/KeyClearStore';
import LicenseStore from '../../store/modules/ResourceManagement/LicenseStore';
import FieldCoreOverrideStore from '../../store/modules/ResourceManagement/FieldCoreOverrideStore.js';

  Object.assign(stores, {
    DumpsStore: DumpsStore,
  });
  Object.assign(stores, {
    KeyClearStore: KeyClearStore,
  });
  Object.assign(stores, {
    LicenseStore: LicenseStore,
  });
  Object.assign(stores, {
    FieldCoreOverrideStore: FieldCoreOverrideStore,
  });

  export default stores;

