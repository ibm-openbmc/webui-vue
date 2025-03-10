<template>
  <BModal 
    v-model="modal"
    id="modal-asset-tag"
    :title="$t('pageOverview.modal.editAssetTag')"
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
      <BButton
        form="asset-settings"
        type="submit"
        variant="primary"
        @click="onOk"
      >
        {{ $t('global.action.save') }}
      </BButton>
    </template>
  </BModal>
</template>

<script setup>
import { ref, watch, defineProps, nextTick, computed } from 'vue';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import eventBus from '@/eventBus';

const { getValidationState } = useVuelidateComposable();

const props = defineProps ({
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
  ()=>props.tag,
  ()=>{
    form.value.assetTag = props.tag;   
  }
)

const handleSubmit = () => {
      v$.value.$touch();
      if (v$.value.$invalid) return;
      eventBus.emit('ok', { AssetTag: form.value.assetTag });
      closeModal();
    };
const closeModal = () => {
  nextTick(()=>{
    modal.value=false
  })
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
