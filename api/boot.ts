import { Hono } from "hono";
import { cors } from "hono/cors";
import { cuencasRoute } from "./routes/cuencas";
import { variablesRoute } from "./routes/variables";
import { trendsRoute } from "./routes/trends";

const app = new Hono();

app.use("/*", cors());

app.route("/api/cuencas", cuencasRoute);
app.route("/api/variables", variablesRoute);
app.route("/api/trends", trendsRoute);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;