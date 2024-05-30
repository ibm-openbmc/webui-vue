<template>
  <div>
    <div class="form-background p-3">
      <b-form @submit.prevent="onSubmitUpload">
        <b-form-group
          v-if="isTftpUploadAvailable && tftpServer"
          :label="$t('pageFirmware.form.updateFirmware.fileSource')"
          :disabled="isPageDisabled"
        >
          <b-form-radio v-model="isWorkstationSelected" :value="true">
            {{ $t('pageFirmware.form.updateFirmware.workstation') }}
          </b-form-radio>
          <b-form-radio v-model="isWorkstationSelected" :value="false">
            {{ $t('pageFirmware.form.updateFirmware.tftpServer') }}
            <span
              ><info-tooltip
                class="info-icon"
                :title="$t('pageFirmware.form.updateFirmware.tftpServerInfo')"
            /></span>
          </b-form-radio>
        </b-form-group>

        <!-- Workstation Upload -->
        <template v-if="isWorkstationSelected">
          <b-form-group
            :label="$t('pageFirmware.form.updateFirmware.imageFile')"
            label-for="image-file"
          >
            <form-file
              id="image-file"
              :disabled="isPageDisabled"
              accept=".tar"
              :state="getValidationState($v.file)"
              aria-describedby="image-file-help-block"
              @input="onFileUpload($event)"
            >
              <template #invalid>
                <b-form-invalid-feedback role="alert">
                  {{ $t('global.form.required') }}
                </b-form-invalid-feedback>
              </template>
            </form-file>
          </b-form-group>
        </template>

        <!-- TFTP Server Upload -->
        <template v-if="tftpServer">
          <b-form-group
            :label="$t('pageFirmware.form.updateFirmware.fileAddress')"
            label-for="tftp-address"
          >
            <b-form-input
              id="tftp-address"
              v-model="tftpFileAddress"
              type="text"
              :state="getValidationState($v.tftpFileAddress)"
              :disabled="isPageDisabled"
              @input="$v.tftpFileAddress.$touch()"
            />
            <b-form-invalid-feedback role="alert">
              <template v-if="!$v.tftpFileAddress.required">
                {{ $t('global.form.fieldRequired') }}
              </template>
            </b-form-invalid-feedback>
          </b-form-group>
        </template>
        <b-btn
          data-test-id="firmware-button-startUpdate"
          type="submit"
          variant="primary"
          :disabled="isPageDisabled"
        >
          {{ $t('pageFirmware.form.updateFirmware.startUpdate') }}
        </b-btn>
      </b-form>
    </div>

    <!-- Modals -->
    <modal-update-firmware @ok="updateFirmware" />
  </div>
</template>

<script>
import { requiredIf } from 'vuelidate/lib/validators';
import BVToastMixin from '@/components/Mixins/BVToastMixin';
import LoadingBarMixin, { loading } from '@/components/Mixins/LoadingBarMixin';
import VuelidateMixin from '@/components/Mixins/VuelidateMixin.js';
import InfoTooltip from '@/components/Global/InfoTooltip';
import FormFile from '@/components/Global/FormFile';
import ModalUpdateFirmware from './FirmwareModalUpdateFirmware';

