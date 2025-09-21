import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;
// Fix SSL certificate issues and prepared statement issues in development
if (process.env.NODE_ENV === 'development') {
  neonConfig.fetchConnectionCache = true;
  neonConfig.poolQueryViaFetch = true;
  neonConfig.pipelineConnect = false;
  neonConfig.useSecureWebSocket = false;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
