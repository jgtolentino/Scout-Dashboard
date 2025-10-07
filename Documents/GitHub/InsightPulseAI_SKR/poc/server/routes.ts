import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Dashboard analytics endpoints
  app.get("/api/dashboard/kpi", async (req, res) => {
    try {
      const metrics = await storage.getKPIMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KPI metrics" });
    }
  });

  app.get("/api/dashboard/locations", async (req, res) => {
    try {
      const locations = await storage.getLocationData();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch location data" });
    }
  });

  app.get("/api/dashboard/categories", async (req, res) => {
    try {
      const categories = await storage.getCategoryData();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category data" });
    }
  });

  app.get("/api/dashboard/brands", async (req, res) => {
    try {
      const brands = await storage.getBrandData();
      res.json(brands);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch brand data" });
    }
  });

  app.get("/api/dashboard/trends", async (req, res) => {
    try {
      const trends = await storage.getTrendData();
      res.json(trends);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trend data" });
    }
  });

  app.get("/api/dashboard/insights", async (req, res) => {
    try {
      const insights = await storage.getAIInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch AI insights" });
    }
  });

  // Transaction endpoints
  app.get("/api/transactions", async (req, res) => {
    try {
      const { location, brand, category } = req.query;
      
      let transactions;
      if (location) {
        transactions = await storage.getTransactionsByLocation(location as string);
      } else if (brand) {
        transactions = await storage.getTransactionsByBrand(brand as string);
      } else if (category) {
        transactions = await storage.getTransactionsByCategory(category as string);
      } else {
        transactions = await storage.getAllTransactions();
      }
      
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.get("/api/consumers", async (req, res) => {
    try {
      const consumers = await storage.getAllConsumers();
      res.json(consumers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch consumers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
