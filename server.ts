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
