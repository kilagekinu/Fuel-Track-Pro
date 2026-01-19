
export enum FuelType {
  ADO = 'ADO',
  ULP = 'ULP',
  ZOOM = 'ZOOM'
}

export enum UserRole {
  OPERATOR = 'OPERATOR',
  STOCK_CONTROLLER = 'STOCK_CONTROLLER',
  SUPERVISOR = 'SUPERVISOR',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export interface Tank {
  id: string;
  name: string;
  fuelType: FuelType;
  capacity: number;
  currentVolume: number;
}

export interface Meter {
  id: string;
  name: string;
  type: 'GANTRY' | 'DRUM' | 'PUMP';
  lastReading: number;
}

export interface ReconciliationVersion {
  version: number;
  calculatedSales: number;
  variance: number;
  timestamp: string;
  changedBy: string;
  reason: string;
}

export interface Reconciliation {
  id: string;
  date: string;
  fuelType: FuelType;
  openingStock: number;
  receipts: number;
  transfers: number;
  calculatedSales: number;
  actualDips: number;
  variance: number;
  revenue: number;
  isLocked: boolean;
  status: 'PENDING' | 'APPROVED';
  operatorId: string;
  approverId?: string;
  timestamp: string;
  version: number;
  versionHistory: ReconciliationVersion[];
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  details: string;
  timestamp: string;
}

export interface MeterReading {
  id: string;
  meterId: string;
  reading: number;
  timestamp: string;
  recordedBy: string;
}

export interface TankDip {
  id: string;
  tankId: string;
  dipLevel: number;
  volume: number;
  timestamp: string;
  recordedBy: string;
}

export interface StockReceipt {
  id: string;
  fuelType: FuelType;
  volume: number;
  referenceDoc: string;
  timestamp: string;
  recordedBy: string;
}
