import { eventConfig, items, rsvps, secretSantaParticipants, type EventConfig, type InsertEventConfig, type Item, type InsertItem, type Rsvp, type InsertRsvp, type SecretSantaParticipant, type InsertSecretSantaParticipant } from "@shared/schema";
import { db } from "./db";
import { eq, isNull } from "drizzle-orm";

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
  
  // Secret Santa
  getAllSecretSantaParticipants(): Promise<SecretSantaParticipant[]>;
  createSecretSantaParticipant(participant: InsertSecretSantaParticipant): Promise<SecretSantaParticipant>;
  getSecretSantaParticipantByName(name: string): Promise<SecretSantaParticipant | undefined>;
  getSecretSantaMatch(participantId: number): Promise<SecretSantaParticipant | undefined>;
  performSecretSantaDraw(): Promise<boolean>;
  resetSecretSantaDraw(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Event Config methods
  async getEventConfig(): Promise<EventConfig | undefined> {
    const [config] = await db.select().from(eventConfig).limit(1);
    
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

  // Secret Santa methods
  async getAllSecretSantaParticipants(): Promise<SecretSantaParticipant[]> {
    return await db.select().from(secretSantaParticipants);
  }

  async createSecretSantaParticipant(participant: InsertSecretSantaParticipant): Promise<SecretSantaParticipant> {
    const [newParticipant] = await db
      .insert(secretSantaParticipants)
      .values(participant)
      .returning();
    return newParticipant;
  }

  async getSecretSantaParticipantByName(name: string): Promise<SecretSantaParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(secretSantaParticipants)
      .where(eq(secretSantaParticipants.name, name));
    return participant;
  }

  async getSecretSantaMatch(participantId: number): Promise<SecretSantaParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(secretSantaParticipants)
      .where(eq(secretSantaParticipants.id, participantId));
    
    if (!participant?.matchedWithId) return undefined;
    
    const [match] = await db
      .select()
      .from(secretSantaParticipants)
      .where(eq(secretSantaParticipants.id, participant.matchedWithId));
    
    return match;
  }

  async performSecretSantaDraw(): Promise<boolean> {
    const participants = await this.getAllSecretSantaParticipants();
    
    if (participants.length < 2) {
      return false;
    }

    // Shuffle participants for random matching
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    
    // Create circular matching (each person gives to next person in shuffled list)
    for (let i = 0; i < shuffled.length; i++) {
      const giver = shuffled[i];
      const receiver = shuffled[(i + 1) % shuffled.length];
      
      await db
        .update(secretSantaParticipants)
        .set({ matchedWithId: receiver.id })
        .where(eq(secretSantaParticipants.id, giver.id));
    }

    // Mark draw as completed in config
    await this.updateEventConfig({ secretSantaDrawCompleted: true } as any);
    
    return true;
  }

  async resetSecretSantaDraw(): Promise<void> {
    // Clear all matches
    await db
      .update(secretSantaParticipants)
      .set({ matchedWithId: null });
    
    // Reset draw completed flag
    await this.updateEventConfig({ secretSantaDrawCompleted: false } as any);
  }
}

export const storage = new DatabaseStorage();
