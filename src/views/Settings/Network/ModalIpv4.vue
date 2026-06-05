<template>
  <BModal
    id="modal-add-ipv4"
    v-model="modal"
    :title="
      editModal
        ? $t('pageNetwork.table.editIpv4')
        : $t('pageNetwork.table.addIpv4Address')
    "
    :ok-title="$t('global.action.add')"
    :cancel-title="$t('global.action.cancel')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="form-ipv4" @submit.prevent="handleSubmit">
      <BRow>
        <BCol sm="6">
          <BFormGroup
            aria-label="ip-address"
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
              <template v-if="v$.form.ipAddress.ipAddress.$invalid">
                {{ $t('global.form.invalidFormat') }}
              </template>
            </BFormInvalidFeedback>
          </BFormGroup>
        </BCol>
        <BCol sm="6">
          <BFormGroup
            aria-label="gateway"
            :label="$t('pageNetwork.modal.gateway')"
            label-for="gateway"
          >
            <BFormInput
              id="gateway"
              v-model="form.gateway"
              type="text"
              :state="getValidationState(v$.form.gateway)"
              @input="v$.form.gateway.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.gateway.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="v$.form.gateway.ipAddress.$invalid">
                {{ $t('global.form.invalidFormat') }}
              </template>
            </BFormInvalidFeedback>
          </BFormGroup>
        </BCol>
      </BRow>
      <BRow>
        <BCol sm="6">
          <BFormGroup
            aria-label="subnet-mast"
            :label="$t('pageNetwork.modal.subnetMask')"
            label-for="subnetMask"
          >
            <BFormInput
              id="subnetMask"
              v-model="form.subnetMask"
              type="text"
              :state="getValidationState(v$.form.subnetMask)"
              @input="v$.form.subnetMask.$touch()"
            />
            <BFormInvalidFeedback role="alert">
              <template v-if="v$.form.subnetMask.required.$invalid">
                {{ $t('global.form.fieldRequired') }}
              </template>
              <template v-if="v$.form.subnetMask.ipAddress.$invalid">
                {{ $t('global.form.invalidFormat') }}
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
import { required, ipAddress } from '@vuelidate/validators';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const emit = defineEmits(['ok', 'hidden']);

const modal = ref(false);
eventBus.on('modal-add-ipv4', () => {
  modal.value = true;
});

const props = defineProps({
  defaultGateway: {
    type: String,
    default: '',
  },
  ipAddress: {
    type: String,
    default: '',
  },
  subnet: {
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
  gateway: '',
  subnetMask: '',
});

const rules = computed(() => ({
  form: {
    ipAddress: {
      required,
      ipAddress,
    },
    gateway: {
      required,
      ipAddress,
    },
    subnetMask: {
      required,
      ipAddress,
    },
  },
}));

const v$ = useVuelidate(rules, {
  form,
});

watch(
  () => props.defaultGateway,
  () => {
    form.value.gateway = props.defaultGateway;
  },
);

watch(
  () => props.ipAddress,
  () => {
    form.value.ipAddress = props.ipAddress;
  },
);

watch(
  () => props.subnet,
  () => {
    form.value.subnetMask = props.subnet;
  },
);

const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  emit('ok', {
    Address: form.value.ipAddress,
    Gateway: form.value.gateway,
    SubnetMask: form.value.subnetMask,
  });
  closeModal();
};

const closeModal = () => {
  modal.value = false;
};

const resetForm = () => {
  form.value.gateway = props.defaultGateway;
  form.value.ipAddress = '';
  form.value.subnetMask = '';
  const item = {
    Address: '',
    SubnetMask: '',
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
