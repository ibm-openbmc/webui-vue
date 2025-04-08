<template>
  <BModal
    v-model="modal"
    id="modal-add-ipv6-default-gateway"
    :title="
      editModal
        ? $t('pageNetwork.table.editIpv6StaticDefaultGateway')
        : $t('pageNetwork.table.addIpv6StaticDefaultGateway')
    "
    :ok-title="$t('global.action.add')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="form-ipv6-default-gateway" @submit.prevent="handleSubmit">
      <BRow>
        <BCol sm="6">
          <BFormGroup
            :label="$t('pageNetwork.modal.ipAddress')"
            label-for="ipAddress"
          >
            <BFormInput
              id="ipAddress"
              v-model="form.ipAddress"
              type="text"
              :state="getValidationState(v$.form.ipAddress)"
              @input="v$.form.ipAddress.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.ipAddress.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="v$.form.ipAddress.pattern.$invalid">
                {{ $t('global.form.invalidFormat') }}
              </template>
            </BFormInvalidFeedback>
          </BFormGroup>
        </BCol>
        <BCol sm="6">
          <BFormGroup
            :label="$t('pageNetwork.modal.prefixLength')"
            label-for="prefixLength"
          >
            <BFormInput
              id="prefixLength"
              v-model="form.prefixLength"
              type="number"
              :state="getValidationState(v$.form.prefixLength)"
              @blur="v$.form.prefixLength.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.prefixLength.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template
                v-if="
                  v$.form.prefixLength.minValue.$invalid ||
                  v$.form.prefixLength.maxValue.$invalid
                "
              >
                {{
                  $t('global.form.valueMustBeBetween', {
                    min: 0,
                    max: 128,
                  })
                }}
              </template>
            </BFormInvalidFeedback>
          </BFormGroup>
        </BCol>
      </BRow>
    </BForm>
  </BModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue, maxValue, helpers } from '@vuelidate/validators';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const emit = defineEmits(['ok', 'hidden']);

const modal = ref(false);
eventBus.on('modal-add-ipv6-default-gateway', () => {
  modal.value = true;
});

const props = defineProps({
  prefixLength: {
    type: Number,
    default: 0,
  },
  ipAddress: {
    type: String,
    default: '',
  },
  editModal: {
    type: Boolean,
    default: false,
  },
});

const form = ref({
  ipAddress: '',
  prefixLength: 0,
});

const rules = computed(() => ({
  form: {
    ipAddress: {
      required,
      pattern: helpers.regex(
        /((^\s*((([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]))\s*$)|(^\s*((([0-9A-Fa-f]{1,4}:){7}([0-9A-Fa-f]{1,4}|:))|(([0-9A-Fa-f]{1,4}:){6}(:[0-9A-Fa-f]{1,4}|((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){5}(((:[0-9A-Fa-f]{1,4}){1,2})|:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3})|:))|(([0-9A-Fa-f]{1,4}:){4}(((:[0-9A-Fa-f]{1,4}){1,3})|((:[0-9A-Fa-f]{1,4})?:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){3}(((:[0-9A-Fa-f]{1,4}){1,4})|((:[0-9A-Fa-f]{1,4}){0,2}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){2}(((:[0-9A-Fa-f]{1,4}){1,5})|((:[0-9A-Fa-f]{1,4}){0,3}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(([0-9A-Fa-f]{1,4}:){1}(((:[0-9A-Fa-f]{1,4}){1,6})|((:[0-9A-Fa-f]{1,4}){0,4}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:))|(:(((:[0-9A-Fa-f]{1,4}){1,7})|((:[0-9A-Fa-f]{1,4}){0,5}:((25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}))|:)))(%.+)?\s*$))|(^\s*((?=.{1,255}$)(?=.*[A-Za-z].*)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*)\s*$)/
      ),
    },
    prefixLength: {
      required,
      minValue: minValue(0),
      maxValue: maxValue(128),
    },
  },
}));

const v$ = useVuelidate(rules, {
  form,
});

watch(
  () => props.ipAddress,
  () => {
    form.value.ipAddress = props.ipAddress;
  }
);

watch(
  () => props.prefixLength,
  () => {
    form.value.prefixLength = props.prefixLength;
  }
);

const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', {
    Address: form.value.ipAddress,
    PrefixLength: Number(form.value.prefixLength),
  });
  closeModal();
};

const closeModal = () => {
  modal.value = false;
};

const resetForm = () => {
  const item = {
    Address: '',
  };
  eventBus.emit('edit-address', item);
  v$.value.$reset();
  emit('hidden');
};

const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
</script>
