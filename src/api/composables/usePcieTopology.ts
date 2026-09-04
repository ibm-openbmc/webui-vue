import { ref, watch } from 'vue';
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { RedfishQueryPresets } from './shared/queryConfig';
// @ts-ignore - api.js is a JavaScript module
import api from '@/store/api';

// ─── Raw-row shape (produced by the orchestration logic) ─────────────────────

interface LocationRef {
  locationIndicatorActive: boolean | undefined;
  locationNumber: string | undefined;
  uri: string;
}

interface PcieBridgeLocation {
  locationIndicatorActive: boolean | undefined;
  locationNumber: string | undefined;
  uri: string;
}

interface RawPcieRow {
  linkId: number | undefined;
  resetLinkUri: string | undefined;
  resetLinkAvailable: boolean;
  resetLinkValue: boolean | undefined;
  parentLinkId: number | string;
  linkStatus: string;
  linkType: string;
  linkSpeed: string | undefined;
  linkWidth: string | number | undefined;
  pcieHBLocation: PcieBridgeLocation | Record<string, never>;
  localPortLocation: LocationRef[];
  remotePortLocation: LocationRef[];
  ioSlotLocation: LocationRef[];
  cablePartNumber: string[];
  cableLength: number[];
  cableType: string[];
  cableStatus: string[];
}

// ─── Processed / UI-ready shape ───────────────────────────────────────────────

export interface PcieTopologyEntry {
  id: number | undefined;
  resetLinkUri: string | undefined;
  resetLinkAvailable: boolean;
  resetLinkValue: boolean | undefined;
  parentId: number | string;
  linkStatus: string;
  linkPropertiesSpeed: string | undefined;
  linkPropertiesWidth: string | number | undefined;
  linkPropertiesType: string;
  pcieBridge: PcieBridgeLocation | Record<string, never>;
  localPortLocation: LocationRef[];
  remotePortLocation: LocationRef[];
  ioSlots: LocationRef[];
  cablePartNumber: string[];
  cableLength: number[];
  cableType: string[];
  cableStatus: string[];
}

export interface LedValues {
  pcieBridge: Array<{
    led: boolean;
    locationNumber: string | undefined;
    uri: string;
  }>;
  localPortLocation: Array<{
    led: boolean;
    locationNumber: string | undefined;
    uri: string;
  }>;
  remotePortLocation: Array<{
    led: boolean;
    locationNumber: string | undefined;
    uri: string;
  }>;
  ioSlots: Array<{
    led: boolean;
    locationNumber: string | undefined;
    uri: string;
  }>;
}

// ─── Query key ────────────────────────────────────────────────────────────────

const PCIE_QUERY_KEY = ['redfish', 'pcieTopology'] as const;

// ─── Orchestration (ported 1-to-1 from PcieTopologyStore.getTopologyScreen) ──

