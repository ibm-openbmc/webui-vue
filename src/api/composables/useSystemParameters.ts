import { computed } from 'vue';
import { useBiosAttributes } from './useBiosAttributes';

/**
 * Composable for System Parameters page - uses generic useBiosAttributes
 * Provides system parameters-specific computed properties and methods
 */
export function useSystemParameters() {
  const {
    isFetching,
    isError,
    error,
    getBiosAttribute,
    getBiosBooleanAttribute,
    getRegistryOptions,
    updateBiosAttribute,
    updateBiosBooleanAttribute,
    updateBiosAttributes,
    isUpdating,
  } = useBiosAttributes();

  // System Parameters-specific BIOS attributes
  const aggressivePrefetch = getBiosBooleanAttribute('hb_proc_favor_aggressive_prefetch');
  const lateralCastOutMode = getBiosBooleanAttribute('hb_lateral_cast_out_mode');
  const frequencyMax = getBiosAttribute('hb_cap_freq_mhz_max');
  const frequencyMin = getBiosAttribute('hb_cap_freq_mhz_min');
  const frequencyRequest = getBiosAttribute('hb_cap_freq_mhz_request');
  const frequencyRequestCurrent = getBiosAttribute('hb_cap_freq_mhz_request_current');
  const rpdPolicy = getBiosAttribute('pvm_rpd_policy');
  const rpdFeature = getBiosAttribute('pvm_rpd_feature');
  const rpdPolicyCurrent = getBiosAttribute('pvm_rpd_feature_current');
  const immediateTestRequested = getBiosBooleanAttribute('pvm_rpd_immediate_test');
  const guardOnError = getBiosBooleanAttribute('pvm_rpd_guard_policy');

  // Computed: frequency request toggle
  const frequencyRequestCurrentToggle = computed<boolean>(() => {
    const request = frequencyRequest.value;
    return request !== null && request > 0;
  });

  // Computed: RPD scheduled run (convert seconds to HH:MM format)
  const rpdScheduledRun = computed<string | null>(() => {
    const biosAttr = getBiosAttribute('pvm_rpd_scheduled_tod');
    const value = biosAttr.value;
    if (value === null || value === undefined) return null;
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    const hourString = hours.toString().padStart(2, '0');
    const minuteString = minutes.toString().padStart(2, '0');
    return `${hourString}:${minuteString}`;
  });

  const rpdScheduledRunDuration = getBiosAttribute('pvm_rpd_scheduled_duration');

  // System Parameters-specific registry attributes
  const rpdPolicyOptions = getRegistryOptions('pvm_rpd_policy');
  const rpdFeatureOptions = getRegistryOptions('pvm_rpd_feature');

  // Mutation methods
  const saveAggressivePrefetch = async (enabled: boolean): Promise<void> => {
    return updateBiosBooleanAttribute('hb_proc_favor_aggressive_prefetch', enabled);
  };

  const saveLateralCastOutMode = async (enabled: boolean): Promise<void> => {
    return updateBiosBooleanAttribute('hb_lateral_cast_out_mode', enabled);
  };

  const saveFrequencyCap = async (frequency: number): Promise<void> => {
    return updateBiosAttribute('hb_cap_freq_mhz_request', Number(frequency));
  };

  const saveRpdPolicy = async (policy: string): Promise<void> => {
    return updateBiosAttribute('pvm_rpd_policy', policy);
  };

  const saveRpdFeature = async (feature: string): Promise<void> => {
    return updateBiosAttribute('pvm_rpd_feature', feature);
  };

  const saveImmediateTestRequested = async (value: string): Promise<void> => {
    return updateBiosAttribute('pvm_rpd_immediate_test', value);
  };

  const saveGuardOnError = async (enabled: boolean): Promise<void> => {
    return updateBiosBooleanAttribute('pvm_rpd_guard_policy', enabled);
  };

  const saveRpdScheduledRun = async (payload: { totalSeconds: number; duration: number }): Promise<void> => {
    return updateBiosAttributes({
      pvm_rpd_scheduled_tod: payload.totalSeconds,
      pvm_rpd_scheduled_duration: payload.duration,
    });
  };

  return {
    // Data
    aggressivePrefetch,
    lateralCastOutMode,
    frequencyMax,
    frequencyMin,
    frequencyRequest,
    frequencyRequestCurrent,
    frequencyRequestCurrentToggle,
    rpdPolicy,
    rpdFeature,
    rpdPolicyCurrent,
    rpdPolicyOptions,
    rpdFeatureOptions,
    immediateTestRequested,
    guardOnError,
    rpdScheduledRun,
    rpdScheduledRunDuration,
    
    // Loading and error states
    isFetching,
    isError,
    error,
    
    // Mutations
    saveAggressivePrefetch,
    saveLateralCastOutMode,
    saveFrequencyCap,
    saveRpdPolicy,
    saveRpdFeature,
    saveImmediateTestRequested,
    saveGuardOnError,
    saveRpdScheduledRun,
    
    // Mutation state
    isUpdating,
  };
}

// Made with Bob
