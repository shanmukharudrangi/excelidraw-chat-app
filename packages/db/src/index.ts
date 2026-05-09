import path from "node:path";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config({
  path: path.resolve(__dirname, "../.env"),
});

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set for @repo/db");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

export const prismaClient = new PrismaClient({
  adapter,
});

