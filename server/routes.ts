import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventConfigSchema, insertItemSchema, insertRsvpSchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Event Config routes
  app.get("/api/config", async (_req, res) => {
    try {
      const config = await storage.getEventConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch event config" });
    }
  });

  app.patch("/api/config", async (req, res) => {
    try {
      const validated = insertEventConfigSchema.partial().parse(req.body);
      const updated = await storage.updateEventConfig(validated);
      res.json(updated);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Items routes
  app.get("/api/items", async (_req, res) => {
    try {
      const items = await storage.getAllItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const validated = insertItemSchema.parse(req.body);
      const item = await storage.createItem(validated);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.delete("/api/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteItem(id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  app.patch("/api/items/:id/assignee", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { assignee } = req.body;
      const updated = await storage.updateItemAssignee(id, assignee);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // RSVPs routes
  app.get("/api/rsvps", async (_req, res) => {
    try {
      const rsvps = await storage.getAllRsvps();
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch RSVPs" });
    }
  });

  app.post("/api/rsvps", async (req, res) => {
    try {
      const validated = insertRsvpSchema.parse(req.body);
      const rsvp = await storage.createRsvp(validated);
      res.status(201).json(rsvp);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  // Admin PIN validation route (simple server-side check)
  app.post("/api/admin/validate", async (req, res) => {
    const { pin } = req.body;
    // Simple PIN check - in production you'd want proper auth
    if (pin === "1234") {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
  });

  return httpServer;
}
