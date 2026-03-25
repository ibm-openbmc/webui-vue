/**
 * Redfish API Type Definitions
 * Preserves PascalCase property names as per Redfish specification
 */

export interface ODataId {
  '@odata.id': string;
}

export interface ODataType {
  '@odata.type': string;
}

export interface ODataContext {
  '@odata.context': string;
}

export interface ODataCount {
  '@odata.count': number;
}

export interface Resource extends ODataId, ODataType {
  Id: string;
  Name: string;
  Description?: string;
}

export interface ResourceCollection extends ODataContext, ODataCount {
  Members: ODataId[];
  'Members@odata.count': number;
}

export interface Status {
  State?:
    | 'Enabled'
    | 'Disabled'
    | 'StandbyOffline'
    | 'StandbySpare'
    | 'InTest'
    | 'Starting'
    | 'Absent'
    | 'UnavailableOffline'
    | 'Deferring'
    | 'Quiesced'
    | 'Updating';
  Health?: 'OK' | 'Warning' | 'Critical';
  HealthRollup?: 'OK' | 'Warning' | 'Critical';
}

export interface ServiceRoot extends Resource {
  RedfishVersion: string;
  UUID: string;
  Systems: ODataId;
  Chassis: ODataId;
  Managers: ODataId;
  SessionService: ODataId;
  AccountService: ODataId;
  UpdateService?: ODataId;
  EventService?: ODataId;
  Registries?: ODataId;
  JsonSchemas?: ODataId;
  Tasks?: ODataId;
  Cables?: ODataId;
  Fabrics?: ODataId;
  Storage?: ODataId;
  ProtocolFeaturesSupported?: {
    ExpandQuery?: {
      ExpandAll?: boolean;
      Levels?: boolean;
      MaxLevels?: number;
      Links?: boolean;
      NoLinks?: boolean;
    };
    SelectQuery?: boolean;
    FilterQuery?: boolean;
    OnlyMemberQuery?: boolean;
    ExcerptQuery?: boolean;
  };
}

export interface Sensor extends Resource {
  Reading?: number;
  ReadingUnits?: string;
  ReadingType?: string;
  Status: Status;
  PhysicalContext?: string;
  PhysicalSubContext?: string;
  Thresholds?: {
    UpperCritical?: { Reading?: number; Activation?: string };
    UpperCaution?: { Reading?: number; Activation?: string };
    LowerCritical?: { Reading?: number; Activation?: string };
    LowerCaution?: { Reading?: number; Activation?: string };
  };
  MinReadingRange?: number;
  MaxReadingRange?: number;
  Accuracy?: number;
  Precision?: number;
  SensingInterval?: string;
  SensorResetTime?: string;
}

export interface SensorCollection extends ResourceCollection {
  Members: (ODataId | Sensor)[];
}

export interface Chassis extends Resource {
  ChassisType: string;
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  PartNumber?: string;
  AssetTag?: string;
  Status: Status;
  Sensors?: ODataId;
  Thermal?: ODataId;
  Power?: ODataId;
  Links?: {
    ComputerSystems?: ODataId[];
    ManagedBy?: ODataId[];
    ManagersInChassis?: ODataId[];
    Drives?: ODataId[];
    Storage?: ODataId[];
    PCIeDevices?: ODataId[];
  };
}

export interface ChassisCollection extends ResourceCollection {
  Members: (ODataId | Chassis)[];
}

export interface System extends Resource {
  SystemType?: string;
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  PartNumber?: string;
  UUID?: string;
  AssetTag?: string;
  Status: Status;
  PowerState?: 'On' | 'Off' | 'PoweringOn' | 'PoweringOff';
  BiosVersion?: string;
  LocationIndicatorActive?: boolean;
  ProcessorSummary?: {
    Count?: number;
    Model?: string;
    Status?: Status;
  };
  MemorySummary?: {
    TotalSystemMemoryGiB?: number;
    Status?: Status;
  };
  Processors?: ODataId;
  Memory?: ODataId;
  Storage?: ODataId;
  EthernetInterfaces?: ODataId;
  Links?: {
    Chassis?: ODataId[];
    ManagedBy?: ODataId[];
  };
}

