import { users, transactions, consumers, type User, type InsertUser, type Transaction, type InsertTransaction, type Consumer, type InsertConsumer, type KPIMetrics, type LocationData, type CategoryData, type BrandData, type TrendData, type AIInsight } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

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

// Helper functions for analytics
function aggregateTransactionsByLocation(transactions: Transaction[]): LocationData[] {
  const locationMap = new Map<string, { transactions: number; revenue: number }>();
  
  transactions.forEach(transaction => {
    const existing = locationMap.get(transaction.location) || { transactions: 0, revenue: 0 };
    locationMap.set(transaction.location, {
      transactions: existing.transactions + 1,
      revenue: existing.revenue + parseFloat(transaction.pesoValue)
    });
  });

  // Philippine city coordinates (hardcoded for demo)
  const coordinates: Record<string, [number, number]> = {
    "Manila": [14.5995, 120.9842],
    "Cebu": [10.3157, 123.8854],
    "Davao": [7.1907, 125.4553],
    "Quezon City": [14.6760, 121.0437],
    "Zamboanga": [6.9214, 122.0790],
    "Iloilo": [10.7202, 122.5621],
    "Bacolod": [10.6760, 122.9500],
    "Cagayan de Oro": [8.4542, 124.6319]
  };

  return Array.from(locationMap.entries()).map(([location, data]) => ({
    location,
    transactions: data.transactions,
    revenue: data.revenue,
    coordinates: coordinates[location] || [14.5995, 120.9842],
    change: Math.random() * 20 - 10 // Random change for demo
  })).sort((a, b) => b.transactions - a.transactions);
}

function aggregateTransactionsByCategory(transactions: Transaction[]): CategoryData[] {
  const categoryMap = new Map<string, number>();
  
  transactions.forEach(transaction => {
    const existing = categoryMap.get(transaction.category) || 0;
    categoryMap.set(transaction.category, existing + 1);
  });

  const total = transactions.length;
  const colors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];
  
  return Array.from(categoryMap.entries()).map(([category, value], index) => ({
    category,
    value,
    percentage: (value / total) * 100,
    color: colors[index % colors.length]
  })).sort((a, b) => b.value - a.value);
}

function aggregateTransactionsByBrand(transactions: Transaction[]): BrandData[] {
  const brandMap = new Map<string, { sales: number; category: string }>();
  
  transactions.forEach(transaction => {
    const existing = brandMap.get(transaction.brand) || { sales: 0, category: transaction.category };
    brandMap.set(transaction.brand, {
      sales: existing.sales + parseFloat(transaction.pesoValue),
      category: transaction.category
    });
  });

  // TBWA client brands
  const tbwaClients = ["Del Monte Sauce", "Alaska Condensed Milk", "Alaska Evaporated Milk", "Oishi Prawn Crackers"];

  return Array.from(brandMap.entries()).map(([brand, data]) => ({
    brand,
    sales: data.sales,
    category: data.category,
    isTBWAClient: tbwaClients.includes(brand),
    growth: Math.random() * 30 + 5 // Random growth for demo
  })).sort((a, b) => b.sales - a.sales);
}

function calculateKPIMetrics(transactions: Transaction[], consumers: Consumer[]): KPIMetrics {
  const totalTransactions = transactions.length;
  const totalValue = transactions.reduce((sum, t) => sum + parseFloat(t.pesoValue), 0);
  const avgValue = totalValue / totalTransactions;

  return {
    transactions: totalTransactions,
    avgValue,
    substitutionRate: 23.5, // Fixed rate for demo
    dataFreshness: 98.2, // Fixed rate for demo
    trendsData: [
      { label: "Daily Transactions", value: totalTransactions, change: 12.5 },
      { label: "Revenue", value: totalValue, change: 8.3 },
      { label: "Active Consumers", value: consumers.length, change: 15.2 }
    ]
  };
}

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
      .slice(-7);
  }

  async getAIInsights(): Promise<AIInsight[]> {
    const allTransactions = await this.getAllTransactions();
    const brandData = await this.getBrandData();
    
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