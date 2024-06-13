//TODO: Work Requird -->
import store from '@/store';
import DumpsStore from '@/store/modules/Logs/DumpsStore';
import KeyClearStore from '@/store/modules/Operations/KeyClearStore';
import LicenseStore from '@/store/modules/ResourceManagement/LicenseStore';
import FieldCoreOverrideStore from '@/store/modules/ResourceManagement/FieldCoreOverrideStore';

store.unregisterModule('virtualMedia');

store.registerModule('dumps', DumpsStore);
store.registerModule('licenses', LicenseStore);
store.registerModule('fieldCoreOverride', FieldCoreOverrideStore);

store.registerModule('key-clear', KeyClearStore);

export default store;
