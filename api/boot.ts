import { Hono } from "hono";
import { cors } from "hono/cors";
import { cuencasRoute } from "./routes/cuencas";
import { variablesRoute } from "./routes/variables";
import { trendsRoute } from "./routes/trends";
import { chatRoute } from "./routes/chat";

const app = new Hono();

app.use("/*", cors());

app.route("/api/cuencas", cuencasRoute);
app.route("/api/variables", variablesRoute);
app.route("/api/trends", trendsRoute);
app.route("/api/chat", chatRoute);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;