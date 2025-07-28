# Forms

Forms are created using the [bootstrap-vue-next form
component](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form.html#form)
and validated with the [Vuelidate](https://vuelidate.js.org/#sub-installation)
plugin.

## Form component

When creating a new form, use the `<BForm>` [form
component](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form.html#form). Use the `.prevent`
event modifier on submit to prevent the submit event from reloading the page.

## Form group component

The `<BFormGroup>` [form group
component](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-group.html)
pairs form controls with a legend or label, helper text, invalid/valid
feedback text, and visual validation state feedback. Learn more about
commonly used form components:

- [Form checkbox](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-checkbox.html#form-checkbox)
- [Form input](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-input.html)
- [Form radio](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-radio.html)
- [Form select](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-select.html)
- [Form file custom component](https://bootstrap-vue-next.github.io/bootstrap-vue-next/docs/components/form-file.html#form-file)

When helper text is provided, use the `<BFormText>` component and `aria-describedby` on the
form group component the helper text describes.

## Validation

For custom form validation messages, disable browser native HTML5
validation by setting the `novalidate` prop on `<BForm>`. Use Vuelidate to
check the form validation state and add
custom validation messages in the `<BFormInvalidFeedback>` component.

When creating a new form add the `useVuelidateComposable`
to the `scripts` block and import any
[validators](https://vuelidate.js.org/#validators) needed
such as: `required`, `requiredIf`, etc. The use of built-in validators is
preferred.

## Complete form

A complete form will look like this.

```vue
<template>
  <BForm novalidate @submit.prevent="handleSubmit">
    <BFormGroup
      :label="$t('pageName.form.inputLabel')"
      label-for="form-input-id"
    >
      <BFormText id="form-input-helper-text">
        {{ $t('pageName.form.helperText') }}
      </BFormText>
      <BFormInput
        id="form-input-id"
        v-model="form.input"
        type="text"
        aria-describedby="form-input-helper-text"
        :state="getValidationState($v.form.input)"
        @change="$v.form.input.$touch()"
      />
      <BFormInvalidFeedback role="alert">
        <div v-if="!$v.form.input.required">
          {{ $t('global.form.fieldRequired') }}
        </div>
      </BFormInvalidFeedback>
    </BFormGroup>
    <BButton variant="primary" type="submit" class="mb-3">
      {{ $t('global.action.save') }}
    </BButton>
  </BForm>
</template>

<script>
import { ref, onMounted, computed, onBeforeMount } from 'vue';
import useToastComposable from '@/components/Composables/useToastComposable';
import useVuelidateComposable from '@/components/Composables/useVuelidateComposable';
import { useVuelidate } from '@vuelidate/core';
import { required } from 'vuelidate/lib/validators';
import { ExampleStore } from '@/store';

const { successToast, errorToast } = useToastComposable();
const exampleStore = ExampleStore();

const form = ref({
      input: '',
    });

const rules = computed(() => ({
      form: {
        input: { required },
      }
}));
const v$ = useVuelidate(rules, { input });

const cumputedFunction = computed(() => {
      ...
    })

const handleSubmit = () => {
      v$.$touch();
      if (v$.$invalid) return;
      exampleStore.updateFormData(formData)
        .then((success) => {
          successToast(success);
        })
        .catch(({ message }) => errorToast(message))
        .finally(() => {
          v$.form.$reset();
          endLoader();
        });
    },
</script>
```
