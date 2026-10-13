// Adapter: run a Fetch-style ApiHandler inside Express, Fastify (raw), Koa or node:http.
import type { IncomingMessage, ServerResponse } from "node:http";
import type { ApiHandler } from "./api";

/**
 *   import express from "express";
 *   app.use("/api/mgpl", toNodeHandler(createReportApi()));   // mount BEFORE express.json()
 *
 *   import { createServer } from "node:http";
 *   createServer(toNodeHandler(createReportApi())).listen(4000);
 */
export function toNodeHandler(handler: ApiHandler) {
  return async (req: IncomingMessage & { originalUrl?: string }, res: ServerResponse, next?: (err?: unknown) => void) => {
    try {
      const fwd = req.headers["x-forwarded-proto"];
      const proto = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(",")[0] ?? ("encrypted" in req.socket && req.socket.encrypted ? "https" : "http");
      const url = `${proto}://${req.headers.host ?? "localhost"}${req.originalUrl ?? req.url ?? "/"}`;
      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : v);
      let body: Buffer | undefined;
      if (req.method !== "GET" && req.method !== "HEAD") {
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        body = Buffer.concat(chunks);
      }
      const response = await handler(new Request(url, { method: req.method, headers, body: body ? new Uint8Array(body) : undefined }));
      res.statusCode = response.status;
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      if (next) next(e);
      else {
        res.statusCode = 500;
        res.end("Internal error");
      }
    }
  };
}
