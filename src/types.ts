export type BudgetStatus = 'pendiente' | 'confirmado' | 'realizado' | 'cancelado';
export type TripType = 'provincial' | 'nacional' | 'internacional';

export interface SavedBudget {
  id: string;
  budgetNumber: string;
  status: BudgetStatus;
  date: string;
  client: string;
  time: string;
  destination: string;
  km: number;
  cost: number;
  profit: number;
  finalPrice: number;
  contact: string;
  phone: string;
  tripType: TripType;
  passengers: number;
  timestamp: number;
  // Extra fields for PDF export
  mail?: string;
  origen?: string;
  regresoA?: string;
  fechaRegreso?: string;
  horaRegreso?: string;
  descripcion?: string;
  subtotal?: number;
  ivaAmount?: number;

  // Full state fields for loading and modifying
  kmProductivos?: number;
  kmDestino?: number;
  kmImproductivos?: number;
  unitType?: string;
  dieselPrice?: number;
  driverCount?: number;
  busCount?: number;
  driverServiceType?: string;
  driverShift?: { value: number; count: number };
  driverViatico?: { value: number; count: number };
  driverTomeDeje?: { value: number; count: number };
  driverExtraHour?: { value: number; count: number };
  driverBed?: { value: number; count: number };
  natBreakfast?: { value: number; count: number };
  natLunch?: { value: number; count: number };
  natSnack?: { value: number; count: number };
  natDinner?: { value: number; count: number };
  natBed?: { value: number; count: number };
  dirtRoadPercent?: number;
  profitMultiplier?: number;
}
