import { Vehicle, SavedBudget } from "../types";

export const api = {
  async getVehicles(): Promise<Vehicle[]> {
    try {
      const res = await fetch("/api/vehicles");
      if (!res.ok) throw new Error("Failed to fetch vehicles");
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async syncVehicles(vehicles: Vehicle[]): Promise<void> {
    try {
      await fetch("/api/vehicles/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vehicles)
      });
      window.dispatchEvent(new Event("vehiclesUpdated"));
    } catch (error) {
      console.error(error);
    }
  },

  async getBudgets(userId: string): Promise<SavedBudget[]> {
    try {
      const res = await fetch(`/api/budgets/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch budgets");
      return await res.json();
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  async syncBudgets(userId: string, budgets: SavedBudget[]): Promise<void> {
    try {
      await fetch(`/api/budgets/sync/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(budgets)
      });
      window.dispatchEvent(new Event("budgetsUpdated"));
    } catch (error) {
      console.error(error);
    }
  }
};
