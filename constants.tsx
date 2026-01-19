
import { FuelType, Tank, Meter } from './types';

export const INITIAL_TANKS: Tank[] = [
  { id: 't55-ado', name: 'T55 (ADO Storage)', fuelType: FuelType.ADO, capacity: 55000, currentVolume: 42000 },
  { id: 't30-ulp', name: 'T30 (ULP Storage)', fuelType: FuelType.ULP, capacity: 30000, currentVolume: 18500 },
  { id: 't30-zoom', name: 'T30 (ZOOM Storage)', fuelType: FuelType.ZOOM, capacity: 30000, currentVolume: 12200 },
];

export const INITIAL_METERS: Meter[] = [
  { id: 'm-gantry-01', name: 'Main Gantry Meter', type: 'GANTRY', lastReading: 1250400 },
  { id: 'm-drum-01', name: 'Drum Filling Point A', type: 'DRUM', lastReading: 45200 },
  { id: 'm-servo-01-am', name: 'Servo Pump 01 (AM)', type: 'PUMP', lastReading: 890200 },
  { id: 'm-servo-01-pm', name: 'Servo Pump 01 (PM)', type: 'PUMP', lastReading: 892500 },
  { id: 'm-servo-02-am', name: 'Servo Pump 02 (AM)', type: 'PUMP', lastReading: 550100 },
];

export const FUEL_COLORS = {
  [FuelType.ADO]: 'bg-orange-500',
  [FuelType.ULP]: 'bg-emerald-500',
  [FuelType.ZOOM]: 'bg-blue-600',
};

export const FUEL_GRADIENTS = {
  [FuelType.ADO]: 'from-orange-500 to-orange-700',
  [FuelType.ULP]: 'from-emerald-500 to-emerald-700',
  [FuelType.ZOOM]: 'from-blue-500 to-blue-700',
};
