<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.serviceLogin')" />

    <page-section class="mb-0">
      <b-row class="d-flex">
        <b-col
          sm="6"
          lg="5"
          xl="4"
          class="d-flex flex-column justify-content-end"
        >
          <b-form id="form-new-dump">
            <b-form-group
              :label="$t('pageServiceLoginConsoles.selectConsoleType')"
              label-for="selectConsoleType"
            >
              <b-form-select
                id="selectConsoleType"
                v-model="selectConsoleType"
                :options="consoleTypeOptions"
                value-field="value"
                text-field="text"
              >
              </b-form-select>
            </b-form-group>
          </b-form>
        </b-col>
      </b-row>
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
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';
import ServiceLoginConsoles from './ServiceLoginConsoles';

export default {
  name: 'ServiceLogin',
  components: {
    PageSection,
    PageTitle,
    ServiceLoginConsoles,
  },
  data() {
    return {
      selectConsoleType: 'bmc-console',
      consoleTypeOptions: [
        {
          value: 'bmc-console',
          text: this.$t('pageServiceLoginConsoles.bmcConsole'),
        },
        {
          value: 'hypervisor-console',
          text: this.$t('pageServiceLoginConsoles.hypervisorConsole'),
        },
      ],
    };
  },
};
</script>
