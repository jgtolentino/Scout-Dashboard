import type { 
  User, 
  InsertUser, 
  Transaction, 
  InsertTransaction, 
  Consumer, 
  InsertConsumer,
  KPIMetrics,
  LocationData,
  CategoryData,
  BrandData,
  TrendData,
  AIInsight
} from "@shared/schema";

import { 
  aggregateTransactionsByLocation,
  aggregateTransactionsByCategory,
  aggregateTransactionsByBrand,
  calculateKPIMetrics
} from "../client/src/lib/data-utils";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transaction methods
  getAllTransactions(): Promise<Transaction[]>;
  getTransactionsByLocation(location: string): Promise<Transaction[]>;
  getTransactionsByBrand(brand: string): Promise<Transaction[]>;
  getTransactionsByCategory(category: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  
  // Consumer methods
  getAllConsumers(): Promise<Consumer[]>;
  createConsumer(consumer: InsertConsumer): Promise<Consumer>;
  
  // Dashboard analytics methods
  getKPIMetrics(): Promise<KPIMetrics>;
  getLocationData(): Promise<LocationData[]>;
  getCategoryData(): Promise<CategoryData[]>;
  getBrandData(): Promise<BrandData[]>;
  getTrendData(): Promise<TrendData[]>;
  getAIInsights(): Promise<AIInsight[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private transactions: Map<number, Transaction>;
  private consumers: Map<number, Consumer>;
  private currentUserId: number;
  private currentTransactionId: number;
  private currentConsumerId: number;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.consumers = new Map();
    this.currentUserId = 1;
    this.currentTransactionId = 1;
    this.currentConsumerId = 1;

    // Initialize with 500 transactions
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Generate 500 transactions from authentic Philippine brand data
    const brandData = [
      // TBWA Clients - Del Monte
      { brand: "Del Monte Tomato Sauce & Ketchup", category: "Sauce", baseValue: 2400000, isTBWA: true },
      { brand: "Del Monte Spaghetti Sauce", category: "Sauce", baseValue: 1950000, isTBWA: true },
      { brand: "Del Monte Fruit Cocktail", category: "Canned Goods", baseValue: 1600000, isTBWA: true },
      { brand: "Del Monte Pineapple", category: "Canned Goods", baseValue: 1300000, isTBWA: true },
      { brand: "Del Monte Pasta", category: "Pasta", baseValue: 1100000, isTBWA: true },
      
      // TBWA Clients - Alaska
      { brand: "Alaska Evaporated Milk", category: "Dairy", baseValue: 1900000, isTBWA: true },
      { brand: "Alaska Condensed Milk", category: "Dairy", baseValue: 1750000, isTBWA: true },
      { brand: "Alaska Powdered Milk", category: "Dairy", baseValue: 1400000, isTBWA: true },
      { brand: "Alpine Evaporated Milk", category: "Dairy", baseValue: 1250000, isTBWA: true },
      { brand: "Krem-Top Coffee Creamer", category: "Dairy", baseValue: 1200000, isTBWA: true },
      { brand: "Cow Bell Powdered Milk", category: "Dairy", baseValue: 1050000, isTBWA: true },
      
      // TBWA Clients - Oishi
      { brand: "Oishi Prawn Crackers", category: "Snacks", baseValue: 1200000, isTBWA: true },
      { brand: "Oishi Ridges", category: "Snacks", baseValue: 950000, isTBWA: true },
      { brand: "Oishi Bread Pan", category: "Snacks", baseValue: 850000, isTBWA: true },
      { brand: "Oishi Marty's", category: "Snacks", baseValue: 700000, isTBWA: true },
      { brand: "Oishi Pillows", category: "Snacks", baseValue: 650000, isTBWA: true },
      { brand: "Gourmet Picks", category: "Snacks", baseValue: 600000, isTBWA: true },
      { brand: "Crispy Patata", category: "Snacks", baseValue: 550000, isTBWA: true },
      
      // TBWA Clients - Peerless
      { brand: "Champion Detergent", category: "Home Care", baseValue: 1300000, isTBWA: true },
      { brand: "Pride Dishwashing Liquid", category: "Home Care", baseValue: 1100000, isTBWA: true },
      { brand: "Cyclone Bleach", category: "Home Care", baseValue: 900000, isTBWA: true },
      
      // TBWA Clients - JTI
      { brand: "Winston", category: "Tobacco", baseValue: 2400000, isTBWA: true },
      { brand: "Camel", category: "Tobacco", baseValue: 2100000, isTBWA: true },
      { brand: "Mevius", category: "Tobacco", baseValue: 1400000, isTBWA: true },
      
      // Competitors
      { brand: "UFC Tomato Sauce", category: "Sauce", baseValue: 400000, isTBWA: false },
      { brand: "Bear Brand Milk", category: "Dairy", baseValue: 300000, isTBWA: false },
      { brand: "Piattos", category: "Snacks", baseValue: 250000, isTBWA: false },
      { brand: "Nestle Milk", category: "Dairy", baseValue: 200000, isTBWA: false },
      { brand: "Rinbee", category: "Snacks", baseValue: 180000, isTBWA: false },
      { brand: "Hi-Ho", category: "Snacks", baseValue: 160000, isTBWA: false }
    ];

    const locations = ["Manila", "Cebu", "Davao", "Iloilo", "Cagayan de Oro", "Baguio", "Quezon City", "Zamboanga", "Bacolod", "Tacloban"];
    const barangays = ["Makati", "BGC", "Ortigas", "Alabang", "IT Park", "Lahug", "Poblacion", "Divisoria", "Session Road", "Commonwealth"];

    // Generate 500 transactions
    for (let i = 0; i < 500; i++) {
      const brand = brandData[Math.floor(Math.random() * brandData.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const barangay = barangays[Math.floor(Math.random() * barangays.length)];
      
      // Generate date within last 30 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      // Add realistic variance to base values
      const variance = 0.3 + Math.random() * 0.4; // 30-70% of base value
      const pesoValue = Math.floor(brand.baseValue * variance);
      
      const transaction: InsertTransaction = {
        date: date.toISOString().split('T')[0],
        volume: Math.floor(1000 + Math.random() * 2000),
        pesoValue: pesoValue.toString(),
        duration: Math.floor(15 + Math.random() * 40),
        units: Math.floor(200 + Math.random() * 600),
        brand: brand.brand,
        category: brand.category,
        location: location,
        barangay: barangay
      };

      this.createTransaction(transaction);
    }

    // Enhanced sample consumer data
    const sampleConsumers: InsertConsumer[] = [
      { gender: "Male", age: 34, location: "Manila" },
      { gender: "Female", age: 28, location: "Cebu" },
      { gender: "Male", age: 42, location: "Manila" },
      { gender: "Female", age: 35, location: "Davao" },
      { gender: "Male", age: 29, location: "Cebu" },
      { gender: "Female", age: 31, location: "Manila" },
      { gender: "Male", age: 26, location: "Davao" },
      { gender: "Female", age: 39, location: "Cebu" }
    ];

    sampleConsumers.forEach(consumer => {
      this.createConsumer(consumer);
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Transaction methods
  async getAllTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getTransactionsByLocation(location: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.location === location,
    );
  }

  async getTransactionsByBrand(brand: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.brand === brand,
    );
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.category === category,
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = { 
      ...insertTransaction, 
      id,
      pesoValue: insertTransaction.pesoValue
    };
    this.transactions.set(id, transaction);
    return transaction;
  }

  // Consumer methods
  async getAllConsumers(): Promise<Consumer[]> {
    return Array.from(this.consumers.values());
  }

  async createConsumer(insertConsumer: InsertConsumer): Promise<Consumer> {
    const id = this.currentConsumerId++;
    const consumer: Consumer = { 
      ...insertConsumer, 
      id 
    };
    this.consumers.set(id, consumer);
    return consumer;
  }

  // Dashboard analytics methods
  async getKPIMetrics(): Promise<KPIMetrics> {
    const transactions = await this.getAllTransactions();
    const consumers = await this.getAllConsumers();
    return calculateKPIMetrics(transactions, consumers);
  }

  async getLocationData(): Promise<LocationData[]> {
    const transactions = await this.getAllTransactions();
    return aggregateTransactionsByLocation(transactions);
  }

  async getCategoryData(): Promise<CategoryData[]> {
    const transactions = await this.getAllTransactions();
    return aggregateTransactionsByCategory(transactions);
  }

  async getBrandData(): Promise<BrandData[]> {
    const transactions = await this.getAllTransactions();
    return aggregateTransactionsByBrand(transactions);
  }

  async getTrendData(): Promise<TrendData[]> {
    const transactions = await this.getAllTransactions();
    
    // Group transactions by date
    const dateGroups = new Map<string, Transaction[]>();
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!dateGroups.has(date)) {
        dateGroups.set(date, []);
      }
      dateGroups.get(date)!.push(transaction);
    });

    // Convert to trend data
    return Array.from(dateGroups.entries())
      .map(([date, dayTransactions]) => ({
        period: date,
        transactions: dayTransactions.length,
        pesoValue: dayTransactions.reduce((sum, t) => sum + parseFloat(t.pesoValue), 0)
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-7); // Last 7 days
  }

  async getAIInsights(): Promise<AIInsight[]> {
    return [
      {
        id: "1",
        type: "error",
        title: "Declining Market Share",
        description: "TBWA client brands show 3.2% decline in weekly transactions vs competitors",
        impact: "high",
        timestamp: new Date().toISOString()
      },
      {
        id: "2",
        type: "warning", 
        title: "Growth Opportunity",
        description: "Strong potential identified in Cebu market for dairy products expansion",
        impact: "medium",
        timestamp: new Date().toISOString()
      },
      {
        id: "3",
        type: "info",
        title: "Peak Performance",
        description: "Del Monte and Alaska brands achieving 18% above-average transaction values",
        impact: "low",
        timestamp: new Date().toISOString()
      }
    ];
  }
}

// Database Storage Implementation
import { users, transactions, consumers, type User, type InsertUser, type Transaction, type InsertTransaction, type Consumer, type InsertConsumer } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { aggregateTransactionsByLocation, aggregateTransactionsByCategory, aggregateTransactionsByBrand, calculateKPIMetrics } from "../client/src/lib/data-utils";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getAllTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions).orderBy(desc(transactions.id));
  }

  async getTransactionsByLocation(location: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.location, location));
  }

  async getTransactionsByBrand(brand: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.brand, brand));
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return await db.select().from(transactions).where(eq(transactions.category, category));
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const [transaction] = await db.insert(transactions).values(insertTransaction).returning();
    return transaction;
  }

  async getAllConsumers(): Promise<Consumer[]> {
    return await db.select().from(consumers);
  }

  async createConsumer(insertConsumer: InsertConsumer): Promise<Consumer> {
    const [consumer] = await db.insert(consumers).values(insertConsumer).returning();
    return consumer;
  }

  // Keep all the analytics methods from MemStorage but use database data
  async getKPIMetrics(): Promise<KPIMetrics> {
    const allTransactions = await this.getAllTransactions();
    const allConsumers = await this.getAllConsumers();
    return calculateKPIMetrics(allTransactions, allConsumers);
  }

  async getLocationData(): Promise<LocationData[]> {
    const allTransactions = await this.getAllTransactions();
    return aggregateTransactionsByLocation(allTransactions);
  }

  async getCategoryData(): Promise<CategoryData[]> {
    const allTransactions = await this.getAllTransactions();
    return aggregateTransactionsByCategory(allTransactions);
  }

  async getBrandData(): Promise<BrandData[]> {
    const allTransactions = await this.getAllTransactions();
    return aggregateTransactionsByBrand(allTransactions);
  }

  async getTrendData(): Promise<TrendData[]> {
    const allTransactions = await this.getAllTransactions();
    // Group by date and calculate trends
    const groupedByDate = allTransactions.reduce((acc, transaction) => {
      const date = transaction.date;
      if (!acc[date]) {
        acc[date] = { transactions: 0, pesoValue: 0 };
      }
      acc[date].transactions++;
      acc[date].pesoValue += parseFloat(transaction.pesoValue);
      return acc;
    }, {} as Record<string, { transactions: number; pesoValue: number }>);

    return Object.entries(groupedByDate)
      .map(([period, data]) => ({
        period,
        transactions: data.transactions,
        pesoValue: data.pesoValue
      }))
      .sort((a, b) => a.period.localeCompare(b.period))
      .slice(-7); // Last 7 days
  }

  async getAIInsights(): Promise<AIInsight[]> {
    const allTransactions = await this.getAllTransactions();
    const brandData = await this.getBrandData();
    
    // Generate insights based on real data
    const insights: AIInsight[] = [];
    
    const tbwaClients = brandData.filter(b => b.isTBWAClient);
    const avgGrowth = tbwaClients.reduce((sum, b) => sum + (b.growth || 0), 0) / tbwaClients.length;
    
    if (avgGrowth > 15) {
      insights.push({
        id: "1",
        type: "info",
        title: "Strong TBWA Client Performance",
        description: `TBWA clients showing ${avgGrowth.toFixed(1)}% average growth across Philippine markets`,
        impact: "high",
        timestamp: new Date().toISOString()
      });
    }

    const topLocation = await this.getLocationData();
    if (topLocation[0]?.transactions > 50) {
      insights.push({
        id: "2",
        type: "info",
        title: "Regional Market Leader",
        description: `${topLocation[0].location} leading with ${topLocation[0].transactions} transactions`,
        impact: "medium",
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }
}

// Use database storage in production, memory storage in development
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();