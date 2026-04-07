import { sqliteTable, text, real, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const report = sqliteTable("Report", {
  id: text("id").primaryKey(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  location: text("location"),
  timeOfReport: text("timeOfReport").default(sql`CURRENT_TIMESTAMP`),
  description: text("description"),
  hidden: integer("hidden", { mode: "boolean" }).default(false),
});

export const reportImage = sqliteTable("ReportImage", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  reportId: text("reportId")
    .notNull()
    .references(() => report.id),
});

export const moderatorCredentials = sqliteTable("ModeratorCredentials", {
  id: text("id").primaryKey(),
  createdAt: text("createdAt").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updatedAt").default(sql`CURRENT_TIMESTAMP`),
  username: text("username").notNull(),
  password: text("password").notNull(),
});
