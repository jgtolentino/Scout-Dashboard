import sql from 'mssql';
import { dbConfig } from './config.js';

class DatabaseConnection {
  private pool: sql.ConnectionPool | null = null;
  private connecting = false;

  async getPool(): Promise<sql.ConnectionPool> {
    if (this.pool && this.pool.connected) {
      return this.pool;
    }

    if (this.connecting) {
      // Wait for the current connection attempt
      while (this.connecting) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.pool && this.pool.connected) {
        return this.pool;
      }
    }

    this.connecting = true;

    try {
      console.log('🔗 Connecting to Azure SQL Database...');
      console.log(`📊 Server: ${dbConfig.server}`);
      console.log(`🗃️  Database: ${dbConfig.database}`);

      this.pool = new sql.ConnectionPool(dbConfig);
      
      this.pool.on('error', (error) => {
        console.error('❌ Database pool error:', error);
        this.pool = null;
      });

      await this.pool.connect();
      
      console.log('✅ Database connected successfully');
      return this.pool;

    } catch (error) {
      console.error('❌ Database connection failed:', error);
      this.pool = null;
      throw error;
    } finally {
      this.connecting = false;
    }
  }

  async query<T = any>(sqlQuery: string, params?: Record<string, any>): Promise<sql.IResult<T>> {
    const pool = await this.getPool();
    const request = pool.request();

    // Add parameters if provided
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        request.input(key, value);
      });
    }

    return request.query(sqlQuery);
  }

  async execute(sqlQuery: string, params?: Record<string, any>): Promise<sql.IResult<any>> {
    return this.query(sqlQuery, params);
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log('🔌 Database connection closed');
    }
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const result = await this.query('SELECT 1 as health_check, GETUTCDATE() as server_time');
      return {
        status: 'healthy',
        details: {
          connected: true,
          serverTime: result.recordset[0]?.server_time,
          poolConnected: this.pool?.connected || false,
          poolConnecting: this.pool?.connecting || false,
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          connected: false,
          error: error instanceof Error ? error.message : String(error),
          poolConnected: this.pool?.connected || false,
          poolConnecting: this.pool?.connecting || false,
        }
      };
    }
  }
}

// Singleton instance
export const db = new DatabaseConnection();

// Export types
export type { DatabaseConnection };
export default db;