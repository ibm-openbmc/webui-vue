import api from '@/store/api';
import i18n from '@/i18n';

const PcieTopologyStore = {
  namespaced: true,
  state: {
    entries: [],
  },
  getters: {
    entries: (state) => state.entries,
  },
  mutations: {
    setEntries: (state, data) => {
      state.entries = data.map((pcie) => {
        return {
          id: pcie?.linkId,
          resetLinkAvailable: pcie?.resetLinkAvailable,
          resetLinkUri: pcie?.resetLinkUri,
          resetLinkValue: pcie?.resetLinkValue,
          parentId: pcie?.parentLinkId,
          linkStatus: pcie?.linkStatus,
          localPortLocation: pcie?.localPortLocation,
          remotePortLocation: pcie?.remotePortLocation,
          linkPropertiesSpeed: pcie?.linkSpeed,
          linkPropertiesWidth: pcie?.linkWidth,
          linkPropertiesType: pcie?.linkType,
          pcieBridge: pcie?.pcieHBLocation,
          cableLength: pcie?.cableLength,
          cablePartNumber: pcie?.cablePartNumber,
          cableStatus: pcie?.cableStatus,
          cableType: pcie?.cableType,
          ioSlots: pcie?.ioSlotLocation,
        };
      });
    },
  },
  actions: {
    async resetTheLink(_, requestBody) {
      const body = {
        Oem: {
          IBM: {
            LinkReset: true,
          },
        },
      };
      return await api.patch(requestBody.uri, body);
    },
    async refreshPage() {
      const body = {
        Oem: {
          IBM: {
            PCIeTopologyRefresh: true,
          },
        },
      };
      await api.patch('/redfish/v1/Systems/system/', body).catch((error) => {
        console.error('Error', error);
      });
    },
    async savePcie() {
      const body = {
        Oem: {
          IBM: {
            SavePCIeTopologyInfo: true,
          },
        },
      };
      await api.patch('/redfish/v1/Systems/system/', body).catch((error) => {
        console.error('Error', error);
      });
    },
    async getTopologyScreen({ commit }) {
      let chassisMembers = [];
      let pcieDeviceMembers = [];
      let procMembers = [];
      let chassisInfo = [];
      let fabricAdapterInfo = [];
      let cablesInfo = [];
      await api
        .get('redfish/v1/Systems/system/PCIeDevices?$expand=.($levels=2)')
        .then(async (pcieDeviceResponse) => {
          pcieDeviceMembers = pcieDeviceResponse.data.Members;
        });
      await api
        .get('redfish/v1/Systems/system/Processors/?$expand=.($levels=2)')
        .then(async (procResponse) => {
          procMembers = procResponse.data.Members;
        });
      await api
        .get('redfish/v1/Chassis?$expand=.($levels=2)')
        .then(async (chassisResponse) => {
          chassisMembers = chassisResponse.data.Members;
          let chassisLength = chassisResponse.data.Members.length;
          let index = 0;
          while (index < chassisLength) {
            let chassisData = {};
            const singleChassisData = chassisResponse.data.Members[index];
            chassisData['chassisMember'] = chassisMembers[index];
            chassisData['detailedInfo'] = {};
            chassisData['data'] = singleChassisData;
            chassisData.detailedInfo['pcieSlotsUri'] =
              chassisMembers[index].PCIeSlots['@odata.id'];
            chassisData.detailedInfo['pcieSlots'] = {};
            chassisData.detailedInfo.pcieSlots['data'] =
              chassisMembers[index].PCIeSlots;
            let pcieSlotsLength = chassisMembers[index].PCIeSlots.Slots.length;
            let j = 0;
            chassisData.detailedInfo.pcieSlots['eachSlot'] = [];
            while (j < pcieSlotsLength) {
              const singleSlotData = {};
              singleSlotData['data'] = chassisMembers[index].PCIeSlots.Slots[j];
              if (
                chassisMembers[index].PCIeSlots.Slots[j].Links?.PCIeDevice
                  .length > 0
              ) {
                let isLinkSet = false;
                if (chassisInfo.length > 0) {
                  for (let z = 0; z < chassisInfo.length && !isLinkSet; z++) {
                    const oneChassis = chassisInfo[z];
                    for (
                      let y = 0;
                      y < oneChassis.detailedInfo.pcieSlots.eachSlot.length &&
                      !isLinkSet;
                      y++
                    ) {
                      const oneSlot =
                        oneChassis.detailedInfo.pcieSlots.eachSlot[y];
                      if (
                        oneSlot.pcieDeviceLink &&
                        oneSlot.pcieDeviceLink ===
                          chassisMembers[index].PCIeSlots.Slots[j].Links
                            ?.PCIeDevice[0]['@odata.id']
                      ) {
                        isLinkSet = true;
                        singleSlotData['pcieDevice'] = oneSlot.pcieDevice;
                        singleSlotData['pcieDeviceLink'] =
                          oneSlot.pcieDeviceLink;
                        break;
                      }
                    }
                  }
                } else {
                  for (
                    let x = 0;
                    x < chassisData.detailedInfo.pcieSlots.eachSlot.length &&
                    !isLinkSet;
                    x++
                  ) {
                    const oneSlot =
                      chassisData.detailedInfo.pcieSlots.eachSlot[x];
                    if (
                      oneSlot.pcieDeviceLink &&
                      oneSlot.pcieDeviceLink ===
                        chassisMembers[index].PCIeSlots.Slots[j].Links
                          ?.PCIeDevice[0]['@odata.id']
                    ) {
                      isLinkSet = true;
                      singleSlotData['pcieDevice'] = oneSlot.pcieDevice;
                      singleSlotData['pcieDeviceLink'] = oneSlot.pcieDeviceLink;
                      break;
                    }
                  }
                }
                if (!isLinkSet) {
                  pcieDeviceMembers.map((singleDevice) => {
                    if (
                      singleDevice['@odata.id'] ===
                      chassisMembers[index].PCIeSlots.Slots[j].Links
                        ?.PCIeDevice[0]['@odata.id']
                    ) {
                      singleSlotData['pcieDevice'] = singleDevice;
                      singleSlotData['pcieDeviceLink'] =
                        chassisMembers[index].PCIeSlots.Slots[
                          j
                        ].Links?.PCIeDevice[0]['@odata.id'];
                    }
                  });
                }
              }
              if (
                chassisMembers[index].PCIeSlots.Slots[j].Links?.Processors &&
                chassisMembers[index].PCIeSlots.Slots[j].Links?.Processors
                  .length > 0
              ) {
                let isProcSet = false;
                if (chassisInfo.length > 0) {
                  for (let z = 0; z < chassisInfo.length && !isProcSet; z++) {
                    const oneChassis = chassisInfo[z];
                    for (
                      let y = 0;
                      y < oneChassis.detailedInfo.pcieSlots.eachSlot.length &&
                      !isProcSet;
                      y++
                    ) {
                      const oneSlot =
                        oneChassis.detailedInfo.pcieSlots.eachSlot[y];
                      if (
                        oneSlot.processorLink &&
                        oneSlot.processorLink ===
                          chassisMembers[index].PCIeSlots.Slots[j].Links
                            ?.Processors[0]['@odata.id']
                      ) {
                        isProcSet = true;
                        singleSlotData['processor'] = oneSlot.processor;
                        singleSlotData['processorLink'] = oneSlot.processorLink;
                        break;
                      }
                    }
                  }
                } else {
                  for (
                    let x = 0;
                    x < chassisData.detailedInfo.pcieSlots.eachSlot.length &&
                    !isProcSet;
                    x++
                  ) {
                    const oneSlot =
                      chassisData.detailedInfo.pcieSlots.eachSlot[x];
                    if (
                      oneSlot.processorLink &&
                      oneSlot.processorLink ===
                        chassisMembers[index].PCIeSlots.Slots[j].Links
                          ?.Processors[0]['@odata.id']
                    ) {
                      isProcSet = true;
                      singleSlotData['processor'] = oneSlot.processor;
                      singleSlotData['processorLink'] = oneSlot.processorLink;
                      break;
                    }
                  }
                }
                if (!isProcSet) {
                  procMembers.map((singleProc) => {
                    if (
                      singleProc['@odata.id'] ===
                      chassisMembers[index].PCIeSlots.Slots[j].Links
                        ?.Processors[0]['@odata.id']
                    ) {
                      singleSlotData['processor'] = singleProc;
                      singleSlotData['processorLink'] =
                        chassisMembers[index].PCIeSlots.Slots[
                          j
                        ].Links?.Processors[0]['@odata.id'];
                    }
                  });
                }
              }
              if (
                chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem?.IBM
                  ?.AssociatedAssembly.length > 0
              ) {
                let isAssemblySet = false;
                if (chassisInfo.length > 0) {
                  for (let z = 0; z < chassisInfo.length; z++) {
                    const oneChassis = chassisInfo[z];
                    for (
                      let y = 0;
                      y < oneChassis.detailedInfo.pcieSlots.eachSlot.length;
                      y++
                    ) {
                      const oneSlot =
                        oneChassis.detailedInfo.pcieSlots.eachSlot[y];
                      if (
                        oneSlot.associatedAssemblyLink &&
                        oneSlot.associatedAssemblyLink ===
                          chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem
                            .IBM.AssociatedAssembly[0]['@odata.id']
                      ) {
                        isAssemblySet = true;
                        singleSlotData['associatedAssembly'] =
                          oneSlot.associatedAssembly;
                        singleSlotData['associatedAssemblyLink'] =
                          oneSlot.associatedAssemblyLink;
                      }
                    }
                  }
                } else {
                  for (
                    let x = 0;
                    x < chassisData.detailedInfo.pcieSlots.eachSlot.length;
                    x++
                  ) {
                    const oneSlot =
                      chassisData.detailedInfo.pcieSlots.eachSlot[x];
                    if (
                      oneSlot?.associatedAssemblyLink ===
                      chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem.IBM
                        .AssociatedAssembly[0]['@odata.id']
                    ) {
                      isAssemblySet = true;
                      singleSlotData['associatedAssembly'] =
                        oneSlot.associatedAssembly;
                      singleSlotData['associatedAssemblyLink'] =
                        oneSlot.associatedAssemblyLink;
                    }
                  }
                }
                if (!isAssemblySet) {
                  await api
                    .get(
                      chassisMembers[index].PCIeSlots.Slots[j].Links?.Oem.IBM
                        .AssociatedAssembly[0]['@odata.id']
                    )
                    .then(async (assemblyResponse) => {
                      singleSlotData['associatedAssembly'] =
                        assemblyResponse.data;
                      singleSlotData['associatedAssemblyLink'] =
                        chassisMembers[index].PCIeSlots.Slots[
                          j
                        ].Links?.Oem?.IBM?.AssociatedAssembly[0]['@odata.id'];
                    })
                    .catch((error) => {
                      console.log('error', error);
                    });
                }
              }
              chassisData.detailedInfo.pcieSlots['eachSlot'].push(
                singleSlotData
              );
              if (j < pcieSlotsLength) {
                j++;
              }
            }
            chassisInfo.push(chassisData);
            if (index < chassisLength) {
              index++;
            }
          }
        })
        .catch((error) => {
          console.log('error', error);
        });
      await api
        .get('redfish/v1/Systems/system/FabricAdapters?$expand=.($levels=3)')
        .then(async ({ data: { Members = [] } }) => {
          let adaptersLength = Members.length;
          let adapterMembers = Members;
          let index = 0;
          while (index < adaptersLength) {
            let adapterData = {};
            adapterData['adapterMembers'] = Members;
            adapterData['data'] = Members[index];
            if (adapterMembers[index].Links?.PCIeDevices.length > 0) {
              adapterData['pcieDeviceLink'] =
                adapterMembers[index].Links?.PCIeDevices[0]['@odata.id'];
              if (adapterMembers[index].Ports) {
                adapterData['portsLink'] =
                  adapterMembers[index].Ports['@odata.id'];
                let portMembers = adapterMembers[index].Ports.Members;
                adapterData['portsData'] = [];
                const portsLength = portMembers.length;
                let j = 0;
                while (j < portsLength) {
                  adapterData['portsData'].push(portMembers[j]);
                  if (j < portsLength) {
                    j++;
                  }
                }
              }
            }
            if (index < adaptersLength) {
              index++;
            }
            fabricAdapterInfo.push(adapterData);
          }
        })
        .catch((error) => {
          console.log('error', error);
        });

      await api
        .get('redfish/v1/Cables?$expand=.($levels=3)')
        .then(async ({ data: { Members = [] } }) => {
          let cableMembers = Members;
          let cablesLength = Members.length;
          let index = 0;
          while (index < cablesLength) {
            let cablesData = {};
            cablesData['data'] = cableMembers[index];
            cablesData['detailedInfo'] = {};
            cablesData.detailedInfo.downstreamChassis = [];
            cablesData.detailedInfo.downstreamResources = [];
            cablesData.detailedInfo.upstreamPorts = [];
            cablesData.detailedInfo.downstreamPorts = [];
            cablesData.detailedInfo.grandparentUri = '';
            if (
              cableMembers[index]?.Links?.DownstreamResources &&
              cableMembers[index]?.Links?.DownstreamResources?.length > 0
            ) {
              cablesData.detailedInfo.downstreamResourcesUri =
                cableMembers[index]?.Links?.DownstreamResources[0]['@odata.id'];
              let isAssemblySet = false;
              if (chassisInfo.length > 0) {
                chassisInfo.map((oneChassis) => {
                  oneChassis.detailedInfo.pcieSlots.eachSlot.map((oneSlot) => {
                    if (
                      !isAssemblySet &&
                      oneSlot.associatedAssemblyLink &&
                      oneSlot.associatedAssemblyLink ===
                        cableMembers[index]?.Links?.DownstreamResources[0][
                          '@odata.id'
                        ]
                    ) {
                      isAssemblySet = true;
                      const parentUri = oneSlot.associatedAssemblyLink
                        .split('/Assembly')
                        .shift();
                      for (let index = 0; index < chassisInfo.length; index++) {
                        const assemblyChassis = chassisInfo[index];
                        if (
                          assemblyChassis.chassisMember['@odata.id'] ===
                          parentUri
                        ) {
                          cablesData.detailedInfo.downstreamResources.push({
                            data: assemblyChassis.detailedInfo.pcieSlots.data,
                            pcieSlots:
                              assemblyChassis.detailedInfo.pcieSlots.eachSlot,
                            pcieSlotsUri:
                              assemblyChassis.detailedInfo.pcieSlotsUri,
                          });
                          break;
                        }
                      }
                    }
                  });
                });
              }
              if (!isAssemblySet) {
                await api
                  .get(
                    cableMembers[index]?.Links?.DownstreamResources[0][
                      '@odata.id'
                    ]
                  )
                  .then(async (downstreamResources) => {
                    const downstreamUri = downstreamResources.data['@odata.id'];
                    const parentUri = downstreamUri.split('/Assembly').shift();
                    chassisMembers.map((singleChassisMember) => {
                      if (singleChassisMember['@odata.id'] === parentUri) {
                        cablesData.detailedInfo.downstreamResources.push({
                          data: downstreamResources.data,
                          pcieSlots: singleChassisMember.PCIeSlots.Slots,
                          pcieSlotsUri:
                            singleChassisMember.PCIeSlots['@odata.id'],
                        });
                      }
                    });
                  })
                  .catch((error) => {
                    console.log('error', error);
                  });
              }
            }
            if (
              cableMembers[index]?.Links?.DownstreamChassis &&
              cableMembers[index]?.Links?.DownstreamChassis?.length > 0
            ) {
              const dsChassis =
                cableMembers[index]?.Links?.DownstreamChassis[0]['@odata.id'];
              let isDsChassisSet = false;
              if (chassisInfo.length > 0) {
                for (let index = 0; index < chassisInfo.length; index++) {
                  const downstreamChassisInfo = chassisInfo[index];
                  if (
                    downstreamChassisInfo.chassisMember['@odata.id'] ===
                    dsChassis
                  ) {
                    cablesData.detailedInfo.downstreamChassis.push({
                      data: downstreamChassisInfo.detailedInfo.pcieSlots.data,
                      pcieSlots:
                        downstreamChassisInfo.detailedInfo.pcieSlots.eachSlot,
                      pcieSlotsUri:
                        downstreamChassisInfo.detailedInfo.pcieSlotsUri,
                    });
                    isDsChassisSet = true;
                    break;
                  }
                }
              }
              if (!isDsChassisSet) {
                chassisMembers.map((singleCha) => {
                  if (singleCha['@odata.id'] === dsChassis) {
                    cablesData.detailedInfo.downstreamChassis.push({
                      data: singleCha,
                      pcieSlots: singleCha.PCIeSlots.Slots,
                      pcieSlotsUri: singleCha.PCIeSlots['@odata.id'],
                    });
                  }
                });
              }
            }
            if (
              cableMembers[index]?.Links?.UpstreamPorts &&
              cableMembers[index]?.Links?.UpstreamPorts?.length > 0
            ) {
              const grandparentUrl = cableMembers[
                index
              ].Links?.UpstreamPorts[0]['@odata.id']
                .split('/Ports')
                .shift();
              cablesData.detailedInfo.grandparentUri = grandparentUrl;
              let isAdapterSet = false;
              if (fabricAdapterInfo.length > 0) {
                for (let index = 0; index < fabricAdapterInfo.length; index++) {
                  const element = fabricAdapterInfo[index];
                  if (element.data['@odata.id'] === grandparentUrl) {
                    if (element?.portsData?.length > 0) {
                      for (let m = 0; m < element?.portsData?.length; m++) {
                        const singlePort = element?.portsData[m];
                        if (
                          singlePort['@odata.id'] ===
                          cableMembers[index]?.Links?.UpstreamPorts[0][
                            '@odata.id'
                          ]
                        ) {
                          cablesData.detailedInfo.upstreamPorts.push(
                            singlePort
                          );
                          cablesData.detailedInfo['grandParentInfo'] = {};
                          cablesData.detailedInfo.grandParentInfo.data =
                            element.data;
                          cablesData.detailedInfo.grandParentInfo.expanderDevice =
                            element.data;
                          if (chassisInfo.length > 0) {
                            chassisInfo.map((oneChassis) => {
                              for (
                                let k = 0;
                                k <
                                oneChassis.detailedInfo.pcieSlots.eachSlot
                                  .length;
                                k++
                              ) {
                                const oneSlot =
                                  oneChassis.detailedInfo.pcieSlots.eachSlot[k];
                                if (
                                  oneSlot.pcieDeviceLink &&
                                  oneSlot.pcieDeviceLink ===
                                    element.data?.Links?.PCIeDevices[0][
                                      '@odata.id'
                                    ]
                                ) {
                                  const slotParent = oneSlot.pcieDevice?.Links?.Oem?.IBM?.PCIeSlot[
                                    '@odata.id'
                                  ]
                                    .split('/PCIeSlots')
                                    .shift();
                                  for (let l = 0; l < chassisInfo.length; l++) {
                                    const oneChassis = chassisInfo[l];
                                    if (
                                      oneChassis.chassisMember['@odata.id'] ===
                                      slotParent
                                    ) {
                                      cablesData.detailedInfo.grandParentInfo.expanderSlots =
                                        oneChassis.detailedInfo.pcieSlots.eachSlot;
                                      isAdapterSet = true;
                                      break;
                                    }
                                  }
                                }
                              }
                            });
                          }
                        }
                      }
                    }
                  }
                }
              }
              if (!isAdapterSet) {
                const gparentUri = cableMembers[index]?.Links?.UpstreamPorts[0][
                  '@odata.id'
                ]
                  .split('/Ports')
                  .shift();
                cablesData.detailedInfo.grandparentUri = gparentUri;
                await api
                  .get(`${gparentUri}?$expand=.($levels=2)`)
                  .then((uspRes) => {
                    if (uspRes.data?.Ports?.Members.length > 0) {
                      const uspPorts = uspRes.data?.Ports?.Members;
                      for (let p = 0; p < uspPorts.length; p++) {
                        if (
                          uspPorts[p]['@odata.id'] ===
                          cableMembers[index]?.Links?.UpstreamPorts[0][
                            '@odata.id'
                          ]
                        ) {
                          cablesData.detailedInfo['grandParentInfo'] = {};
                          cablesData.detailedInfo.grandParentInfo.data =
                            uspRes.data;
                          cablesData.detailedInfo.grandParentInfo.expanderDevice =
                            uspRes.data;
                          cablesData.detailedInfo.upstreamPorts.push(
                            uspPorts[p]
                          );
                          if (
                            uspRes.data.Links?.PCIeDevices &&
                            uspRes.data.Links?.PCIeDevices.length > 0
                          ) {
                            let isPcieDevice = false;
                            pcieDeviceMembers.map((pcieMember) => {
                              if (
                                !isPcieDevice &&
                                pcieMember['@odata.id'] ===
                                  uspRes.data.Links?.PCIeDevices[0]['@odata.id']
                              ) {
                                cablesData.detailedInfo.grandParentInfo.pcieDevice = pcieMember;
                                isPcieDevice = true;
                                chassisMembers.map((chas) => {
                                  let slotSet = false;
                                  if (
                                    !slotSet &&
                                    pcieMember.Links?.Oem?.IBM?.PCIeSlot[
                                      '@odata.id'
                                    ] === chas.PCIeSlots['@odata.id']
                                  ) {
                                    cablesData.detailedInfo.grandParentInfo.expanderSlots =
                                      chas.PCIeSlots.Slots;
                                    slotSet = true;
                                  }
                                });
                              }
                            });
                          }
                        }
                      }
                    }
                  })
                  .catch((error) => {
                    console.log('error', error);
                  });
              }
            }
            if (
              cableMembers[index]?.Links?.DownstreamPorts &&
              cableMembers[index]?.Links?.DownstreamPorts?.length > 0
            ) {
              const gparentUri = cableMembers[index]?.Links?.DownstreamPorts[0][
                '@odata.id'
              ]
                .split('/Ports')
                .shift();
              await api
                .get(`${gparentUri}?$expand=.($levels=2)`)
                .then((dspRes) => {
                  if (dspRes.data?.Ports?.Members.length > 0) {
                    const dspPorts = dspRes.data?.Ports?.Members;
                    for (let p = 0; p < dspPorts.length; p++) {
                      if (
                        dspPorts[p]['@odata.id'] ===
                        cableMembers[index]?.Links?.DownstreamPorts[0][
                          '@odata.id'
                        ]
                      ) {
                        cablesData.detailedInfo.downstreamPorts.push({
                          data: dspPorts[p],
                          grandParentLocation:
                            dspRes.data?.Location?.PartLocation?.ServiceLabel,
                        });
                      }
                    }
                  }
                });
            }
            if (index < cablesLength) {
              index++;
            }
            cablesInfo.push(cablesData);
          }
        })
        .catch((error) => {
          console.log('error', error);
        });
      const rows = [];
      chassisInfo.map(async (chassis) => {
        chassis.detailedInfo.pcieSlots.eachSlot.map(async (slot) => {
          if (slot.data.Oem?.IBM?.LinkId !== 0) {
            let row = {};
            row.linkId = slot.data.Oem?.IBM?.LinkId;
            row.resetLinkUri = slot.data.Links?.PCIeDevice[0]['@odata.id'];
            if (chassisInfo.length > 0) {
              chassisInfo.map((oneChassis) => {
                oneChassis.detailedInfo.pcieSlots.eachSlot.map((oneSlot) => {
                  if (
                    oneSlot.pcieDeviceLink &&
                    oneSlot.pcieDeviceLink === row.resetLinkUri
                  ) {
                    if (oneSlot.pcieDevice?.Oem?.IBM) {
                      row.resetLinkAvailable = true;
                      row.resetLinkValue =
                        oneSlot.pcieDevice?.Oem?.IBM?.LinkReset;
                    } else {
                      row.resetLinkAvailable = false;
                    }
                  }
                });
              });
            }
            if (
              slot?.processor &&
              slot?.processor?.Location?.PartLocation?.ServiceLabel
            ) {
              row.pcieHBLocation = {
                locationIndicatorActive:
                  slot?.processor?.LocationIndicatorActive,
                locationNumber:
                  slot?.processor?.Location?.PartLocation?.ServiceLabel,
                uri: slot?.processor['@odata.id'],
              };
            } else {
              row.pcieHBLocation = {};
            }
            row.parentLinkId = 'Not Applicable';
            row.linkStatus = 'Open';
            row.linkType = 'Primary';
            row.linkSpeed = 'unknown';
            row.linkWidth = 'unknown';
            row.localPortLocation = [];
            row.remotePortLocation = [];
            row.ioSlotLocation = [];
            if (slot?.data?.Location?.PartLocation?.ServiceLabel) {
              row.ioSlotLocation.push({
                locationIndicatorActive: slot?.data?.LocationIndicatorActive,
                locationNumber:
                  slot?.data?.Location?.PartLocation?.ServiceLabel,
                uri: chassis?.detailedInfo?.pcieSlots?.data['@odata.id'],
              });
            }
            row.cablePartNumber = [];
            row.cableLength = [];
            row.cableType = [];
            row.cableStatus = [];
            if (slot?.pcieDevice) {
              row.linkSpeed = slot?.pcieDevice?.PCIeInterface?.PCIeType;
              row.linkWidth =
                slot?.pcieDevice?.PCIeInterface?.LanesInUse === -1
                  ? 'unknown'
                  : slot?.pcieDevice?.PCIeInterface?.LanesInUse;
              if (
                slot?.pcieDevice?.Status?.State === 'Enabled' &&
                slot?.pcieDevice?.Status?.Health === 'OK'
              ) {
                row['linkStatus'] = 'Operational';
              } else if (
                slot?.pcieDevice?.Status?.State === 'Enabled' &&
                slot?.pcieDevice?.Status?.Health !== 'OK'
              ) {
                row['linkStatus'] = 'Degraded';
              } else if (slot?.pcieDevice?.Status?.State === 'Absent') {
                row['linkStatus'] = 'Open';
              } else if (
                slot?.pcieDevice?.Status?.State === 'UnavailableOffline'
              ) {
                row['linkStatus'] = 'Failed';
              } else if (slot?.pcieDevice?.Status?.State === 'StandbyOffline') {
                row['linkStatus'] = 'Inactive';
              } else {
                row['linkStatus'] = 'Unknown';
              }
              fabricAdapterInfo.map((adapter) => {
                if (
                  adapter?.pcieDeviceLink &&
                  adapter.pcieDeviceLink === slot.pcieDeviceLink
                ) {
                  adapter.portsData.map((port) => {
                    const duplicate = row.localPortLocation.find((obj) => {
                      if (
                        obj.locationNumber ===
                        port?.Location?.PartLocation?.ServiceLabel
                      ) {
                        return true;
                      }
                    });
                    if (duplicate === undefined) {
                      row.localPortLocation.push({
                        locationIndicatorActive: port?.LocationIndicatorActive,
                        locationNumber:
                          port?.Location?.PartLocation?.ServiceLabel,
                        uri: port['@odata.id'],
                      });
                    }
                  });
                }
              });
            }
            cablesInfo.map((cable) => {
              if (cable.detailedInfo?.downstreamResources?.length > 0) {
                if (
                  slot.associatedAssemblyLink ===
                  cable.detailedInfo.downstreamResourcesUri
                ) {
                  for (
                    let i = 0;
                    i <
                    cable.detailedInfo?.grandParentInfo?.expanderSlots?.length;
                    i++
                  ) {
                    const expanderSlot =
                      cable.detailedInfo?.grandParentInfo?.expanderSlots[i];
                    row['linkType'] = 'Secondary';
                    row['parentLinkId'] = expanderSlot.Oem?.IBM?.LinkId;
                    break;
                  }
                }
              }
              if (cable.detailedInfo.downstreamChassis.length > 0) {
                cable.detailedInfo.downstreamChassis[0].pcieSlots.map(
                  (singleSlot) => {
                    if (
                      slot?.pcieDeviceLink ===
                      singleSlot.data?.Links?.PCIeDevice[0]['@odata.id']
                    ) {
                      for (
                        let i = 0;
                        i <
                        cable.detailedInfo.grandParentInfo.expanderSlots.length;
                        i++
                      ) {
                        const expanderSlot =
                          cable.detailedInfo.grandParentInfo.expanderSlots[i];
                        row['linkType'] = 'Secondary';
                        row['parentLinkId'] = expanderSlot.Oem?.IBM?.LinkId;
                        break;
                      }
                    }
                  }
                );
              }
              if (cable.detailedInfo.upstreamPorts.length > 0) {
                fabricAdapterInfo.map((adapter) => {
                  if (
                    adapter?.pcieDeviceLink &&
                    adapter.pcieDeviceLink === slot.pcieDeviceLink
                  ) {
                    if (
                      cable.detailedInfo.upstreamPorts[0][
                        '@odata.id'
                      ].startsWith(adapter.data['@odata.id'])
                    ) {
                      if (cable.detailedInfo.downstreamResources.length > 0) {
                        row.ioSlotLocation = [];
                        cable.detailedInfo.downstreamResources[0].pcieSlots.map(
                          (slot2) => {
                            if (
                              slot2.Links?.Oem?.IBM?.AssociatedAssembly ===
                              cable.detailedInfo.downstreamResourcesUri
                            ) {
                              if (slot2?.Location?.PartLocation?.ServiceLabel) {
                                const duplicate = row.ioSlotLocation.find(
                                  (obj) => {
                                    if (
                                      obj.locationNumber ===
                                      slot2?.Location?.PartLocation
                                        ?.ServiceLabel
                                    ) {
                                      return true;
                                    }
                                  }
                                );
                                if (duplicate === undefined) {
                                  row.ioSlotLocation.push({
                                    locationIndicatorActive:
                                      slot2?.LocationIndicatorActive,
                                    locationNumber:
                                      slot2?.Location?.PartLocation
                                        ?.ServiceLabel,
                                    uri:
                                      cable.detailedInfo.downstreamResources[0]
                                        .pcieSlotsUri,
                                  });
                                }
                              }
                            }
                          }
                        );
                      } else if (
                        cable.detailedInfo.downstreamChassis.length > 0
                      ) {
                        row.ioSlotLocation = [];
                        cable.detailedInfo.downstreamChassis[0].pcieSlots.map(
                          (dsSlot) => {
                            if (
                              dsSlot?.data?.Location?.PartLocation?.ServiceLabel
                            ) {
                              if (
                                dsSlot?.data?.Location?.PartLocation?.ServiceLabel.startsWith(
                                  cable.detailedInfo?.downstreamPorts[0]
                                    ?.grandParentLocation
                                )
                              ) {
                                const duplicate = row.ioSlotLocation.find(
                                  (obj) => {
                                    if (
                                      obj.locationNumber ===
                                      dsSlot?.data?.Location?.PartLocation
                                        ?.ServiceLabel
                                    ) {
                                      return true;
                                    }
                                  }
                                );
                                if (duplicate === undefined) {
                                  row.ioSlotLocation.push({
                                    locationIndicatorActive:
                                      dsSlot?.data?.LocationIndicatorActive,
                                    locationNumber:
                                      dsSlot?.data?.Location?.PartLocation
                                        ?.ServiceLabel,
                                    uri:
                                      cable.detailedInfo.downstreamChassis[0]
                                        .pcieSlotsUri,
                                  });
                                }
                              }
                            }
                          }
                        );

                        if (
                          cable.detailedInfo?.downstreamPorts[0] &&
                          cable.detailedInfo.downstreamPorts[0].data?.Location
                            ?.PartLocation?.ServiceLabel
                        ) {
                          const duplicate = row.remotePortLocation.find(
                            (obj) => {
                              if (
                                obj.locationNumber ===
                                cable.detailedInfo.downstreamPorts[0].data
                                  ?.Location?.PartLocation?.ServiceLabel
                              ) {
                                return true;
                              }
                            }
                          );
                          if (duplicate === undefined) {
                            row.remotePortLocation.push({
                              locationIndicatorActive:
                                cable.detailedInfo.downstreamPorts[0].data
                                  ?.LocationIndicatorActive,
                              locationNumber:
                                cable.detailedInfo.downstreamPorts[0].data
                                  ?.Location?.PartLocation?.ServiceLabel,
                              uri:
                                cable.detailedInfo.downstreamPorts[0].data[
                                  '@odata.id'
                                ],
                            });
                          }
                        }
                        if (cable.data.PartNumber) {
                          row['cablePartNumber'].push(cable.data.PartNumber);
                        }
                        if (cable.data.LengthMeters) {
                          row['cableLength'].push(cable.data.LengthMeters);
                        }
                        if (cable.data.CableType) {
                          row['cableType'].push(cable.data.CableType);
                        }
                        if (
                          cable.data.Status?.State === 'StandbyOffline' &&
                          cable.data.CableStatus === 'Disabled'
                        ) {
                          row['cableStatus'].push('PoweredOff');
                        } else if (
                          cable.data.Status?.State === 'StandbyOffline' &&
                          cable.data.CableStatus === 'Normal'
                        ) {
                          row['cableStatus'].push('Inactive');
                        } else if (cable.data.Status?.State === 'Enabled') {
                          row['cableStatus'].push('Running');
                        } else {
                          row['cableStatus'].push('unknown');
                        }
                      }
                    }
                  }
                });
              }
            });
            rows.push(row);
            commit('setEntries', rows);
          }
        });
      });
    },
    async getLedValue(_, requestBody) {
      const uri = requestBody.uri;
      return await api.get(uri);
    },
    async updateLedValue(_, requestBody) {
      await api.all(
        [''].map(async () => {
          if (requestBody.type === 'ioSlots') {
            const uri = requestBody.value.uri;
            let req = [];
            await api.get(uri).then(async (ioSlotRes) => {
              const tempSlots = ioSlotRes.data.Slots;
              await api.all(
                tempSlots.map(async (tempSlot) => {
                  if (
                    tempSlot.Location?.PartLocation?.ServiceLabel ===
                    requestBody.value.locationNumber
                  ) {
                    req.push({
                      LocationIndicatorActive: requestBody.value.led,
                    });
                  } else {
                    req.push({});
                  }
                })
              );
            });
            await api.patch(uri, { Slots: req });
          } else {
            const uri = requestBody.value.uri;
            const updatedIdentifyLedValue = {
              LocationIndicatorActive: requestBody.value.led,
            };
            await api.patch(uri, updatedIdentifyLedValue).catch((error) => {
              console.log('error', error);
              if (!requestBody.locationIndicatorActive) {
                throw new Error(
                  i18n.t('pageInventory.toast.errorEnableIdentifyLed')
                );
              } else {
                throw new Error(
                  i18n.t('pageInventory.toast.errorDisableIdentifyLed')
                );
              }
            });
          }
        })
      );
    },
    async getAllLedValues(_, selectedObj) {
      let returningObj = {
        pcieBridge: [],
        localPortLocation: [],
        remotePortLocation: [],
        ioSlots: [],
      };
      await api.all(
        [''].map(async () => {
          if (selectedObj.pcieBridge?.uri) {
            await api.get(selectedObj.pcieBridge?.uri).then(({ data }) => {
              returningObj.pcieBridge.push({
                led: data.LocationIndicatorActive,
                locationNumber: data.Location?.PartLocation?.ServiceLabel,
                uri: data['@odata.id'],
              });
            });
          }
          if (selectedObj.localPortLocation.length > 0) {
            await api.all(
              selectedObj.localPortLocation.map(async (local) => {
                await api.get(local.uri).then(({ data }) => {
                  returningObj.localPortLocation.push({
                    led: data.LocationIndicatorActive,
                    locationNumber: data.Location?.PartLocation?.ServiceLabel,
                    uri: data['@odata.id'],
                  });
                });
              })
            );
          }
          if (selectedObj.remotePortLocation.length > 0) {
            await api.all(
              selectedObj.remotePortLocation.map(async (local) => {
                await api.get(local.uri).then(({ data }) => {
                  returningObj.remotePortLocation.push({
                    led: data.LocationIndicatorActive,
                    locationNumber: data.Location?.PartLocation?.ServiceLabel,
                    uri: data['@odata.id'],
                  });
                });
              })
            );
          }
          if (selectedObj.ioSlots.length > 0) {
            await api.all(
              selectedObj.ioSlots.map(async (ioSlot) => {
                api.get(ioSlot.uri).then(async (ioSlotResponse) => {
                  const tempSlots = ioSlotResponse.data.Slots;
                  await api.all(
                    tempSlots.map((tempSlot) => {
                      if (
                        tempSlot.Location?.PartLocation?.ServiceLabel ===
                        ioSlot.locationNumber
                      ) {
                        returningObj.ioSlots.push({
                          led: tempSlot.LocationIndicatorActive,
                          locationNumber: ioSlot.locationNumber,
                          uri: ioSlot.uri,
                        });
                      }
                    })
                  );
                });
              })
            );
          }
        })
      );
      return returningObj;
    },
  },
};

export default PcieTopologyStore;
