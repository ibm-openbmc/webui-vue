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
      let chassisInfo = [];
      let fabricAdapterInfo = [];
      let cablesInfo = [];
      await api
        .get('redfish/v1/Chassis')
        .then(async ({ data: { Members = [] } }) => {
          let chassisLength = Members.length;
          let index = 0;
          while (index < chassisLength) {
            let chassisData = {};
            await api
              .get(Members[index]['@odata.id'])
              .then(async (chassisResponse) => {
                const singleChassisData = chassisResponse.data;
                chassisData['chassisMember'] = Members[index];
                chassisData['detailedInfo'] = {};
                chassisData['data'] = singleChassisData;
                await api
                  .get(chassisResponse.data.PCIeSlots['@odata.id'])
                  .then(async (pcieSlotsResponse) => {
                    chassisData.detailedInfo['pcieSlotsUri'] =
                      chassisResponse.data.PCIeSlots['@odata.id'];
                    chassisData.detailedInfo['pcieSlots'] = {};
                    chassisData.detailedInfo.pcieSlots['data'] =
                      pcieSlotsResponse.data;
                    let pcieSlotsLength = pcieSlotsResponse.data.Slots.length;
                    let j = 0;
                    chassisData.detailedInfo.pcieSlots['eachSlot'] = [];
                    while (j < pcieSlotsLength) {
                      const singleSlotData = {};
                      singleSlotData['data'] = pcieSlotsResponse.data.Slots[j];
                      if (
                        pcieSlotsResponse.data.Slots[j].Links?.PCIeDevice
                          .length > 0
                      ) {
                        let isLinkSet = false;
                        if (chassisInfo.length > 0) {
                          for (
                            let z = 0;
                            z < chassisInfo.length && !isLinkSet;
                            z++
                          ) {
                            const oneChassis = chassisInfo[z];
                            for (
                              let y = 0;
                              y <
                                oneChassis.detailedInfo.pcieSlots.eachSlot
                                  .length && !isLinkSet;
                              y++
                            ) {
                              const oneSlot =
                                oneChassis.detailedInfo.pcieSlots.eachSlot[y];
                              if (
                                oneSlot.pcieDeviceLink &&
                                oneSlot.pcieDeviceLink ===
                                  pcieSlotsResponse.data.Slots[j].Links
                                    ?.PCIeDevice[0]['@odata.id']
                              ) {
                                isLinkSet = true;
                                singleSlotData['pcieDevice'] =
                                  oneSlot.pcieDevice;
                                singleSlotData['pcieDeviceLink'] =
                                  oneSlot.pcieDeviceLink;
                                break;
                              }
                            }
                          }
                        } else {
                          for (
                            let x = 0;
                            x <
                              chassisData.detailedInfo.pcieSlots.eachSlot
                                .length && !isLinkSet;
                            x++
                          ) {
                            const oneSlot =
                              chassisData.detailedInfo.pcieSlots.eachSlot[x];
                            if (
                              oneSlot.pcieDeviceLink &&
                              oneSlot.pcieDeviceLink ===
                                pcieSlotsResponse.data.Slots[j].Links
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
                        if (!isLinkSet) {
                          await api
                            .get(
                              pcieSlotsResponse.data.Slots[j].Links
                                ?.PCIeDevice[0]['@odata.id']
                            )
                            .then(async (deviceResponse) => {
                              singleSlotData['pcieDevice'] =
                                deviceResponse.data;
                              singleSlotData['pcieDeviceLink'] =
                                pcieSlotsResponse.data.Slots[
                                  j
                                ].Links?.PCIeDevice[0]['@odata.id'];
                            })
                            .catch((error) => {
                              console.log('error', error);
                            });
                        }
                      }
                      if (
                        pcieSlotsResponse.data.Slots[j].Links?.Processors &&
                        pcieSlotsResponse.data.Slots[j].Links?.Processors
                          .length > 0
                      ) {
                        let isProcSet = false;
                        if (chassisInfo.length > 0) {
                          for (
                            let z = 0;
                            z < chassisInfo.length && !isProcSet;
                            z++
                          ) {
                            const oneChassis = chassisInfo[z];
                            for (
                              let y = 0;
                              y <
                                oneChassis.detailedInfo.pcieSlots.eachSlot
                                  .length && !isProcSet;
                              y++
                            ) {
                              const oneSlot =
                                oneChassis.detailedInfo.pcieSlots.eachSlot[y];
                              if (
                                oneSlot.processorLink &&
                                oneSlot.processorLink ===
                                  pcieSlotsResponse.data.Slots[j].Links
                                    ?.Processors[0]['@odata.id']
                              ) {
                                isProcSet = true;
                                singleSlotData['processor'] = oneSlot.processor;
                                singleSlotData['processorLink'] =
                                  oneSlot.processorLink;
                                break;
                              }
                            }
                          }
                        } else {
                          for (
                            let x = 0;
                            x <
                              chassisData.detailedInfo.pcieSlots.eachSlot
                                .length && !isProcSet;
                            x++
                          ) {
                            const oneSlot =
                              chassisData.detailedInfo.pcieSlots.eachSlot[x];
                            if (
                              oneSlot.processorLink &&
                              oneSlot.processorLink ===
                                pcieSlotsResponse.data.Slots[j].Links
                                  ?.Processors[0]['@odata.id']
                            ) {
                              isProcSet = true;
                              singleSlotData['processor'] = oneSlot.processor;
                              singleSlotData['processorLink'] =
                                oneSlot.processorLink;
                              break;
                            }
                          }
                        }
                        if (!isProcSet) {
                          await api
                            .get(
                              pcieSlotsResponse.data.Slots[j].Links
                                ?.Processors[0]['@odata.id']
                            )
                            .then(async (processorResponse) => {
                              singleSlotData['processor'] =
                                processorResponse.data;
                              singleSlotData['processorLink'] =
                                pcieSlotsResponse.data.Slots[
                                  j
                                ].Links?.Processors[0]['@odata.id'];
                            })
                            .catch((error) => {
                              console.log('error', error);
                            });
                        }
                      }
                      if (
                        pcieSlotsResponse.data.Slots[j].Links?.Oem?.IBM
                          ?.AssociatedAssembly.length > 0
                      ) {
                        let isAssemblySet = false;
                        if (chassisInfo.length > 0) {
                          for (let z = 0; z < chassisInfo.length; z++) {
                            const oneChassis = chassisInfo[z];
                            for (
                              let y = 0;
                              y <
                              oneChassis.detailedInfo.pcieSlots.eachSlot.length;
                              y++
                            ) {
                              const oneSlot =
                                oneChassis.detailedInfo.pcieSlots.eachSlot[y];
                              if (
                                oneSlot.associatedAssemblyLink &&
                                oneSlot.associatedAssemblyLink ===
                                  pcieSlotsResponse.data.Slots[j].Links?.Oem.IBM
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
                        } else {
                          for (
                            let x = 0;
                            x <
                            chassisData.detailedInfo.pcieSlots.eachSlot.length;
                            x++
                          ) {
                            const oneSlot =
                              chassisData.detailedInfo.pcieSlots.eachSlot[x];
                            if (
                              oneSlot?.associatedAssemblyLink ===
                              pcieSlotsResponse.data.Slots[j].Links?.Oem.IBM
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
                              pcieSlotsResponse.data.Slots[j].Links?.Oem.IBM
                                .AssociatedAssembly[0]['@odata.id']
                            )
                            .then(async (assemblyResponse) => {
                              singleSlotData['associatedAssembly'] =
                                assemblyResponse.data;
                              singleSlotData['associatedAssemblyLink'] =
                                pcieSlotsResponse.data.Slots[
                                  j
                                ].Links?.Oem?.IBM?.AssociatedAssembly[0][
                                  '@odata.id'
                                ];
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
                  })
                  .catch((error) => {
                    console.log('error', error);
                  });
              })
              .catch((error) => {
                console.log('error', error);
              });
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
        .get('redfish/v1/Systems/system/FabricAdapters')
        .then(async ({ data: { Members = [] } }) => {
          let adaptersLength = Members.length;
          let index = 0;
          while (index < adaptersLength) {
            let adapterData = {};
            adapterData['adapterMembers'] = Members;
            await api
              .get(Members[index]['@odata.id'])
              .then(async (adapterResponse) => {
                adapterData['data'] = adapterResponse.data;
                if (adapterResponse.data.Links?.PCIeDevices.length > 0) {
                  adapterData['pcieDeviceLink'] =
                    adapterResponse.data.Links?.PCIeDevices[0]['@odata.id'];
                  if (adapterResponse.data.Ports) {
                    adapterData['portsLink'] =
                      adapterResponse.data.Ports['@odata.id'];
                    await api
                      .get(adapterResponse.data.Ports['@odata.id'])
                      .then(async (singlePort) => {
                        adapterData['portsData'] = [];
                        const portsLength = singlePort.data.Members.length;
                        let j = 0;
                        while (j < portsLength) {
                          api
                            .get(singlePort.data.Members[j]['@odata.id'])
                            .then(async (singlePortValue) => {
                              adapterData['portsData'].push(
                                singlePortValue.data
                              );
                            })
                            .catch((error) => {
                              console.log('error', error);
                            });
                          if (j < portsLength) {
                            j++;
                          }
                        }
                      })
                      .catch((error) => {
                        console.log('error', error);
                      });
                  }
                }
              });
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
        .get('redfish/v1/Cables')
        .then(async ({ data: { Members = [] } }) => {
          let cablesLength = Members.length;
          let index = 0;
          while (index < cablesLength) {
            let cablesData = {};
            await api
              .get(Members[index]['@odata.id'])
              .then(async (cablesResponse) => {
                cablesData['data'] = cablesResponse.data;
                cablesData['detailedInfo'] = {};
                cablesData.detailedInfo.downstreamChassis = [];
                cablesData.detailedInfo.downstreamResources = [];
                cablesData.detailedInfo.upstreamPorts = [];
                cablesData.detailedInfo.downstreamPorts = [];
                cablesData.detailedInfo.grandparentUri = '';
                if (
                  cablesResponse.data.Links?.DownstreamResources &&
                  cablesResponse.data.Links?.DownstreamResources?.length > 0
                ) {
                  cablesData.detailedInfo.downstreamResourcesUri =
                    cablesResponse.data.Links?.DownstreamResources[0][
                      '@odata.id'
                    ];
                  let isAssemblySet = false;
                  if (chassisInfo.length > 0) {
                    chassisInfo.map((oneChassis) => {
                      oneChassis.detailedInfo.pcieSlots.eachSlot.map(
                        (oneSlot) => {
                          if (
                            !isAssemblySet &&
                            oneSlot.associatedAssemblyLink &&
                            oneSlot.associatedAssemblyLink ===
                              cablesResponse.data.Links?.DownstreamResources[0][
                                '@odata.id'
                              ]
                          ) {
                            isAssemblySet = true;
                            const parentUri = oneSlot.associatedAssemblyLink
                              .split('/Assembly')
                              .shift();
                            for (
                              let index = 0;
                              index < chassisInfo.length;
                              index++
                            ) {
                              const assemblyChassis = chassisInfo[index];
                              if (
                                assemblyChassis.chassisMember['@odata.id'] ===
                                parentUri
                              ) {
                                cablesData.detailedInfo.downstreamResources.push(
                                  {
                                    data:
                                      assemblyChassis.detailedInfo.pcieSlots
                                        .data,
                                    pcieSlots:
                                      assemblyChassis.detailedInfo.pcieSlots
                                        .eachSlot,
                                    pcieSlotsUri:
                                      assemblyChassis.detailedInfo.pcieSlotsUri,
                                  }
                                );
                                break;
                              }
                            }
                          }
                        }
                      );
                    });
                  }
                  if (!isAssemblySet) {
                    await api
                      .get(
                        cablesResponse.data.Links?.DownstreamResources[0][
                          '@odata.id'
                        ]
                      )
                      .then(async (downstreamResources) => {
                        const downstreamUri =
                          downstreamResources.data['@odata.id'];
                        const parentUri = downstreamUri
                          .split('/Assembly')
                          .shift();
                        await api
                          .get(parentUri)
                          .then(async (chassisRes) => {
                            await api
                              .get(chassisRes.data.PCIeSlots['@odata.id'])
                              .then(async (pcieslotRes) => {
                                cablesData.detailedInfo.downstreamResources.push(
                                  {
                                    data: downstreamResources.data,
                                    pcieSlots: pcieslotRes.data.Slots,
                                    pcieSlotsUri:
                                      chassisRes.data.PCIeSlots['@odata.id'],
                                  }
                                );
                              })
                              .catch((error) => {
                                console.log('error', error);
                              });
                          })
                          .catch((error) => {
                            console.log('error', error);
                          });
                      })
                      .catch((error) => {
                        console.log('error', error);
                      });
                  }
                }
                if (
                  cablesResponse.data.Links?.DownstreamChassis &&
                  cablesResponse.data.Links?.DownstreamChassis?.length > 0
                ) {
                  const dsChassis =
                    cablesResponse.data.Links?.DownstreamChassis[0][
                      '@odata.id'
                    ];
                  let isDsChassisSet = false;
                  if (chassisInfo.length > 0) {
                    for (let index = 0; index < chassisInfo.length; index++) {
                      const downstreamChassisInfo = chassisInfo[index];
                      if (
                        downstreamChassisInfo.chassisMember['@odata.id'] ===
                        dsChassis
                      ) {
                        cablesData.detailedInfo.downstreamChassis.push({
                          data:
                            downstreamChassisInfo.detailedInfo.pcieSlots.data,
                          pcieSlots:
                            downstreamChassisInfo.detailedInfo.pcieSlots
                              .eachSlot,
                          pcieSlotsUri:
                            downstreamChassisInfo.detailedInfo.pcieSlotsUri,
                        });
                        isDsChassisSet = true;
                        break;
                      }
                    }
                  }
                  if (!isDsChassisSet) {
                    await api
                      .get(
                        cablesResponse.data.Links?.DownstreamChassis[0][
                          '@odata.id'
                        ]
                      )
                      .then(async (downstreamChassis) => {
                        await api
                          .get(downstreamChassis.data.PCIeSlots['@odata.id'])
                          .then(async (pcieSlotsResp) => {
                            cablesData.detailedInfo.downstreamChassis.push({
                              data: downstreamChassis.data,
                              pcieSlots: pcieSlotsResp.data.Slots,
                              pcieSlotsUri:
                                downstreamChassis.data.PCIeSlots['@odata.id'],
                            });
                          })
                          .catch((error) => {
                            console.log('error', error);
                          });
                      })
                      .catch((error) => {
                        console.log('error', error);
                      });
                  }
                }
                if (
                  cablesResponse.data.Links?.UpstreamPorts &&
                  cablesResponse.data.Links?.UpstreamPorts?.length > 0
                ) {
                  const grandparentUrl = cablesResponse.data.Links?.UpstreamPorts[0][
                    '@odata.id'
                  ]
                    .split('/Ports')
                    .shift();
                  cablesData.detailedInfo.grandparentUri = grandparentUrl;
                  let isAdapterSet = false;
                  if (fabricAdapterInfo.length > 0) {
                    for (
                      let index = 0;
                      index < fabricAdapterInfo.length;
                      index++
                    ) {
                      const element = fabricAdapterInfo[index];
                      if (element.data['@odata.id'] === grandparentUrl) {
                        if (element?.portsData?.length > 0) {
                          for (let m = 0; m < element?.portsData?.length; m++) {
                            const singlePort = element?.portsData[m];
                            if (
                              singlePort['@odata.id'] ===
                              cablesResponse.data.Links?.UpstreamPorts[0][
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
                                      oneChassis.detailedInfo.pcieSlots
                                        .eachSlot[k];
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
                                      for (
                                        let l = 0;
                                        l < chassisInfo.length;
                                        l++
                                      ) {
                                        const oneChassis = chassisInfo[l];
                                        if (
                                          oneChassis.chassisMember[
                                            '@odata.id'
                                          ] === slotParent
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
                    await api
                      .get(
                        cablesResponse.data.Links?.UpstreamPorts[0]['@odata.id']
                      )
                      .then(async (upstreamPorts) => {
                        cablesData.detailedInfo.upstreamPorts.push(
                          upstreamPorts.data
                        );
                        const upstreamPortsUri =
                          upstreamPorts.data['@odata.id'];
                        const grandparentUri = upstreamPortsUri
                          .split('/Ports')
                          .shift();
                        cablesData.detailedInfo.grandparentUri = grandparentUri;
                        await api
                          .get(grandparentUri)
                          .then(async (grandparentResponse) => {
                            cablesData.detailedInfo['grandParentInfo'] = {};
                            cablesData.detailedInfo.grandParentInfo.data =
                              grandparentResponse.data;
                            cablesData.detailedInfo.grandParentInfo.expanderDevice =
                              grandparentResponse.data;
                            if (
                              grandparentResponse.data.Links?.PCIeDevices &&
                              grandparentResponse.data.Links?.PCIeDevices
                                .length > 0
                            ) {
                              await api
                                .get(
                                  grandparentResponse.data.Links
                                    ?.PCIeDevices[0]['@odata.id']
                                )
                                .then(async (pcieDeviceResponse) => {
                                  cablesData.detailedInfo.grandParentInfo.pcieDevice =
                                    pcieDeviceResponse.data;
                                  await api
                                    .get(
                                      pcieDeviceResponse.data.Links?.Oem?.IBM
                                        ?.PCIeSlot['@odata.id']
                                    )
                                    .then(async (slotResponse) => {
                                      cablesData.detailedInfo.grandParentInfo.expanderSlots =
                                        slotResponse.data.Slots;
                                    })
                                    .catch((error) => {
                                      console.log('error', error);
                                    });
                                })
                                .catch((error) => {
                                  console.log('error', error);
                                });
                            }
                          })
                          .catch((error) => {
                            console.log('error', error);
                          });
                      })
                      .catch((error) => {
                        console.log('error', error);
                      });
                  }
                }
                if (
                  cablesResponse.data.Links?.DownstreamPorts &&
                  cablesResponse.data.Links?.DownstreamPorts?.length > 0
                ) {
                  const gparentUri = cablesResponse.data.Links?.DownstreamPorts[0][
                    '@odata.id'
                  ]
                    .split('/Ports')
                    .shift();
                  let isAdapterSet = false;
                  if (fabricAdapterInfo.length > 0) {
                    for (
                      let index = 0;
                      index < fabricAdapterInfo.length;
                      index++
                    ) {
                      const element = fabricAdapterInfo[index];
                      if (element.data['@odata.id'] === gparentUri) {
                        isAdapterSet = true;
                        if (element?.portsData?.length > 0) {
                          for (let m = 0; m < element?.portsData?.length; m++) {
                            if (
                              element?.portsData[m]['@odata.id'] ===
                              cablesResponse.data.Links?.DownstreamPorts[0][
                                '@odata.id'
                              ]
                            ) {
                              cablesData.detailedInfo.downstreamPorts.push({
                                data: element?.portsData[m],
                                grandParentLocation:
                                  element.data?.Location?.PartLocation
                                    ?.ServiceLabel,
                              });
                            }
                          }
                        }
                      }
                    }
                  }
                  if (!isAdapterSet) {
                    await api
                      .get(
                        cablesResponse.data.Links?.DownstreamPorts[0][
                          '@odata.id'
                        ]
                      )
                      .then(async (dpResponse) => {
                        let downstreamPortUri = dpResponse.data['@odata.id'];
                        const gparentUri = downstreamPortUri
                          .split('/Ports')
                          .shift();
                        await api
                          .get(gparentUri)
                          .then(async (chassisResp) => {
                            if (
                              chassisResp.data?.Location?.PartLocation
                                ?.ServiceLabel
                            ) {
                              cablesData.detailedInfo.downstreamPorts.push({
                                data: dpResponse.data,
                                grandParentLocation:
                                  chassisResp.data?.Location?.PartLocation
                                    ?.ServiceLabel,
                              });
                            }
                          })
                          .catch((error) => {
                            console.log('error', error);
                          });
                      });
                  }
                }
              })
              .catch((error) => {
                console.log('error', error);
              });
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
                    row['parentLinkId'] = expanderSlot.data?.Oem?.IBM?.LinkId;
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
                        row['parentLinkId'] =
                          expanderSlot.data?.Oem?.IBM?.LinkId;
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