async function fetchTopologyRows(): Promise<RawPcieRow[]> {
  let chassisMembers: any[] = [];
  let pcieDeviceMembers: any[] = [];
  let procMembers: any[] = [];
  let chassisInfo: any[] = [];
  let fabricAdapterInfo: any[] = [];
  let cablesInfo: any[] = [];

  // ── PCIe Devices ────────────────────────────────────────────────────────────
  await api
    .get('/redfish/v1/Systems/system/PCIeDevices?$expand=.($levels=2)')
    .then((res: any) => {
      pcieDeviceMembers = res.data.Members;
    });

  // ── Processors ──────────────────────────────────────────────────────────────
  await api
    .get('/redfish/v1/Systems/system/Processors/?$expand=.($levels=2)')
    .then((res: any) => {
      procMembers = res.data.Members;
    });

  // ── Chassis (with PCIe slots + assembly links) ───────────────────────────────
  await api
    .get('/redfish/v1/Chassis?$expand=.($levels=2)')
    .then(async (chassisResponse: any) => {
      chassisMembers = chassisResponse.data.Members;
      const chassisLength = chassisMembers.length;

      for (let index = 0; index < chassisLength; index++) {
        const singleChassisData = chassisMembers[index];
        const chassisData: any = {
          chassisMember: chassisMembers[index],
          detailedInfo: {},
          data: singleChassisData,
        };
        chassisData.detailedInfo.pcieSlotsUri =
          chassisMembers[index].PCIeSlots['@odata.id'];
        chassisData.detailedInfo.pcieSlots = {
          data: chassisMembers[index].PCIeSlots,
          eachSlot: [],
        };

        const pcieSlotsLength = chassisMembers[index].PCIeSlots.Slots.length;

        for (let j = 0; j < pcieSlotsLength; j++) {
          const singleSlotData: any = {
            data: chassisMembers[index].PCIeSlots.Slots[j],
          };

          // PCIe Device link
          if (
            chassisMembers[index].PCIeSlots.Slots[j].Links?.PCIeDevice?.length >
            0
          ) {
            let isLinkSet = false;

            // Look in already-processed chassis first
            outer: for (const oneChassis of [...chassisInfo, chassisData]) {
              for (const oneSlot of oneChassis.detailedInfo.pcieSlots
                .eachSlot) {
                if (
                  oneSlot.pcieDeviceLink &&
                  oneSlot.pcieDeviceLink ===
                    chassisMembers[index].PCIeSlots.Slots[j].Links
                      ?.PCIeDevice?.[0]?.['@odata.id']
                ) {
                  isLinkSet = true;
                  singleSlotData.pcieDevice = oneSlot.pcieDevice;
                  singleSlotData.pcieDeviceLink = oneSlot.pcieDeviceLink;
                  break outer;
                }
              }
            }

            if (!isLinkSet) {
              for (const singleDevice of pcieDeviceMembers) {
                if (
                  singleDevice['@odata.id'] ===
                  chassisMembers[index].PCIeSlots.Slots[j].Links
                    ?.PCIeDevice?.[0]?.['@odata.id']
                ) {
                  singleSlotData.pcieDevice = singleDevice;
                  singleSlotData.pcieDeviceLink =
                    chassisMembers[index].PCIeSlots.Slots[
                      j
                    ].Links?.PCIeDevice?.[0]?.['@odata.id'];
                }
              }
            }
          }

          // Processor link
          if (
            chassisMembers[index].PCIeSlots.Slots[j].Links?.Processors?.length >
            0
          ) {
            let isProcSet = false;

            outer: for (const oneChassis of [...chassisInfo, chassisData]) {
              for (const oneSlot of oneChassis.detailedInfo.pcieSlots
                .eachSlot) {
                if (
                  oneSlot.processorLink &&
                  oneSlot.processorLink ===
                    chassisMembers[index].PCIeSlots.Slots[j].Links
                      ?.Processors[0]['@odata.id']
                ) {
                  isProcSet = true;
                  singleSlotData.processor = oneSlot.processor;
                  singleSlotData.processorLink = oneSlot.processorLink;
                  break outer;
                }
              }
            }

            if (!isProcSet) {
              for (const singleProc of procMembers) {
                if (
                  singleProc['@odata.id'] ===
                  chassisMembers[index].PCIeSlots.Slots[j].Links?.Processors[0][
                    '@odata.id'
                  ]
                ) {
                  singleSlotData.processor = singleProc;
                  singleSlotData.processorLink =
                    chassisMembers[index].PCIeSlots.Slots[
                      j
                    ].Links?.Processors[0]['@odata.id'];
                }
              }
            }
          }

          // Associated Assembly link
          if (
            chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem?.IBM
              ?.AssociatedAssembly
          ) {
            let isAssemblySet = false;

            for (const oneChassis of [...chassisInfo, chassisData]) {
              for (const oneSlot of oneChassis.detailedInfo.pcieSlots
                .eachSlot) {
                if (
                  oneSlot.associatedAssemblyLink &&
                  oneSlot.associatedAssemblyLink ===
                    chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem?.IBM
                      ?.AssociatedAssembly['@odata.id']
                ) {
                  isAssemblySet = true;
                  singleSlotData.associatedAssembly =
                    oneSlot.associatedAssembly;
                  singleSlotData.associatedAssemblyLink =
                    oneSlot.associatedAssemblyLink;
                }
              }
            }

            if (!isAssemblySet) {
              await api
                .get(
                  chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem?.IBM
                    ?.AssociatedAssembly['@odata.id'],
                )
                .then((assemblyResponse: any) => {
                  singleSlotData.associatedAssembly = assemblyResponse.data;
                  singleSlotData.associatedAssemblyLink =
                    chassisMembers[index].PCIeSlots.Slots[
                      j
                    ].Links?.Oem?.IBM?.AssociatedAssembly['@odata.id'];
                })
                .catch((error: unknown) => {
                  console.error('Error fetching assembly', error);
                });
            }
          }

          chassisData.detailedInfo.pcieSlots.eachSlot.push(singleSlotData);
        }

        chassisInfo.push(chassisData);
      }
    })
    .catch((error: unknown) => {
      console.error('Error fetching chassis', error);
    });

  // ── Fabric Adapters ──────────────────────────────────────────────────────────
  await api
    .get('/redfish/v1/Systems/system/FabricAdapters?$expand=.($levels=3)')
    .then(({ data: { Members = [] } }: any) => {
      for (let index = 0; index < Members.length; index++) {
        const adapterData: any = {
          adapterMembers: Members,
          data: Members[index],
        };

        if (Members[index].Links?.PCIeDevices.length > 0) {
          adapterData.pcieDeviceLink =
            Members[index].Links?.PCIeDevices[0]['@odata.id'];

          if (Members[index].Ports) {
            adapterData.portsLink = Members[index].Ports['@odata.id'];
            adapterData.portsData = Members[index].Ports.Members.slice();
          }
        }

        fabricAdapterInfo.push(adapterData);
      }
    })
    .catch((error: unknown) => {
      console.error('Error fetching fabric adapters', error);
    });

  // ── Cables ───────────────────────────────────────────────────────────────────
  await api
    .get('/redfish/v1/Cables?$expand=.($levels=3)')
    .then(async ({ data: { Members = [] } }: any) => {
      for (let index = 0; index < Members.length; index++) {
        const cablesData: any = {
          data: Members[index],
          detailedInfo: {
            downstreamChassis: [],
            downstreamResources: [],
            upstreamPorts: [],
            downstreamPorts: [],
            grandparentUri: '',
          },
        };

        // DownstreamResources
        if (Members[index]?.Links?.DownstreamResources?.length > 0) {
          cablesData.detailedInfo.downstreamResourcesUri =
            Members[index]?.Links?.DownstreamResources[0]['@odata.id'];
          let isAssemblySet = false;

          for (const oneChassis of chassisInfo) {
            for (const oneSlot of oneChassis.detailedInfo.pcieSlots.eachSlot) {
              if (
                !isAssemblySet &&
                oneSlot.associatedAssemblyLink &&
                oneSlot.associatedAssemblyLink ===
                  Members[index]?.Links?.DownstreamResources[0]['@odata.id']
              ) {
                isAssemblySet = true;
                const parentUri = oneSlot.associatedAssemblyLink
                  .split('/Assembly')
                  .shift();
                for (const assemblyChassis of chassisInfo) {
                  if (
                    assemblyChassis.chassisMember['@odata.id'] === parentUri
                  ) {
                    cablesData.detailedInfo.downstreamResources.push({
                      data: assemblyChassis.detailedInfo.pcieSlots.data,
                      pcieSlots:
                        assemblyChassis.detailedInfo.pcieSlots.eachSlot,
                      pcieSlotsUri: assemblyChassis.detailedInfo.pcieSlotsUri,
                    });
                    break;
                  }
                }
              }
            }
          }

          if (!isAssemblySet) {
            await api
              .get(Members[index]?.Links?.DownstreamResources[0]['@odata.id'])
              .then((downstreamResources: any) => {
                const downstreamUri = downstreamResources.data['@odata.id'];
                const parentUri = downstreamUri.split('/Assembly').shift();
                for (const singleChassisMember of chassisMembers) {
                  if (singleChassisMember['@odata.id'] === parentUri) {
                    cablesData.detailedInfo.downstreamResources.push({
                      data: downstreamResources.data,
                      pcieSlots: singleChassisMember.PCIeSlots.Slots,
                      pcieSlotsUri: singleChassisMember.PCIeSlots['@odata.id'],
                    });
                  }
                }
              })
              .catch((error: unknown) => {
                console.error('Error fetching downstream resource', error);
              });
          }
        }

        // DownstreamChassis
        if (Members[index]?.Links?.DownstreamChassis?.length > 0) {
          const dsChassis =
            Members[index]?.Links?.DownstreamChassis[0]['@odata.id'];
          let isDsChassisSet = false;

          for (const downstreamChassisInfo of chassisInfo) {
            if (
              downstreamChassisInfo.chassisMember['@odata.id'] === dsChassis
            ) {
              cablesData.detailedInfo.downstreamChassis.push({
                data: downstreamChassisInfo.detailedInfo.pcieSlots.data,
                pcieSlots:
                  downstreamChassisInfo.detailedInfo.pcieSlots.eachSlot,
                pcieSlotsUri: downstreamChassisInfo.detailedInfo.pcieSlotsUri,
              });
              isDsChassisSet = true;
              break;
            }
          }

          if (!isDsChassisSet) {
            for (const singleCha of chassisMembers) {
              if (singleCha['@odata.id'] === dsChassis) {
                cablesData.detailedInfo.downstreamChassis.push({
                  data: singleCha,
                  pcieSlots: singleCha.PCIeSlots.Slots,
                  pcieSlotsUri: singleCha.PCIeSlots['@odata.id'],
                });
              }
            }
          }
        }

        // UpstreamPorts
        if (Members[index]?.Links?.UpstreamPorts?.length > 0) {
          let enabledUpstreamPort: any = {};

          if (Members[index]?.Links?.UpstreamPorts?.length === 1) {
            enabledUpstreamPort = Members[index].Links?.UpstreamPorts[0];
          } else {
            await Promise.all(
              Members[index]?.Links?.UpstreamPorts.map(async (usp: any) => {
                await api.get(usp?.['@odata.id']).then(({ data }: any) => {
                  if (data?.Status?.State !== 'Absent') {
                    enabledUpstreamPort = usp;
                  }
                });
              }),
            );
          }

          const grandparentUrl = enabledUpstreamPort?.['@odata.id']
            ?.split('/Ports')
            .shift();
          cablesData.detailedInfo.grandparentUri = grandparentUrl;

          let isAdapterSet = false;

          for (const element of fabricAdapterInfo) {
            if (element.data['@odata.id'] === grandparentUrl) {
              if (element?.portsData?.length > 0) {
                for (const singlePort of element.portsData) {
                  if (
                    singlePort['@odata.id'] ===
                    enabledUpstreamPort?.['@odata.id']
                  ) {
                    cablesData.detailedInfo.upstreamPorts.push(singlePort);
                    cablesData.detailedInfo.grandParentInfo = {
                      data: element.data,
                      expanderDevice: element.data,
                    };

                    for (const oneChassis of chassisInfo) {
                      for (const oneSlot of oneChassis.detailedInfo.pcieSlots
                        .eachSlot) {
                        if (
                          oneSlot.pcieDeviceLink &&
                          oneSlot.pcieDeviceLink ===
                            element.data?.Links?.PCIeDevices[0]['@odata.id']
                        ) {
                          const slotParent =
                            oneSlot.pcieDevice?.Links?.Oem?.IBM?.PCIeSlot?.[
                              '@odata.id'
                            ]
                              ?.split('/PCIeSlots')
                              .shift();
                          for (const ch of chassisInfo) {
                            if (ch.chassisMember['@odata.id'] === slotParent) {
                              cablesData.detailedInfo.grandParentInfo.expanderSlots =
                                ch.detailedInfo.pcieSlots.eachSlot;
                              isAdapterSet = true;
                              break;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          if (!isAdapterSet) {
            const gparentUri = enabledUpstreamPort?.['@odata.id']
              ?.split('/Ports')
              .shift();
            cablesData.detailedInfo.grandparentUri = gparentUri;

            await api
              .get(`${gparentUri}?$expand=.($levels=2)`)
              .then((uspRes: any) => {
                if (uspRes.data?.Ports?.Members.length > 0) {
                  for (const uspPort of uspRes.data.Ports.Members) {
                    if (
                      uspPort['@odata.id'] ===
                      enabledUpstreamPort?.['@odata.id']
                    ) {
                      cablesData.detailedInfo.grandParentInfo = {
                        data: uspRes.data,
                        expanderDevice: uspRes.data,
                      };
                      cablesData.detailedInfo.upstreamPorts.push(uspPort);

                      if (uspRes.data.Links?.PCIeDevices?.length > 0) {
                        for (const pcieMember of pcieDeviceMembers) {
                          if (
                            pcieMember['@odata.id'] ===
                            uspRes.data.Links?.PCIeDevices[0]['@odata.id']
                          ) {
                            cablesData.detailedInfo.grandParentInfo.pcieDevice =
                              pcieMember;
                            for (const chas of chassisMembers) {
                              if (
                                pcieMember.Links?.Oem?.IBM?.PCIeSlot?.[
                                  '@odata.id'
                                ] === chas.PCIeSlots['@odata.id']
                              ) {
                                cablesData.detailedInfo.grandParentInfo.expanderSlots =
                                  chas.PCIeSlots.Slots;
                              }
                            }
                            break;
                          }
                        }
                      }
                    }
                  }
                }
              })
              .catch((error: unknown) => {
                console.error(
                  'Error fetching upstream port grandparent',
                  error,
                );
              });
          }
        }

        // DownstreamPorts
        if (Members[index]?.Links?.DownstreamPorts?.length > 0) {
          let correspondingUSP: any = {};

          if (Members[index]?.Links?.UpstreamPorts?.length > 0) {
            if (Members[index]?.Links?.UpstreamPorts?.length === 1) {
              await api
                .get(Members[index]?.Links?.UpstreamPorts[0]['@odata.id'])
                .then((coresponse: any) => {
                  correspondingUSP = coresponse.data;
                })
                .catch((error: unknown) => {
                  console.error('Error fetching upstream port', error);
                });
            } else {
              await Promise.all(
                Members[index]?.Links?.UpstreamPorts.map(async (usp: any) => {
                  await api.get(usp?.['@odata.id']).then(({ data }: any) => {
                    if (data?.Status?.State !== 'Absent') {
                      correspondingUSP = data;
                    }
                  });
                }),
              );
            }
          }

          const gparentUri = Members[index]?.Links?.DownstreamPorts[0][
            '@odata.id'
          ]
            ?.split('/Ports')
            .shift();

          await api
            .get(`${gparentUri}?$expand=.($levels=2)`)
            .then((dspRes: any) => {
              if (dspRes.data?.Ports?.Members.length > 0) {
                for (const dspPort of dspRes.data.Ports.Members) {
                  if (
                    dspPort['@odata.id'] ===
                    Members[index]?.Links?.DownstreamPorts[0]['@odata.id']
                  ) {
                    cablesData.detailedInfo.downstreamPorts.push({
                      data: dspPort,
                      corUSP: correspondingUSP,
                      grandParent: dspRes.data,
                      grandParentLocation:
                        dspRes.data?.Location?.PartLocation?.ServiceLabel,
                    });
                  }
                }
              }
            });
        }

        cablesInfo.push(cablesData);
      }
    })
    .catch((error: unknown) => {
      console.error('Error fetching cables', error);
    });

  // ── Assemble rows ────────────────────────────────────────────────────────────
  const rows: RawPcieRow[] = [];

  for (const chassis of chassisInfo) {
    for (const slot of chassis.detailedInfo.pcieSlots.eachSlot) {
      if (slot.data.Oem?.IBM?.LinkId === 0) continue;

      const row: any = {
        linkId: slot.data.Oem?.IBM?.LinkId,
        resetLinkUri: slot.data.Links?.PCIeDevice?.[0]?.['@odata.id'],
        resetLinkAvailable: false,
        resetLinkValue: undefined,
        parentLinkId: 'Not Applicable',
        linkStatus: 'Open',
        linkType: 'Primary',
        linkSpeed: 'unknown',
        linkWidth: 'unknown',
        pcieHBLocation: {},
        localPortLocation: [],
        tempLocalPortLocation: [],
        remotePortLocation: [],
        ioSlotLocation: [],
        cablePartNumber: [],
        cableLength: [],
        cableType: [],
        cableStatus: [],
      };

      // Reset link availability
      for (const oneChassis of chassisInfo) {
        for (const oneSlot of oneChassis.detailedInfo.pcieSlots.eachSlot) {
          if (
            oneSlot.pcieDeviceLink &&
            oneSlot.pcieDeviceLink === row.resetLinkUri
          ) {
            if (oneSlot.pcieDevice?.Oem?.IBM) {
              row.resetLinkAvailable = true;
              row.resetLinkValue = oneSlot.pcieDevice?.Oem?.IBM?.LinkReset;
            }
          }
        }
      }

      // PCIe HB (processor) location
      if (slot?.processor?.Location?.PartLocation?.ServiceLabel) {
        row.pcieHBLocation = {
          locationIndicatorActive: slot?.processor?.LocationIndicatorActive,
          locationNumber: slot?.processor?.Location?.PartLocation?.ServiceLabel,
          uri: slot?.processor['@odata.id'],
        };
      }

      // IO slot location (direct slot)
      if (slot?.data?.Location?.PartLocation?.ServiceLabel) {
        row.ioSlotLocation.push({
          locationIndicatorActive: slot?.data?.LocationIndicatorActive,
          locationNumber: slot?.data?.Location?.PartLocation?.ServiceLabel,
          uri: chassis?.detailedInfo?.pcieSlots?.data['@odata.id'],
        });
      }

      // PCIe device details
      if (slot?.pcieDevice) {
        row.linkSpeed = slot.pcieDevice?.PCIeInterface?.PCIeType;
        row.linkWidth =
          slot.pcieDevice?.PCIeInterface?.LanesInUse === null
            ? 'unknown'
            : slot.pcieDevice?.PCIeInterface?.LanesInUse;

        const state = slot.pcieDevice?.Status?.State;
        const health = slot.pcieDevice?.Status?.Health;
        if (state === 'Enabled' && health === 'OK') {
          row.linkStatus = 'Operational';
        } else if (state === 'Enabled' && health !== 'OK') {
          row.linkStatus = 'Degraded';
        } else if (state === 'Absent') {
          row.linkStatus = 'Open';
        } else if (state === 'UnavailableOffline') {
          row.linkStatus = 'Failed';
        } else if (state === 'StandbyOffline') {
          row.linkStatus = 'Inactive';
        } else {
          row.linkStatus = 'Unknown';
        }

        // Local port locations from fabric adapters
        for (const adapter of fabricAdapterInfo) {
          if (
            adapter?.pcieDeviceLink &&
            adapter.pcieDeviceLink === slot.pcieDeviceLink
          ) {
            for (const port of adapter.portsData) {
              const duplicate = row.localPortLocation.find(
                (obj: any) =>
                  obj.locationNumber ===
                  port?.Location?.PartLocation?.ServiceLabel,
              );
              if (duplicate === undefined) {
                row.localPortLocation.push({
                  locationIndicatorActive: port?.LocationIndicatorActive,
                  locationNumber: port?.Location?.PartLocation?.ServiceLabel,
                  uri: port['@odata.id'],
                });
              }
            }
          }
        }
      }

      // Cable information
      for (const cable of cablesInfo) {
        if (cable.detailedInfo?.downstreamResources?.length > 0) {
          for (const chaSlot of cable.detailedInfo.downstreamResources[0]
            .pcieSlots) {
            if (
              chaSlot.data?.Oem?.IBM?.LinkId === row.linkId &&
              chaSlot.data.Links?.Oem?.IBM?.AssociatedAssembly &&
              chaSlot.data.Links?.Oem?.IBM?.AssociatedAssembly['@odata.id'] ===
                cable.detailedInfo.downstreamResourcesUri
            ) {
              const expanderSlots =
                cable.detailedInfo?.grandParentInfo?.expanderSlots ?? [];
              for (const expanderSlot of expanderSlots) {
                if (
                  cable.detailedInfo.grandParentInfo.data?.Links
                    ?.PCIeDevices[0]['@odata.id'] ===
                  expanderSlot?.data?.Links?.PCIeDevice?.[0]?.['@odata.id']
                ) {
                  row.linkType = 'Secondary';
                  row.parentLinkId = expanderSlot?.data?.Oem?.IBM?.LinkId;
                  break;
                }
              }
            }
          }
        }

        if (cable.detailedInfo.downstreamChassis.length > 0) {
          const downstream_device =
            cable.detailedInfo.downstreamPorts[0]?.grandParent;
          if (
            downstream_device &&
            slot?.data.Links.PCIeDevice?.[0]?.['@odata.id'] ===
              downstream_device.Links?.PCIeDevices[0]['@odata.id']
          ) {
            const expanderSlots =
              cable.detailedInfo?.grandParentInfo?.expanderSlots ?? [];
            for (const expanderSlot of expanderSlots) {
              if (
                cable.detailedInfo.grandParentInfo.data.Links?.PCIeDevices[0][
                  '@odata.id'
                ] === expanderSlot?.data?.Links?.PCIeDevice?.[0]?.['@odata.id']
              ) {
                row.linkType = 'Secondary';
                if (expanderSlot?.data?.Links?.Processors?.length > 0) {
                  for (const proc of procMembers) {
                    if (
                      proc['@odata.id'] ===
                      expanderSlot.Links?.Processors[0]['@odata.id']
                    ) {
                      row.pcieHBLocation = {
                        locationIndicatorActive: proc?.LocationIndicatorActive,
                        locationNumber:
                          proc?.Location?.PartLocation?.ServiceLabel,
                        uri: proc['@odata.id'],
                      };
                    }
                  }
                }
                row.parentLinkId = expanderSlot?.data?.Oem?.IBM?.LinkId;
                break;
              }
            }
          }
        }

        if (
          cable?.detailedInfo?.upstreamPorts?.length > 0 ||
          cable?.detailedInfo?.downstreamPorts?.length > 0
        ) {
          for (const adapter of fabricAdapterInfo) {
            if (
              adapter?.pcieDeviceLink &&
              adapter.pcieDeviceLink === slot.pcieDeviceLink
            ) {
              const upMatch =
                cable?.detailedInfo?.upstreamPorts.length > 0 &&
                cable?.detailedInfo?.upstreamPorts[0]['@odata.id'].startsWith(
                  adapter.data['@odata.id'] + '/',
                );
              const downMatch =
                cable?.detailedInfo?.downstreamPorts.length > 0 &&
                cable?.detailedInfo?.downstreamPorts[0].data[
                  '@odata.id'
                ].startsWith(adapter.data['@odata.id'] + '/');

              if (upMatch || downMatch) {
                if (cable.detailedInfo.downstreamResources.length > 0) {
                  row.ioSlotLocation = [];
                  for (const slot2 of cable.detailedInfo.downstreamResources[0]
                    .pcieSlots) {
                    if (
                      slot2?.data?.Links?.Oem?.IBM?.AssociatedAssembly &&
                      slot2?.data?.Links?.Oem?.IBM?.AssociatedAssembly[
                        '@odata.id'
                      ] === cable.detailedInfo.downstreamResourcesUri
                    ) {
                      if (slot2?.data?.Location?.PartLocation?.ServiceLabel) {
                        const duplicate = row.ioSlotLocation.find(
                          (obj: any) =>
                            obj.locationNumber ===
                            slot2?.data.Location?.PartLocation?.ServiceLabel,
                        );
                        if (duplicate === undefined) {
                          row.ioSlotLocation.push({
                            locationIndicatorActive:
                              slot2?.data.LocationIndicatorActive,
                            locationNumber:
                              slot2?.data.Location?.PartLocation?.ServiceLabel,
                            uri: cable.detailedInfo.downstreamResources[0]
                              .pcieSlotsUri,
                          });
                        }
                      }
                    }
                  }
                } else if (cable.detailedInfo.downstreamChassis.length > 0) {
                  row.ioSlotLocation = [];
                  for (const dsSlot of cable.detailedInfo.downstreamChassis[0]
                    .pcieSlots) {
                    if (
                      dsSlot?.data?.Links?.Oem?.IBM?.UpstreamFabricAdapters
                        ?.length > 0
                    ) {
                      for (const upstreamFabAdapter of dsSlot.data.Links.Oem.IBM
                        .UpstreamFabricAdapters) {
                        if (
                          upstreamFabAdapter['@odata.id'] ===
                          cable.detailedInfo?.downstreamPorts[0]?.grandParent[
                            '@odata.id'
                          ]
                        ) {
                          const duplicate = row.ioSlotLocation.find(
                            (obj: any) =>
                              obj.locationNumber ===
                              dsSlot?.data?.Location?.PartLocation
                                ?.ServiceLabel,
                          );
                          if (duplicate === undefined) {
                            row.ioSlotLocation.push({
                              locationIndicatorActive:
                                dsSlot?.data?.LocationIndicatorActive,
                              locationNumber:
                                dsSlot?.data?.Location?.PartLocation
                                  ?.ServiceLabel,
                              uri: cable.detailedInfo.downstreamChassis[0]
                                .pcieSlotsUri,
                            });
                          }
                        }
                      }
                    }
                  }

                  if (
                    cable.detailedInfo?.downstreamPorts[0] &&
                    cable.detailedInfo.downstreamPorts[0].data?.Location
                      ?.PartLocation?.ServiceLabel
                  ) {
                    const duplicate = row.remotePortLocation.find(
                      (obj: any) =>
                        obj.locationNumber ===
                        cable.detailedInfo.downstreamPorts[0].data?.Location
                          ?.PartLocation?.ServiceLabel,
                    );
                    if (duplicate === undefined) {
                      row.remotePortLocation.push({
                        locationIndicatorActive:
                          cable.detailedInfo.downstreamPorts[0].data
                            ?.LocationIndicatorActive,
                        locationNumber:
                          cable.detailedInfo.downstreamPorts[0].data?.Location
                            ?.PartLocation?.ServiceLabel,
                        uri: cable.detailedInfo.downstreamPorts[0].data[
                          '@odata.id'
                        ],
                      });
                    }
                    row.tempLocalPortLocation.push({
                      locationIndicatorActive:
                        cable.detailedInfo.downstreamPorts[0].corUSP
                          ?.LocationIndicatorActive,
                      locationNumber:
                        cable.detailedInfo.downstreamPorts[0].corUSP?.Location
                          ?.PartLocation?.ServiceLabel,
                      uri: cable.detailedInfo.downstreamPorts[0].corUSP[
                        '@odata.id'
                      ],
                    });
                  }

                  if (cable.data.PartNumber)
                    row.cablePartNumber.push(cable.data.PartNumber);
                  if (cable.data.LengthMeters)
                    row.cableLength.push(cable.data.LengthMeters);
                  if (cable.data.CableType)
                    row.cableType.push(cable.data.CableType);

                  const cableState = cable.data.Status?.State;
                  const cableStatus = cable.data.CableStatus;
                  if (
                    cableState === 'StandbyOffline' &&
                    cableStatus === 'Disabled'
                  ) {
                    row.cableStatus.push('PoweredOff');
                  } else if (
                    cableState === 'StandbyOffline' &&
                    cableStatus === 'Normal'
                  ) {
                    row.cableStatus.push('Inactive');
                  } else if (cableState === 'Enabled') {
                    row.cableStatus.push('Running');
                  } else {
                    row.cableStatus.push('unknown');
                  }

                  if (row.tempLocalPortLocation.length > 0) {
                    row.localPortLocation = row.tempLocalPortLocation;
                  }
                }
              }
            }
          }
        }
      }

      // Fabric adapter secondary link resolution (without cable)
      for (const adapter of fabricAdapterInfo) {
        const pcieDevice = adapter.data.Links?.PCIeDevices[0]['@odata.id'];
        for (const device of pcieDeviceMembers) {
          if (device['@odata.id'] === pcieDevice) {
            const expanderSlots2 =
              device.Links?.Oem?.IBM?.PCIeSlot?.['@odata.id'];
            for (const chassisValue of chassisInfo) {
              if (chassisValue.detailedInfo.pcieSlotsUri === expanderSlots2) {
                for (const slot2 of chassisValue.detailedInfo.pcieSlots.data
                  .Slots) {
                  if (
                    slot2.Links?.PCIeDevice?.[0]?.['@odata.id'] === pcieDevice
                  ) {
                    if (
                      slot.data?.Links?.Oem?.IBM?.UpstreamFabricAdapters
                        ?.length > 0
                    ) {
                      for (const upstreamFabAdapter of slot.data.Links.Oem.IBM
                        .UpstreamFabricAdapters) {
                        if (
                          upstreamFabAdapter['@odata.id'] ===
                          adapter.data['@odata.id']
                        ) {
                          row.linkType = 'Secondary';
                          row.parentLinkId = slot2.Oem?.IBM?.LinkId;
                          for (const singleRow of rows) {
                            if (singleRow.linkId === slot2.Oem?.IBM?.LinkId) {
                              row.pcieHBLocation = singleRow.pcieHBLocation;
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }

      rows.push(row);
    }
  }

  return rows;
}

// ─── Map raw rows to UI-ready entries (mirrors store's setEntries) ─────────────

function processEntry(pcie: RawPcieRow): PcieTopologyEntry {
  return {
    id: pcie.linkId,
    resetLinkAvailable: pcie.resetLinkAvailable,
    resetLinkUri: pcie.resetLinkUri,
    resetLinkValue: pcie.resetLinkValue,
    parentId: pcie.parentLinkId,
    linkStatus: pcie.linkStatus,
    linkPropertiesSpeed: pcie.linkSpeed,
    linkPropertiesWidth: pcie.linkWidth,
    linkPropertiesType: pcie.linkType,
    pcieBridge: pcie.pcieHBLocation,
    cableLength: pcie.cableLength,
    cablePartNumber: pcie.cablePartNumber,
    cableStatus: pcie.cableStatus,
    cableType: pcie.cableType,
    ioSlots: pcie.ioSlotLocation,
    localPortLocation: pcie.localPortLocation,
    remotePortLocation: pcie.remotePortLocation,
  };
}

// ─── Public composable ────────────────────────────────────────────────────────

/**
 * Composable for fetching and managing PCIe Topology data.
 * Replaces PcieTopologyStore with TanStack Query.
 */
export function usePcieTopology() {
  const queryClient = useQueryClient();

  // ── Main data query ──────────────────────────────────────────────────────────
  const {
    data: rawRows,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<RawPcieRow[]>({
    queryKey: PCIE_QUERY_KEY,
    queryFn: fetchTopologyRows,
    ...RedfishQueryPresets.pcieTopology,
  });

  // Process raw rows into UI-ready entries
  const entries = ref<PcieTopologyEntry[]>([]);

  watch(
    rawRows,
    (rows) => {
      entries.value = (rows ?? []).map(processEntry);
    },
    { immediate: true },
  );

  // ── Refresh topology (triggers PCIeTopologyRefresh on the system) ─────────────
  const refreshMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/redfish/v1/Systems/system/', {
        Oem: { IBM: { PCIeTopologyRefresh: true } },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PCIE_QUERY_KEY });
    },
  });

  // ── Save PCIe topology ────────────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/redfish/v1/Systems/system/', {
        Oem: { IBM: { SavePCIeTopologyInfo: true } },
      });
    },
  });

  // ── Reset a single link ───────────────────────────────────────────────────────
  const resetLinkMutation = useMutation({
    mutationFn: async ({ uri }: { uri: string }) => {
      return await api.patch(uri, {
        Oem: { IBM: { LinkReset: true } },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PCIE_QUERY_KEY });
    },
  });

  // ── LED operations ────────────────────────────────────────────────────────────

  const getLedValue = async (uri: string) => {
    return await api.get(uri);
  };

  const updateLedValue = async ({
    type,
    value,
  }: {
    type: 'ioSlots' | string;
    value: { uri: string; locationNumber: string; led: boolean };
  }) => {
    if (type === 'ioSlots') {
      const ioSlotRes = await api.get(value.uri);
      const tempSlots = ioSlotRes.data.Slots;
      const req = tempSlots.map((tempSlot: any) =>
        tempSlot.Location?.PartLocation?.ServiceLabel === value.locationNumber
          ? { LocationIndicatorActive: value.led }
          : {},
      );
      await api.patch(value.uri, { Slots: req });
    } else {
      await api.patch(value.uri, { LocationIndicatorActive: value.led });
    }
  };

  const getAllLedValues = async (selectedObj: {
    pcieBridge?: { uri: string };
    localPortLocation: Array<{ uri: string }>;
    remotePortLocation: Array<{ uri: string }>;
    ioSlots: Array<{ uri: string; locationNumber: string }>;
  }): Promise<LedValues> => {
    const result: LedValues = {
      pcieBridge: [],
      localPortLocation: [],
      remotePortLocation: [],
      ioSlots: [],
    };

    const fetchPcieBridge = async () => {
      if (selectedObj.pcieBridge?.uri) {
        const { data } = await api.get(selectedObj.pcieBridge.uri);
        result.pcieBridge.push({
          led: data.LocationIndicatorActive,
          locationNumber: data.Location?.PartLocation?.ServiceLabel,
          uri: data['@odata.id'],
        });
      }
    };

    const fetchLocalPorts = async () => {
      await Promise.all(
        selectedObj.localPortLocation.map(async (local) => {
          const { data } = await api.get(local.uri);
          result.localPortLocation.push({
            led: data.LocationIndicatorActive,
            locationNumber: data.Location?.PartLocation?.ServiceLabel,
            uri: data['@odata.id'],
          });
        }),
      );
    };

    const fetchRemotePorts = async () => {
      await Promise.all(
        selectedObj.remotePortLocation.map(async (local) => {
          const { data } = await api.get(local.uri);
          result.remotePortLocation.push({
            led: data.LocationIndicatorActive,
            locationNumber: data.Location?.PartLocation?.ServiceLabel,
            uri: data['@odata.id'],
          });
        }),
      );
    };

    const fetchIoSlots = async () => {
      await Promise.all(
        selectedObj.ioSlots.map(async (ioSlot) => {
          const ioSlotResponse = await api.get(ioSlot.uri);
          const tempSlots = ioSlotResponse.data.Slots;
          for (const tempSlot of tempSlots) {
            if (
              tempSlot.Location?.PartLocation?.ServiceLabel ===
              ioSlot.locationNumber
            ) {
              result.ioSlots.push({
                led: tempSlot.LocationIndicatorActive,
                locationNumber: ioSlot.locationNumber,
                uri: ioSlot.uri,
              });
            }
          }
        }),
      );
    };

    await Promise.all([
      fetchPcieBridge(),
      fetchLocalPorts(),
      fetchRemotePorts(),
      fetchIoSlots(),
    ]);

    return result;
  };

  return {
    // Data
    entries,

    // Loading / error states
    isLoading,
    isFetching,
    isError,
    error,

    // Refetch
    refetch,

    // Mutations
    refreshTopology: refreshMutation.mutateAsync,
    saveTopology: saveMutation.mutateAsync,
    resetLink: resetLinkMutation.mutateAsync,

    // Mutation pending states
    isRefreshing: refreshMutation.isPending,
    isSaving: saveMutation.isPending,
    isResettingLink: resetLinkMutation.isPending,

    // LED helpers
    getLedValue,
    updateLedValue,
    getAllLedValues,
  };
}
