import {
  mysqlTable,
  serial,
  varchar,
  text,
  decimal,
  int,
  timestamp,
  json,
} from "drizzle-orm/mysql-core";
import { relations } from "drizzle-orm";

export const cuencas = mysqlTable("cuencas", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 100 }).notNull(),
  codigo: varchar("codigo", { length: 20 }).notNull().unique(),
  descripcion: text("descripcion"),
  area_km2: decimal("area_km2", { precision: 10, scale: 2 }),
  geojson: json("geojson").notNull(),
  centroide_lat: decimal("centroide_lat", { precision: 10, scale: 7 }),
  centroide_lon: decimal("centroide_lon", { precision: 10, scale: 7 }),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().onUpdateNow(),
});

export const variables = mysqlTable("variables", {
  id: serial("id").primaryKey(),
  nombre: varchar("nombre", { length: 50 }).notNull().unique(),
  unidad: varchar("unidad", { length: 20 }).notNull(),
  descripcion: text("descripcion"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const tendencias = mysqlTable("tendencias", {
  id: serial("id").primaryKey(),
  cuenca_id: int("cuenca_id").notNull().references(() => cuencas.id),
  variable_id: int("variable_id").notNull().references(() => variables.id),
  periodo_inicio: int("periodo_inicio").notNull(),
  periodo_fin: int("periodo_fin").notNull(),
  sen_slope: decimal("sen_slope", { precision: 10, scale: 4 }).notNull(),
  sen_slope_por_decada: decimal("sen_slope_por_decada", { precision: 10, scale: 4 }).notNull(),
  mann_kendall_tau: decimal("mann_kendall_tau", { precision: 6, scale: 4 }),
  mann_kendall_p_valor: decimal("mann_kendall_p_valor", { precision: 8, scale: 6 }),
  significancia: varchar("significancia", { length: 20 }), // "significativa" | "no_significativa"
  n_puntos: int("n_puntos").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const cuencasRelations = relations(cuencas, ({ many }) => ({
  tendencias: many(tendencias),
}));

export const variablesRelations = relations(variables, ({ many }) => ({
  tendencias: many(tendencias),
}));

export const tendenciasRelations = relations(tendencias, ({ one }) => ({
  cuenca: one(cuencas, {
    fields: [tendencias.cuenca_id],
    references: [cuencas.id],
  }),
  variable: one(variables, {
    fields: [tendencias.variable_id],
    references: [variables.id],
  }),
}));