export default {
  name: 'FormUpdate',
  components: {
    InfoTooltip,
    FormFile,
    ModalUpdateFirmware,
  },
  mixins: [BVToastMixin, LoadingBarMixin, VuelidateMixin],
  props: {
    isPageDisabled: {
      required: true,
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading,
      isWorkstationSelected: true,
      file: null,
      tftpFileAddress: null,
      isServerPowerOffRequired: process.env.VUE_APP_SERVER_OFF_REQUIRED === 'true',
      tftpServer: process.env.VUE_APP_TFTP_SERVER === 'true',
    };
  },
  computed: {
    bmcPowerState() {
      return this.$store.getters['bmc/bmc']?.powerState;
    },
    bootProgress() {
      return this.$store.getters['global/bootProgress'];
    },
    isTftpUploadAvailable() {
      return this.$store.getters['firmware/isTftpUploadAvailable'];
    },
  },
  watch: {
    isWorkstationSelected: function () {
      this.$v.$reset();
      this.file = null;
      this.tftpFileAddress = null;
    },
    loading: function (value) {
      this.$emit('loadingStatus', value);
    },
  },
  validations() {
    return {
      file: {
        required: requiredIf(function () {
          return this.isWorkstationSelected;
        }),
      },
      tftpFileAddress: {
        required: requiredIf(function () {
          return !this.isWorkstationSelected;
        }),
      },
    };
  },
  created() {
    this.$store.dispatch('bmc/getBmcInfo');
    this.$store.dispatch('firmware/getUpdateServiceSettings');
  },
  methods: {
    updateFirmware() {
      this.startLoader();
      this.$emit('loadingStatus', this.loading);

      // Step 1 - Upload
      const uploadFirmware = () => {
        this.infoToast(this.$t('pageFirmware.toast.updateFirmware.step1Message'), {
          title: this.$t('pageFirmware.toast.updateFirmware.step1'),
          timestamp: true,
        });
        if (this.isWorkstationSelected) {
          this.dispatchWorkstationUpload(activateFirmware);
        } else {
          this.dispatchTftpUpload(activateFirmware);
        }
      };

      // Step 2 - Activation
      const activateFirmware = async (data) => {
        const taskLink = data['@odata.id'];

        const currentTask = async () => {
          return await this.$store.dispatch('global/getCurrentTask', taskLink);
        };

        const currentTaskProgress = (checkCounter = 0, data) => {
          checkCounter++;

          // This counter goes up by 1 every time this function runs
          // If the function successfully goes to last toast, it won't run anymore
          // if this function runs more than 36 times, it won't run anymore
          if (checkCounter > 36) {
            this.endLoader();
            return this.errorToast(this.$t('pageFirmware.toast.errorActivation'));
          }

          Promise.all([currentTask(data)]).then((res) => {
            // Check to see if activation was aborted
            const activationAborted = res[0].Messages.filter(
              (message) => message.MessageId === 'TaskEvent.1.0.1.TaskAborted',
            )[0];

            if (activationAborted) {
              if (activationAborted?.Oem?.OpenBMC?.AbortReason) {
                const message = activationAborted?.Oem?.OpenBMC?.AbortReason?.split('.').pop();
                if (message === 'ExpiredAccessKey')
                  return this.errorToast(this.$t('pageFirmware.toast.expiredAccessKeyError'));
              } else {
                return this.errorToast(this.$t('pageFirmware.toast.errorActivation'));
              }
            }

            // res[0].error indicates that the activation was completed and removed
            // because of BMC starting reboot
            if (res[0].PercentComplete == 100 || res[0].error) {
              bmcReboot();
            } else {
              setTimeout(() => {
                currentTaskProgress(checkCounter, data);
              }, 5000); // If the percent complete isn't 100 or complete, run again in 5 sec
            }
          });
        };

        if (taskLink) {
          this.infoToast(this.$t('pageFirmware.toast.updateFirmware.step2Message'), {
            title: this.$t('pageFirmware.toast.updateFirmware.step2'),
            timestamp: true,
          });
          currentTaskProgress(0, taskLink);
        } else {
          this.endLoader();
          return this.errorToast(this.$t('pageFirmware.toast.errorActivation'));
        }
      };

      // Step 3 - BMC Reboot
      const bmcReboot = async () => {
        this.infoToast(this.$t('pageFirmware.toast.updateFirmware.step3Message'), {
          title: this.$t('pageFirmware.toast.updateFirmware.step3'),
          timestamp: true,
        });

        const rebootProgress = async () => {
          setTimeout(async () => {
            await this.$store
              .dispatch('bmc/getBmcInfo')
              .then(() => {
                if (this.bmcPowerState === 'On') {
                  activationComplete();
                } else {
                  rebootProgress();
                }
              })
              .catch(({ message }) => {
                this.endLoader();
                this.errorToast(message);
              });
          }, 180000); // 3 minutes
        };
        rebootProgress();
      };

      // Step 4 - Activation complete
      const activationComplete = () => {
        this.endLoader();
        return this.infoToast(this.$t('pageFirmware.toast.updateFirmware.step4Message'), {
          title: this.$t('pageFirmware.toast.updateFirmware.step4'),
          refreshAction: true,
          timestamp: true,
        });
      };

      uploadFirmware(); // This must be here to run the entire function
    },
    dispatchWorkstationUpload(activateFirmware) {
      this.$store
        .dispatch('firmware/uploadFirmware', this.file)
        .then(async ({ data }) => {
          activateFirmware(data);
        })
        .catch(({ message }) => {
          this.endLoader();
          this.errorToast(message);
        });
    },
    dispatchTftpUpload(activateFirmware) {
      this.$store
        .dispatch('firmware/uploadFirmwareTFTP', this.tftpFileAddress)
        .then(({ data }) => {
          activateFirmware(data);
        })
        .catch(({ message }) => {
          this.endLoader();
          this.errorToast(message);
        });
    },
    onSubmitUpload() {
      this.$v.$touch();
      if (this.$v.$invalid) return;
      this.$bvModal.show('modal-update-firmware');
    },
    onFileUpload(file) {
      this.file = file;
      this.$v.file.$touch();
    },
  },
};
</script>
