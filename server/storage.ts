import { 
  admins, plantSpecies, currentPlant, telemetryData, actuators, actuatorLogs, 
  aiAnalyses, chatMessages, settings,
  type Admin, type InsertAdmin, type PlantSpecies, type InsertPlantSpecies,
  type CurrentPlant, type InsertCurrentPlant, type TelemetryData, type InsertTelemetryData,
  type Actuator, type InsertActuator, type ActuatorLog, type InsertActuatorLog,
  type AiAnalysis, type InsertAiAnalysis, type ChatMessage, type InsertChatMessage,
  type Setting, type InsertSetting
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // Admin management
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;

  // Plant species management
  getAllPlantSpecies(): Promise<PlantSpecies[]>;
  getPlantSpeciesById(id: number): Promise<PlantSpecies | undefined>;
  createPlantSpecies(species: InsertPlantSpecies): Promise<PlantSpecies>;

  // Current plant management
  getCurrentPlant(): Promise<(CurrentPlant & { species: PlantSpecies }) | undefined>;
  setCurrentPlant(plant: InsertCurrentPlant): Promise<CurrentPlant>;

  // Telemetry data
  insertTelemetryData(data: InsertTelemetryData): Promise<TelemetryData>;
  getLatestTelemetry(): Promise<TelemetryData | undefined>;
  getTelemetryHistory(limit?: number): Promise<TelemetryData[]>;

  // Actuator management
  getAllActuators(): Promise<Actuator[]>;
  getActuatorByName(name: string): Promise<Actuator | undefined>;
  updateActuator(id: number, updates: Partial<Actuator>): Promise<Actuator>;
  createActuator(actuator: InsertActuator): Promise<Actuator>;
  logActuatorAction(log: InsertActuatorLog): Promise<ActuatorLog>;

  // AI analysis
  insertAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis>;
  getLatestAiAnalysis(): Promise<AiAnalysis | undefined>;
  getAiAnalysisHistory(limit?: number): Promise<AiAnalysis[]>;

  // Chat messages
  insertChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatHistory(limit?: number): Promise<ChatMessage[]>;

  // Settings
  getSetting(key: string): Promise<Setting | undefined>;
  setSetting(setting: InsertSetting): Promise<Setting>;
  getAllSettings(): Promise<Setting[]>;
}

export class DatabaseStorage implements IStorage {
  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const [admin] = await db.select().from(admins).where(eq(admins.username, username));
    return admin || undefined;
  }

  async createAdmin(insertAdmin: InsertAdmin): Promise<Admin> {
    const [admin] = await db.insert(admins).values(insertAdmin).returning();
    return admin;
  }

  async getAllPlantSpecies(): Promise<PlantSpecies[]> {
    return await db.select().from(plantSpecies);
  }

  async getPlantSpeciesById(id: number): Promise<PlantSpecies | undefined> {
    const [species] = await db.select().from(plantSpecies).where(eq(plantSpecies.id, id));
    return species || undefined;
  }

  async createPlantSpecies(species: InsertPlantSpecies): Promise<PlantSpecies> {
    const [newSpecies] = await db.insert(plantSpecies).values(species).returning();
    return newSpecies;
  }

  async getCurrentPlant(): Promise<(CurrentPlant & { species: PlantSpecies }) | undefined> {
    const result = await db
      .select()
      .from(currentPlant)
      .leftJoin(plantSpecies, eq(currentPlant.speciesId, plantSpecies.id))
      .where(eq(currentPlant.isActive, true))
      .limit(1);

    if (result.length === 0 || !result[0].plant_species) return undefined;

    return {
      ...result[0].current_plant,
      species: result[0].plant_species,
    };
  }

  async setCurrentPlant(plant: InsertCurrentPlant): Promise<CurrentPlant> {
    // Deactivate all current plants
    await db.update(currentPlant).set({ isActive: false });
    
    // Insert new current plant
    const [newPlant] = await db.insert(currentPlant).values({
      ...plant,
      isActive: true,
    }).returning();
    return newPlant;
  }

  async insertTelemetryData(data: InsertTelemetryData): Promise<TelemetryData> {
    const [telemetry] = await db.insert(telemetryData).values(data).returning();
    return telemetry;
  }

  async getLatestTelemetry(): Promise<TelemetryData | undefined> {
    const [latest] = await db
      .select()
      .from(telemetryData)
      .orderBy(desc(telemetryData.timestamp))
      .limit(1);
    return latest || undefined;
  }

  async getTelemetryHistory(limit = 100): Promise<TelemetryData[]> {
    return await db
      .select()
      .from(telemetryData)
      .orderBy(desc(telemetryData.timestamp))
      .limit(limit);
  }

  async getAllActuators(): Promise<Actuator[]> {
    return await db.select().from(actuators);
  }

  async getActuatorByName(name: string): Promise<Actuator | undefined> {
    const [actuator] = await db.select().from(actuators).where(eq(actuators.name, name));
    return actuator || undefined;
  }

  async updateActuator(id: number, updates: Partial<Actuator>): Promise<Actuator> {
    const [actuator] = await db
      .update(actuators)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(actuators.id, id))
      .returning();
    return actuator;
  }

  async createActuator(actuator: InsertActuator): Promise<Actuator> {
    const [newActuator] = await db.insert(actuators).values(actuator).returning();
    return newActuator;
  }

  async logActuatorAction(log: InsertActuatorLog): Promise<ActuatorLog> {
    const [actionLog] = await db.insert(actuatorLogs).values(log).returning();
    return actionLog;
  }

  async insertAiAnalysis(analysis: InsertAiAnalysis): Promise<AiAnalysis> {
    const [aiAnalysis] = await db.insert(aiAnalyses).values(analysis).returning();
    return aiAnalysis;
  }

  async getLatestAiAnalysis(): Promise<AiAnalysis | undefined> {
    const [latest] = await db
      .select()
      .from(aiAnalyses)
      .orderBy(desc(aiAnalyses.timestamp))
      .limit(1);
    return latest || undefined;
  }

  async getAiAnalysisHistory(limit = 50): Promise<AiAnalysis[]> {
    return await db
      .select()
      .from(aiAnalyses)
      .orderBy(desc(aiAnalyses.timestamp))
      .limit(limit);
  }

  async insertChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db.insert(chatMessages).values(message).returning();
    return chatMessage;
  }

  async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
  }

  async getSetting(key: string): Promise<Setting | undefined> {
    const [setting] = await db.select().from(settings).where(eq(settings.key, key));
    return setting || undefined;
  }

  async setSetting(setting: InsertSetting): Promise<Setting> {
    const existing = await this.getSetting(setting.key);
    
    if (existing) {
      const [updated] = await db
        .update(settings)
        .set({ value: setting.value, lastUpdated: new Date() })
        .where(eq(settings.key, setting.key))
        .returning();
      return updated;
    } else {
      const [newSetting] = await db.insert(settings).values(setting).returning();
      return newSetting;
    }
  }

  async getAllSettings(): Promise<Setting[]> {
    return await db.select().from(settings);
  }
}

export const storage = new DatabaseStorage();
