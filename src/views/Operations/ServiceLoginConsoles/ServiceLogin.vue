<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.serviceLogin')" />

    <page-section class="mb-0">
      <BRow class="d-flex">
        <BCol
          sm="6"
          lg="5"
          xl="4"
          class="d-flex flex-column justify-content-end"
        >
          <BForm id="form-new-dump">
            <BFormGroup
              :label="$t('pageServiceLoginConsoles.selectConsoleType')"
              label-for="selectConsoleType"
            >
              <BFormSelect
                id="selectConsoleType"
                v-model="selectConsoleType"
                :options="consoleTypeOptions"
                value-field="value"
                text-field="text"
              >
              </BFormSelect>
            </BFormGroup>
          </BForm>
        </BCol>
      </BRow>
    </page-section>

    <page-section class="mb-0">
      <service-login-consoles
        v-show="selectConsoleType === 'bmc-console'"
        :is-full-window="false"
        :console-type="'bmc-console'"
      />
      <service-login-consoles
        v-show="selectConsoleType === 'hypervisor-console'"
        :is-full-window="false"
        :console-type="'console1'"
      />
    </page-section>
  </BContainer>
</template>

<script setup>
import { ref } from 'vue';
import i18n from '@/i18n';
import PageTitle from '@/components/Global/PageTitle.vue';
import PageSection from '@/components/Global/PageSection.vue';
import ServiceLoginConsoles from './ServiceLoginConsoles.vue';

const selectConsoleType = ref('bmc-console');
const consoleTypeOptions = ref([
  {
    value: 'bmc-console',
    text: i18n.global.t('pageServiceLoginConsoles.bmcConsole'),
  },
  {
    value: 'hypervisor-console',
    text: i18n.global.t('pageServiceLoginConsoles.hypervisorConsole'),
  },
]);
</script>
