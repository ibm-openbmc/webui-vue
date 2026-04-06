<template>
  <BContainer fluid="xl">
    <page-title :title="$t('appPageTitle.documents')" />
    <BCard>
      <h2 class="h4 mb-3">Managing the system by using the OpenBMC GUI</h2>
      <p>
        Learn how to manage and configure your system by using the OpenBMC GUI.
      </p>

      <section class="mb-4">
        <h3 class="h5">Logging on to the OpenBMC GUI</h3>
        <p>Learn how to log on to the OpenBMC GUI.</p>
      </section>

      <section class="mb-4">
        <h3 class="h5">Setting the password</h3>
        <p>
          Learn how to change and set the password for your root account and to
          help secure the system.
        </p>
      </section>

      <section class="mb-4">
        <h3 class="h5">Dashboard</h3>
        <p>
          The dashboard displays the overall information about the server and
          the BMC.
        </p>
      </section>

      <section class="mb-4">
        <h3 class="h5">Server overview</h3>
        <p>
          Learn about the options that are available from the Server overview
          task.
        </p>
      </section>

      <section class="mb-4">
        <h3 class="h5">Server health</h3>
        <p>
          Learn about the tasks that are available from the Server health menu.
        </p>
        <ul>
          <li>Event log - View all events from the BMC.</li>
          <li>
            Hardware status - View the hardware status and associated events of
            all hardware in the server.
          </li>
          <li>Sensors - View all sensors that are present in the system.</li>
        </ul>
      </section>

      <section class="mb-4">
        <h3 class="h5">Server control</h3>
        <p>
          Learn about the tasks that are available from the Server control menu.
        </p>
        <ul>
          <li>
            Server power operations - Learn how to view current server status
            and select power operations.
          </li>
          <li>
            Manage power usage - Learn how to view the power consumption of the
            server and set a power cap.
          </li>
          <li>
            Server LED - Learn how to turn on and turn off the server LED.
          </li>
          <li>
            Reboot BMC - Learn how to restart the BMC and view the current BMC
            boot status.
          </li>
          <li>
            Serial over LAN console - Learn how to view information over the
            serial port of the server.
          </li>
          <li>
            KVM - Learn how to launch the remote keyboard, video, and mouse
            (KVM) console.
          </li>
          <li>
            Virtual media - Learn how to start a session by using a virtual
            media device.
          </li>
        </ul>
      </section>

      <section class="mb-4">
        <h3 class="h5">Server configuration</h3>
        <p>
          Learn about the tasks that are available from the Server configuration
          menu.
        </p>
        <ul>
          <li>
            Network settings - Learn how to view and set common network, IPv4,
            and DNS settings.
          </li>
          <li>
            SNMP settings - Learn how to view and set the simple network
            management protocol (SNMP) with a hostname or Internet Protocol (IP)
            address and a port.
          </li>
          <li>Firmware - Learn how to manage the BMC and server firmware.</li>
          <li>Date and time settings - Learn how to set the date and time.</li>
        </ul>
      </section>

      <section class="mb-4">
        <h3 class="h5">Access control</h3>
        <p>
          Learn about the tasks that are available from the Access control menu.
        </p>
        <ul>
          <li>
            LDAP - Learn how to configure lightweight directory access protocol
            (LDAP) settings and manage role groups.
          </li>
          <li>
            Local users - Learn how to add or remove new users, modify user
            settings, manage user account policy settings, and view privilege
            role descriptions.
          </li>
          <li>
            SSL certificates - Learn how to generate a certificate signing
            request (CSR), add new certificates, and replace existing
            certificates.
          </li>
        </ul>
      </section>

      <BAlert show variant="info">
        Source:
        <a
          href="https://www.ibm.com/docs/en/power11/9043-MRU?topic=cr2-managing-system-by-using-openbmc-gui"
          target="_blank"
          rel="noopener noreferrer"
        >
          IBM Docs - Managing the system by using the OpenBMC GUI
        </a>
      </BAlert>
    </BCard>
  </BContainer>
</template>

<script setup>
import { onMounted } from 'vue';
import useLoadingBar from '@/components/Composables/useLoadingBarComposable';
import PageTitle from '@/components/Global/PageTitle.vue';

const { hideLoader } = useLoadingBar();

onMounted(() => {
  hideLoader();
});
</script>