export interface SystemCollection extends ResourceCollection {
  Members: (ODataId | System)[];
}

export interface Memory extends Resource {
  MemoryType?: string;
  MemoryDeviceType?: string;
  CapacityMiB?: number;
  DataWidthBits?: number;
  BusWidthBits?: number;
  Manufacturer?: string;
  SerialNumber?: string;
  PartNumber?: string;
  Status: Status;
  OperatingSpeedMhz?: number;
  AllowedSpeedsMHz?: number[];
  FirmwareRevision?: string;
  RankCount?: number;
}

export interface MemoryCollection extends ResourceCollection {
  Members: (ODataId | Memory)[];
}

export interface Processor extends Resource {
  ProcessorType?: string;
  ProcessorArchitecture?: string;
  InstructionSet?: string;
  Manufacturer?: string;
  Model?: string;
  MaxSpeedMHz?: number;
  TotalCores?: number;
  TotalThreads?: number;
  Status: Status;
  Socket?: string;
  ProcessorId?: {
    VendorId?: string;
    IdentificationRegisters?: string;
    EffectiveFamily?: string;
    EffectiveModel?: string;
    Step?: string;
    MicrocodeInfo?: string;
  };
}

export interface ProcessorCollection extends ResourceCollection {
  Members: (ODataId | Processor)[];
}

export interface Drive extends Resource {
  Status: Status;
  CapacityBytes?: number;
  Protocol?: string;
  MediaType?: string;
  Manufacturer?: string;
  Model?: string;
  SerialNumber?: string;
  PartNumber?: string;
  Revision?: string;
  FailurePredicted?: boolean;
  EncryptionAbility?: string;
  EncryptionStatus?: string;
  RotationSpeedRPM?: number;
  BlockSizeBytes?: number;
  CapableSpeedGbs?: number;
  NegotiatedSpeedGbs?: number;
}

export interface DriveCollection extends ResourceCollection {
  Members: (ODataId | Drive)[];
}

export interface Storage extends Resource {
  Status: Status;
  Drives?: ODataId[];
  StorageControllers?: Array<{
    '@odata.id'?: string;
    MemberId?: string;
    Name?: string;
    Status?: Status;
    Manufacturer?: string;
    Model?: string;
    SpeedGbps?: number;
    FirmwareVersion?: string;
    SupportedControllerProtocols?: string[];
    SupportedDeviceProtocols?: string[];
  }>;
  Volumes?: ODataId;
  Links?: {
    Enclosures?: ODataId[];
  };
}

export interface StorageCollection extends ResourceCollection {
  Members: (ODataId | Storage)[];
}

export interface Manager extends Resource {
  ManagerType?: string;
  ServiceEntryPointUUID?: string;
  UUID?: string;
  Model?: string;
  Status: Status;
  DateTime?: string;
  DateTimeLocalOffset?: string;
  FirmwareVersion?: string;
  LastResetTime?: string;
  PowerState?: 'On' | 'Off' | 'PoweringOn' | 'PoweringOff';
  Links?: {
    ManagerForServers?: ODataId[];
    ManagerForChassis?: ODataId[];
    ManagerInChassis?: ODataId;
    ActiveSoftwareImage?: ODataId;
  };
  EthernetInterfaces?: ODataId;
  NetworkProtocol?: ODataId;
  LogServices?: ODataId;
  VirtualMedia?: ODataId;
}

export interface ManagerCollection extends ResourceCollection {
  Members: (ODataId | Manager)[];
}

export interface Session extends Resource {
  UserName?: string;
  ClientOriginIPAddress?: string;
  Context?: string;
}

export interface SessionCollection extends ResourceCollection {
  Members: (ODataId | Session)[];
}

export interface AssemblyCollection extends ResourceCollection {
  Members: (ODataId | Assembly)[];
}

export interface AssemblyItem {
  MemberId: string;
  Location?: {
    PartLocation?: {
      ServiceLabel?: string;
    };
  };
  Oem?: {
    OpenBMC?: {
      ReadyToRemove?: boolean;
    };
  };
}

