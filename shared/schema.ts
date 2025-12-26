import { pgTable, text, serial, boolean, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Event configuration table - stores the event details and customization
export const eventConfig = pgTable("event_config", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("The Peterson's Annual Dinner"),
  description: text("description").notNull().default("Join us for an evening of good food, great company, and warm memories. Please let us know if you can make it!"),
  date: text("date").notNull().default("2024-12-20"),
  time: text("time").notNull().default("18:00"),
  location: text("location").notNull().default("123 Maple Avenue"),
  backgroundImageUrl: text("background_image_url"),
  themeColor: text("theme_color").default("hsl(145 20% 35%)"),
  fontStyle: text("font_style").default("serif"),
  confirmationMessage: text("confirmation_message").default("We're delighted you can join us. Your response has been recorded."),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Potluck items table
export const items = pgTable("items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  assignee: text("assignee"), // Name of person bringing it
  createdAt: timestamp("created_at").defaultNow(),
});

// RSVPs table
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  firstName: text("first_name").notNull(),
  attending: boolean("attending").notNull(),
  plusOne: boolean("plus_one").notNull().default(false),
  note: text("note"),
  itemId: integer("item_id"), // Reference to items table
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertEventConfigSchema = createInsertSchema(eventConfig).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertRsvpSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
});

// TypeScript types
export type EventConfig = typeof eventConfig.$inferSelect;
export type InsertEventConfig = z.infer<typeof insertEventConfigSchema>;

export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

export type Rsvp = typeof rsvps.$inferSelect;
export type InsertRsvp = z.infer<typeof insertRsvpSchema>;
