// Fastify plugin for any Fetch-style ApiHandler (report-kit, invoice-kit, or both combined).
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import { createReportApi, type ApiHandler, type ApiOptions } from "./api";

export interface FastifyMgplOptions extends ApiOptions {
  /** Use your own handler (e.g. invoice-kit's createMgplApi). Default: createReportApi(options). */
  handler?: ApiHandler;
}

/** Bridges one Fastify request/reply to a Fetch-style handler. */
export async function handleWithFetch(handler: ApiHandler, request: FastifyRequest, reply: FastifyReply): Promise<FastifyReply> {
  const proto = request.protocol ?? "http";
  const url = `${proto}://${request.headers.host ?? "localhost"}${request.raw.url ?? request.url}`;
  const headers = new Headers();
  for (const [k, v] of Object.entries(request.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(", ") : String(v));
  const hasBody = request.method !== "GET" && request.method !== "HEAD" && request.body != null;
  const body = hasBody ? (typeof request.body === "string" || Buffer.isBuffer(request.body) ? request.body : JSON.stringify(request.body)) : undefined;
  const res = await handler(new Request(url, { method: request.method, headers, body: body as BodyInit | undefined }));
  reply.code(res.status);
  res.headers.forEach((v, k) => reply.header(k, v));
  return reply.send(Buffer.from(await res.arrayBuffer()));
}

/**
 * Fastify plugin — registers every MGPL route under its prefix:
 *
 *   import Fastify from "fastify";
 *   import { mgplFastify } from "@mgpl-diagnostics/report-kit/server";
 *   const app = Fastify();
 *   await app.register(mgplFastify, { prefix: "/api/mgpl", cors: "https://app.example.com" });
 *   await app.listen({ port: 4000 });
 *
 * The plugin is encapsulated: its raw JSON body parser does not affect your other routes.
 */
export const mgplFastify: FastifyPluginAsync<FastifyMgplOptions> = async (fastify, options) => {
  const basePath = options.basePath ?? (fastify.prefix || "/api/mgpl");
  const handler = options.handler ?? createReportApi({ ...options, basePath });
  // keep the JSON body as a string — the handler parses and size-checks it itself
  fastify.removeContentTypeParser("application/json");
  fastify.addContentTypeParser("application/json", { parseAs: "string", bodyLimit: options.maxBodyBytes ?? 1_000_000 }, (_req, body, done) => done(null, body));
  fastify.all("/*", (request, reply) => handleWithFetch(handler, request, reply));
  fastify.all("/", (request, reply) => handleWithFetch(handler, request, reply));
};
