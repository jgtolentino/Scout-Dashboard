import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  volume: integer("volume").notNull(),
  pesoValue: decimal("peso_value", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(),
  units: integer("units").notNull(),
  brand: text("brand").notNull(),
  category: text("category").notNull(),
  location: text("location").notNull(),
  barangay: text("barangay"),
});

export const consumers = pgTable("consumers", {
  id: serial("id").primaryKey(),
  gender: text("gender").notNull(),
  age: integer("age").notNull(),
  location: text("location").notNull(),
  transactionId: integer("transaction_id").references(() => transactions.id),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
});

export const insertConsumerSchema = createInsertSchema(consumers).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Consumer = typeof consumers.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertConsumer = z.infer<typeof insertConsumerSchema>;

// Dashboard data aggregation types
export interface KPIMetrics {
  transactions: number;
  avgValue: number;
  substitutionRate: number;
  dataFreshness: number;
  trendsData: { label: string; value: number; change?: number }[];
}

export interface LocationData {
  location: string;
  transactions: number;
  revenue: number;
  coordinates: [number, number];
  change: number;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface BrandData {
  brand: string;
  sales: number;
  category: string;
  isTBWAClient: boolean;
  growth?: number;
}

export interface TrendData {
  period: string;
  transactions: number;
  pesoValue: number;
}

export interface AIInsight {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  timestamp: string;
}
