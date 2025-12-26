import { eventConfig, items, rsvps, type EventConfig, type InsertEventConfig, type Item, type InsertItem, type Rsvp, type InsertRsvp } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Event Config
  getEventConfig(): Promise<EventConfig | undefined>;
  updateEventConfig(config: Partial<InsertEventConfig>): Promise<EventConfig>;
  
  // Items
  getAllItems(): Promise<Item[]>;
  createItem(item: InsertItem): Promise<Item>;
  deleteItem(id: number): Promise<void>;
  updateItemAssignee(id: number, assignee: string | null): Promise<Item>;
  
  // RSVPs
  getAllRsvps(): Promise<Rsvp[]>;
  createRsvp(rsvp: InsertRsvp): Promise<Rsvp>;
}

export class DatabaseStorage implements IStorage {
  // Event Config methods
  async getEventConfig(): Promise<EventConfig | undefined> {
    const [config] = await db.select().from(eventConfig).limit(1);
    
    // If no config exists, create default one
    if (!config) {
      const [newConfig] = await db
        .insert(eventConfig)
        .values({})
        .returning();
      return newConfig;
    }
    
    return config;
  }

  async updateEventConfig(updates: Partial<InsertEventConfig>): Promise<EventConfig> {
    const existing = await this.getEventConfig();
    
    if (!existing) {
      const [newConfig] = await db
        .insert(eventConfig)
        .values(updates as InsertEventConfig)
        .returning();
      return newConfig;
    }
    
    const [updated] = await db
      .update(eventConfig)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(eventConfig.id, existing.id))
      .returning();
    
    return updated;
  }

  // Items methods
  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items);
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [newItem] = await db
      .insert(items)
      .values(item)
      .returning();
    return newItem;
  }

  async deleteItem(id: number): Promise<void> {
    await db.delete(items).where(eq(items.id, id));
  }

  async updateItemAssignee(id: number, assignee: string | null): Promise<Item> {
    const [updated] = await db
      .update(items)
      .set({ assignee })
      .where(eq(items.id, id))
      .returning();
    return updated;
  }

  // RSVPs methods
  async getAllRsvps(): Promise<Rsvp[]> {
    return await db.select().from(rsvps);
  }

  async createRsvp(rsvp: InsertRsvp): Promise<Rsvp> {
    const [newRsvp] = await db
      .insert(rsvps)
      .values(rsvp)
      .returning();
    return newRsvp;
  }
}

export const storage = new DatabaseStorage();
