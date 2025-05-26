import sql from 'mssql'

const config: sql.config = {
  server: process.env.SQL_SERVER || '',
  database: process.env.SQL_DATABASE || '',
  user: process.env.SQL_USERNAME || '',
  password: process.env.SQL_PASSWORD || '',
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
}

let pool: sql.ConnectionPool | null = null

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config)
  }
  return pool
}

export async function query<T = any>(
  queryString: string,
  params?: Record<string, any>
): Promise<sql.IResult<T>> {
  const connection = await getConnection()
  const request = connection.request()

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value)
    })
  }

  return request.query<T>(queryString)
}

export { sql }