import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertEventConfigSchema, insertItemSchema, insertRsvpSchema, insertSecretSantaParticipantSchema } from "@shared/schema";

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

  // Secret Santa routes
  app.get("/api/secret-santa/participants", async (_req, res) => {
    try {
      const participants = await storage.getAllSecretSantaParticipants();
      res.json(participants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.post("/api/secret-santa/join", async (req, res) => {
    try {
      const validated = insertSecretSantaParticipantSchema.parse(req.body);
      
      // Check if already joined
      const existing = await storage.getSecretSantaParticipantByName(validated.name);
      if (existing) {
        return res.status(400).json({ error: "You have already joined the Secret Santa!" });
      }
      
      const participant = await storage.createSecretSantaParticipant(validated);
      res.status(201).json(participant);
    } catch (error) {
      res.status(400).json({ error: "Invalid request data" });
    }
  });

  app.get("/api/secret-santa/my-match/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const participant = await storage.getSecretSantaParticipantByName(name);
      
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      
      if (!participant.matchedWithId) {
        return res.json({ matched: false, message: "Draw has not been completed yet" });
      }
      
      const match = await storage.getSecretSantaMatch(participant.id);
      res.json({ matched: true, match });
    } catch (error) {
      res.status(500).json({ error: "Failed to get match" });
    }
  });

  app.post("/api/secret-santa/draw", async (req, res) => {
    try {
      const { pin } = req.body;
      if (pin !== "1234") {
        return res.status(401).json({ error: "Unauthorized - invalid admin PIN" });
      }
      
      const success = await storage.performSecretSantaDraw();
      if (success) {
        res.json({ success: true, message: "Secret Santa draw completed!" });
      } else {
        res.status(400).json({ error: "Need at least 2 participants for the draw" });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to perform draw" });
    }
  });

  app.post("/api/secret-santa/reset", async (req, res) => {
    try {
      const { pin } = req.body;
      if (pin !== "1234") {
        return res.status(401).json({ error: "Unauthorized - invalid admin PIN" });
      }
      
      await storage.resetSecretSantaDraw();
      res.json({ success: true, message: "Secret Santa draw has been reset" });
    } catch (error) {
      res.status(500).json({ error: "Failed to reset draw" });
    }
  });

  return httpServer;
}
