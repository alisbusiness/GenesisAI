import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Admin users table
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Plant species configurations
export const plantSpecies = pgTable("plant_species", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  variety: text("variety"),
  idealRanges: jsonb("ideal_ranges").notNull(), // {temp: [min, max], humidity: [min, max], soilMoisture: [min, max], co2: [min, max]}
  description: text("description"),
  imageUrl: text("image_url"),
});

// Current plant being monitored
export const currentPlant = pgTable("current_plant", {
  id: serial("id").primaryKey(),
  speciesId: integer("species_id").references(() => plantSpecies.id).notNull(),
  plantedDate: timestamp("planted_date").defaultNow().notNull(),
  notes: text("notes"),
  isActive: boolean("is_active").default(true).notNull(),
});

// Sensor telemetry data
export const telemetryData = pgTable("telemetry_data", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  temperature: decimal("temperature", { precision: 5, scale: 2 }),
  humidity: decimal("humidity", { precision: 5, scale: 2 }),
  soilMoisture: decimal("soil_moisture", { precision: 5, scale: 3 }),
  co2Level: integer("co2_level"),
  lightLevel: decimal("light_level", { precision: 5, scale: 2 }),
});

// Actuator states
export const actuators = pgTable("actuators", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(), // pump, vent, light, fan
  displayName: text("display_name").notNull(),
  isActive: boolean("is_active").default(false).notNull(),
  autoMode: boolean("auto_mode").default(true).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  settings: jsonb("settings"), // actuator-specific settings
});

// Actuator control logs
export const actuatorLogs = pgTable("actuator_logs", {
  id: serial("id").primaryKey(),
  actuatorId: integer("actuator_id").references(() => actuators.id).notNull(),
  action: text("action").notNull(), // on, off, auto, manual
  triggeredBy: text("triggered_by").notNull(), // admin, ai, schedule
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  duration: integer("duration"), // in seconds, if applicable
});

// AI analysis results
export const aiAnalyses = pgTable("ai_analyses", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  imageUrl: text("image_url"),
  healthScore: integer("health_score"), // 0-100
  summary: text("summary").notNull(),
  recommendations: jsonb("recommendations"), // array of recommendation objects
  issues: jsonb("issues"), // array of detected issues
  confidence: decimal("confidence", { precision: 3, scale: 2 }), // 0.00-1.00
});

// Chat messages with AI assistant
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  message: text("message").notNull(),
  response: text("response").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// System settings and thresholds
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Create insert schemas
export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  createdAt: true,
});

export const insertPlantSpeciesSchema = createInsertSchema(plantSpecies).omit({
  id: true,
});

export const insertCurrentPlantSchema = createInsertSchema(currentPlant).omit({
  id: true,
  plantedDate: true,
});

export const insertTelemetrySchema = createInsertSchema(telemetryData).omit({
  id: true,
  timestamp: true,
});

export const insertActuatorSchema = createInsertSchema(actuators).omit({
  id: true,
  lastUpdated: true,
});

export const insertActuatorLogSchema = createInsertSchema(actuatorLogs).omit({
  id: true,
  timestamp: true,
});

export const insertAiAnalysisSchema = createInsertSchema(aiAnalyses).omit({
  id: true,
  timestamp: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertSettingSchema = createInsertSchema(settings).omit({
  id: true,
  lastUpdated: true,
});

// Export types
export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = z.infer<typeof insertAdminSchema>;

export type PlantSpecies = typeof plantSpecies.$inferSelect;
export type InsertPlantSpecies = z.infer<typeof insertPlantSpeciesSchema>;

export type CurrentPlant = typeof currentPlant.$inferSelect;
export type InsertCurrentPlant = z.infer<typeof insertCurrentPlantSchema>;

export type TelemetryData = typeof telemetryData.$inferSelect;
export type InsertTelemetryData = z.infer<typeof insertTelemetrySchema>;

export type Actuator = typeof actuators.$inferSelect;
export type InsertActuator = z.infer<typeof insertActuatorSchema>;

export type ActuatorLog = typeof actuatorLogs.$inferSelect;
export type InsertActuatorLog = z.infer<typeof insertActuatorLogSchema>;

export type AiAnalysis = typeof aiAnalyses.$inferSelect;
export type InsertAiAnalysis = z.infer<typeof insertAiAnalysisSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Setting = typeof settings.$inferSelect;
export type InsertSetting = z.infer<typeof insertSettingSchema>;
