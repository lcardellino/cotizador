import express from "express";
import { createServer as createViteServer } from "vite";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "connected" });
    } catch (error) {
      res.status(500).json({ status: "error", database: "disconnected" });
    }
  });

  app.get("/api/dashboard", async (req, res) => {
    try {
      // For demonstration, if no trips exist, we return mock data
      const count = await prisma.trip.count();
      if (count === 0) {
        return res.json({
          totalTrips: 1250,
          totalKm: 450000,
          totalPassengers: 25000,
          avgKmPerTrip: 360,
          tripTypes: {
            short: 400,
            medium: 600,
            long: 250
          },
          tripScopes: {
            provincial: 800,
            national: 400,
            international: 50
          },
          heatmapData: [
            { location: "Buenos Aires", value: 500 },
            { location: "Córdoba", value: 300 },
            { location: "Santa Fe", value: 200 },
            { location: "Mendoza", value: 150 },
            { location: "Salta", value: 100 }
          ]
        });
      }

      const trips = await prisma.trip.findMany();
      const totalTrips = trips.length;
      const totalKm = trips.reduce((acc, trip) => acc + (trip.distance || 0), 0);
      const totalPassengers = trips.reduce((acc, trip) => acc + (trip.passengers || 0), 0);
      const avgKmPerTrip = totalTrips > 0 ? totalKm / totalTrips : 0;

      const tripTypes = {
        short: trips.filter(t => t.distance !== null && t.distance < 100).length,
        medium: trips.filter(t => t.distance !== null && t.distance >= 100 && t.distance <= 500).length,
        long: trips.filter(t => t.distance !== null && t.distance > 500).length,
      };

      const tripScopes = {
        provincial: trips.filter(t => t.scope === 'provincial').length,
        national: trips.filter(t => t.scope === 'national').length,
        international: trips.filter(t => t.scope === 'international').length,
      };

      // Simple location aggregation
      const locationCounts: Record<string, number> = {};
      trips.forEach(t => {
        if (t.location) {
          locationCounts[t.location] = (locationCounts[t.location] || 0) + 1;
        }
      });
      const heatmapData = Object.entries(locationCounts).map(([location, value]) => ({ location, value }));

      res.json({
        totalTrips,
        totalKm,
        totalPassengers,
        avgKmPerTrip,
        tripTypes,
        tripScopes,
        heatmapData
      });
    } catch (error) {
      console.error("Dashboard error:", error);
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.post("/api/trips", async (req, res) => {
    try {
      const { distance, passengers, location, type, scope, date } = req.body;
      const newTrip = await prisma.trip.create({
        data: {
          distance: distance ? parseFloat(distance) : null,
          passengers: passengers ? parseInt(passengers, 10) : null,
          location,
          type,
          scope,
          date: date ? new Date(date) : undefined
        }
      });
      res.status(201).json(newTrip);
    } catch (error) {
      console.error("Create trip error:", error);
      res.status(500).json({ error: "Failed to save trip" });
    }
  });

  // --- VEHICLES ---
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await prisma.vehicle.findMany();
      res.json(vehicles);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/vehicles/sync", async (req, res) => {
    const vehicles = req.body;
    if (!Array.isArray(vehicles)) {
      return res.status(400).json({ error: "Expected an array of vehicles" });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.vehicle.deleteMany();
        if (vehicles.length > 0) {
          await tx.vehicle.createMany({
            data: vehicles.map(v => ({
              id: v.id,
              plate: v.plate,
              internalNumber: v.internalNumber,
              unitType: v.unitType,
              brand: v.brand,
              model: v.model,
              status: v.status,
              rtoNacional: v.rtoNacional,
              rtoProvincial: v.rtoProvincial
            }))
          });
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error syncing vehicles:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // --- BUDGETS ---
  app.get("/api/budgets/:userId", async (req, res) => {
    const { userId } = req.params;
    try {
      const budgets = await prisma.savedBudget.findMany({
        where: { userId }
      });
      res.json(budgets);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/budgets/sync/:userId", async (req, res) => {
    const { userId } = req.params;
    const budgets = req.body;
    
    if (!Array.isArray(budgets)) {
      return res.status(400).json({ error: "Expected an array of budgets" });
    }

    try {
      await prisma.$transaction(async (tx) => {
        await tx.savedBudget.deleteMany({
          where: { userId }
        });
        
        if (budgets.length > 0) {
          await tx.savedBudget.createMany({
            data: budgets.map(b => ({
              id: b.id,
              userId,
              budgetNumber: b.budgetNumber,
              status: b.status,
              paymentStatus: b.paymentStatus,
              date: b.date,
              client: b.client,
              time: b.time,
              destination: b.destination,
              km: b.km,
              cost: b.cost,
              profit: b.profit,
              finalPrice: b.finalPrice,
              contact: b.contact,
              phone: b.phone,
              tripType: b.tripType,
              passengers: b.passengers,
              timestamp: b.timestamp,
              mail: b.mail,
              origen: b.origen,
              regresoA: b.regresoA,
              fechaRegreso: b.fechaRegreso,
              horaRegreso: b.horaRegreso,
              descripcion: b.descripcion,
              subtotal: b.subtotal,
              ivaAmount: b.ivaAmount,
              carCost: b.carCost,
              depreciationCost: b.depreciationCost,
              totalDriverCost: b.totalDriverCost,
              dirtRoadCost: b.dirtRoadCost,
              kmProductivos: b.kmProductivos,
              kmDestino: b.kmDestino,
              kmImproductivos: b.kmImproductivos,
              unitType: b.unitType,
              dieselPrice: b.dieselPrice,
              driverCount: b.driverCount,
              busCount: b.busCount,
              driverServiceType: b.driverServiceType,
              dirtRoadPercent: b.dirtRoadPercent,
              profitMultiplier: b.profitMultiplier,
              driverShift: b.driverShift || null,
              driverViatico: b.driverViatico || null,
              driverTomeDeje: b.driverTomeDeje || null,
              driverExtraHour: b.driverExtraHour || null,
              driverBed: b.driverBed || null,
              natBreakfast: b.natBreakfast || null,
              natLunch: b.natLunch || null,
              natSnack: b.natSnack || null,
              natDinner: b.natDinner || null,
              natBed: b.natBed || null
            }))
          });
        }
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error syncing budgets:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