export interface Assembly extends Resource {
  Assemblies: AssemblyItem[];
  'Assemblies@odata.count': number;
}

// Expanded collection response type
export interface ExpandedCollection<T extends Resource>
  extends ResourceCollection {
  Members: T[];
}

// Helper type for API responses
export type RedfishResponse<T> = T;

// Event Log Types
export interface EventLog extends Resource {
  EventId?: string;
  Severity?: 'OK' | 'Warning' | 'Critical';
  Created: string;
  EntryType?: 'Event' | 'SEL' | 'Oem';
  Message?: string;
  Modified?: string;
  Resolution?: string;
  Resolved?: boolean;
  AdditionalDataURI?: string;
}

export interface EventLogCollection extends ResourceCollection {
  Members: (ODataId | EventLog)[];
}

// Audit Log Types
export interface AuditLog extends Resource {
  EventTimestamp: string;
  Id: string;
  Message?: string;
  MessageArgs?: string[];
  Oem?: {
    IBM?: {
      AdditionalDataFullAuditLogURI?: string;
    };
  };
}

export interface AuditLogCollection extends ResourceCollection {
  Members: (ODataId | AuditLog)[];
}

// Helper type for collection responses
export type CollectionResponse<T extends Resource> =
  | ResourceCollection
  | ExpandedCollection<T>;

// Power Control Types
export interface PowerLimitWatts {
  Reading?: number;
  ControlMode?: 'Disabled' | 'Automatic' | 'Manual';
  SetPoint?: number;
  AllowableMin?: number;
  AllowableMax?: number;
}

export interface EnvironmentMetrics extends Resource {
  PowerWatts?: {
    Reading?: number;
  };
  PowerLimitWatts?: PowerLimitWatts;
}

// System Power Mode Types
export interface IdlePowerSaver {
  Enabled?: boolean;
  EnterDwellTimeSeconds?: number;
  ExitDwellTimeSeconds?: number;
  EnterUtilizationPercent?: number;
  ExitUtilizationPercent?: number;
}

export interface SystemPowerMode extends Resource {
  PowerMode?:
    | 'MaximumPerformance'
    | 'EfficiencyFavorPower'
    | 'PowerSaving'
    | 'OEM';
  'PowerMode@Redfish.AllowableValues'?: string[];
  IdlePowerSaver?: IdlePowerSaver;
  AssetTag?: string;
  LocationIndicatorActive?: boolean;
}

// License Types
export interface License extends Resource {
  SerialNumber?: string;
  ExpirationDate?: string;
  LicenseScope?: {
    MaxNumberOfDevices?: number;
  };
}

export interface LicenseCollection extends ResourceCollection {
  Members: (ODataId | License)[];
}

// Firmware Types
export interface FirmwareInventory extends Resource {
  Version?: string;
  RelatedItem?: ODataId[];
}

export interface FirmwareInventoryCollection extends ResourceCollection {
  Members: (ODataId | FirmwareInventory)[];
}

// Network Types
export interface IPv4Address {
  Address?: string;
  SubnetMask?: string;
  AddressOrigin?: 'DHCP' | 'Static' | 'BOOTP' | 'IPv4LinkLocal';
  Gateway?: string;
}

export interface EthernetInterface extends Resource {
  HostName?: string;
  IPv4Addresses?: IPv4Address[];
  IPv4StaticAddresses?: IPv4Address[];
  MACAddress?: string;
  SpeedMbps?: number;
  InterfaceEnabled?: boolean;
  LinkStatus?: 'LinkUp' | 'LinkDown' | 'NoLink';
  Status?: Status;
}

export interface EthernetInterfaceCollection extends ResourceCollection {
  Members: (ODataId | EthernetInterface)[];
}

// Account Service Types
export interface Account extends Resource {
  UserName?: string;
  RoleId?: string;
  Locked?: boolean;
  Enabled?: boolean;
  Password?: string;
  AccountTypes?: string[];
}

export interface AccountCollection extends ResourceCollection {
  Members: (ODataId | Account)[];
}
