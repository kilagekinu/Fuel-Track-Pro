
import { FuelType, Reconciliation, UserRole } from '../types';

export const generateSampleDay = (operatorId: string): Reconciliation[] => {
  const date = new Date().toLocaleDateString();
  const timestamp = new Date().toISOString();

  return [
    {
      id: `rc-ado-test`,
      date,
      fuelType: FuelType.ADO,
      openingStock: 42000,
      receipts: 5000,
      transfers: 0,
      calculatedSales: 3200,
      actualDips: 43750, // Intentional variance: (42000 + 5000 - 3200) = 43800. Variance = -50
      variance: -50,
      revenue: 5920,
      isLocked: false,
      status: 'PENDING',
      operatorId,
      timestamp,
      version: 1,
      versionHistory: []
    },
    {
      id: `rc-ulp-test`,
      date,
      fuelType: FuelType.ULP,
      openingStock: 18500,
      receipts: 0,
      transfers: 0,
      calculatedSales: 1200,
      actualDips: 17150, // Intentional high variance for testing
      variance: -150,
      revenue: 2304,
      isLocked: false,
      status: 'PENDING',
      operatorId,
      timestamp,
      version: 1,
      versionHistory: []
    },
    {
      id: `rc-zoom-test`,
      date,
      fuelType: FuelType.ZOOM,
      openingStock: 12200,
      receipts: 0,
      transfers: 0,
      calculatedSales: 450,
      actualDips: 11750, // Perfect reconciliation
      variance: 0,
      revenue: 945,
      isLocked: true,
      status: 'APPROVED',
      approverId: 'u3',
      operatorId,
      timestamp,
      version: 1,
      versionHistory: []
    }
  ];
};
