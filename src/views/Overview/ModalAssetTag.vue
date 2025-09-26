<template>
  <BModal
    id="modal-asset-tag"
    v-model="modal"
    :title="$t('pageOverview.modal.editAssetTag')"
    :ok-title="$t('global.action.save')"
    @ok="onOk"
    @hidden="resetForm"
  >
    <BForm id="asset-settings" @submit.prevent="handleSubmit">
      <BRow>
        <BCol sm="8">
          <BFormGroup
            :label="$t('pageOverview.assetTag')"
            label-for="asset-tag"
          >
            <b-form-input
              id="asset-tag"
              v-model="form.assetTag"
              type="text"
              :state="getValidationState(v$.form.assetTag)"
              @input="v$.form.assetTag.$touch()"
            />
            <b-form-invalid-feedback role="alert">
              <template v-if="!v$.form.assetTag.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
            </b-form-invalid-feedback>
          </BFormGroup>
        </BCol>
      </BRow>
    </BForm>
    <template #modal-footer="{ cancel }">
      <BButton variant="secondary" @click="cancel()">
        {{ $t('global.action.cancel') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const props = defineProps({
  tag: {
    type: String,
    default: '',
  },
});

const modal = ref(false);
const form = ref({
  assetTag: props.tag ? props.tag : '',
});

eventBus.on('openmodal-true', () => {
  modal.value = true;
});

const rules = computed(() => ({
  form: {
    assetTag: {
      required,
    },
  },
}));
const v$ = useVuelidate(rules, { form });

watch(
  () => props.tag,
  () => {
    form.value.assetTag = props.tag;
  },
);

const handleSubmit = () => {
  v$.value.$touch();
  if (v$.value.$invalid) return;
  eventBus.emit('okAssetTag', { AssetTag: form.value.assetTag });
  closeModal();
};
const closeModal = () => {
  nextTick(() => {
    modal.value = false;
  });
};
const resetForm = () => {
  form.value.assetTag = props.tag;
  v$.value.$reset();
  eventBus.emit('hidden');
};
const onOk = (bvModalEvt) => {
  // prevent modal close
  bvModalEvt.preventDefault();
  handleSubmit();
};
</script>
