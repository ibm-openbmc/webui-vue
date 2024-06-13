<template>
  <b-container fluid="xl">
    <page-title :title="$t('appPageTitle.rebootBmc')" />
    <b-row>
      <b-col md="8" lg="8" xl="6">
        <page-section>
          <b-row>
            <b-col>
              <dl>
                <dt>
                  {{ $t('pageRebootBmc.lastReboot') }}
                </dt>
                <dd v-if="lastBmcRebootTime">
                  {{ lastBmcRebootTime | formatDate }}
                  {{ lastBmcRebootTime | formatTime }}
                </dd>
                <dd v-else>--</dd>
              </dl>
            </b-col>
          </b-row>
          {{ $t('pageRebootBmc.rebootInformation') }}
          <b-button
            variant="primary"
            class="d-block mt-5"
            data-test-id="rebootBmc-button-reboot"
            @click="onClick"
          >
            {{ $t('pageRebootBmc.rebootBmc') }}
          </b-button>
        </page-section>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
import PageTitle from '@/components/Global/PageTitle';
import PageSection from '@/components/Global/PageSection';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin from '@/components/Mixins/LoadingBarMixin';

export default {
  name: 'RebootBmc',
  components: { PageTitle, PageSection },
  mixins: [BVToastMixin, LoadingBarMixin],
  beforeRouteLeave(to, from, next) {
    this.hideLoader();
    next();
  },
  computed: {
    lastBmcRebootTime() {
      return this.$store?.getters['controls/lastBmcRebootTime'];
    },
    systemDumpActive() {
      return this.$store?.getters['serverBootSettings/systemDumpActive'];
    },
  },
  created() {
    this.startLoader();
    this.$store
      .dispatch('controls/getLastBmcRebootTime')
      .finally(() => this.endLoader());
  },
  methods: {
    onClick() {
      this.$store.dispatch('serverBootSettings/getBiosAttributes').then(() => {
        this.$bvModal
          .msgBoxConfirm(
            `${this.systemDumpActive ? this.$t('pageRebootBmc.modal.confirmMessage2') : ''}
            ${this.$t('pageRebootBmc.modal.confirmMessage')}
            `,
            {
              title: this.$t('pageRebootBmc.modal.confirmTitle'),
              okTitle: this.systemDumpActive
                ? this.$t('pageRebootBmc.rebootBmc')
                : this.$t('global.action.confirm'),
              okVariant: this.systemDumpActive ? 'danger' : 'primary',
              cancelTitle: this.$t('global.action.cancel'),
            },
          )
          .then((confirmed) => {
            if (confirmed) this.rebootBmc();
          });
      });
    },
    rebootBmc() {
      this.$store
        .dispatch('controls/rebootBmc')
        .then((message) => this.successToast(message))
        .catch(({ message }) => this.errorToast(message));
    },
  },
};
</script>

<style lang="scss" scoped></style>
