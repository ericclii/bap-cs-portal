import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiErrorBody } from "@/lib/contracts";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Not found") => new ApiError(404, "not_found", what);
export const forbidden = (why = "You don't have access to this") =>
  new ApiError(403, "forbidden", why);
export const badRequest = (code: string, message: string, details?: unknown) =>
  new ApiError(400, code, message, details);
export const conflict = (code: string, message: string) => new ApiError(409, code, message);

type Handler<P> = (req: Request, ctx: { params: Promise<P> }) => Promise<Response>;

/** Wraps a route handler with uniform JSON error responses. */
export function route<P = Record<string, never>>(handler: Handler<P>): Handler<P> {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return errorResponse(err.status, err.code, err.message, err.details);
      }
      if (err instanceof z.ZodError) {
        const first = err.issues[0];
        return errorResponse(400, "invalid_input", first?.message ?? "Some details are missing or invalid. Check the form and try again.", z.flattenError(err));
      }
      console.error(err);
      return errorResponse(500, "internal", "Something went wrong on our end. Try again in a moment.");
    }
  };
}

function errorResponse(status: number, code: string, message: string, details?: unknown) {
  const body: ApiErrorBody = { error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export async function readJson<T extends z.ZodType>(req: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw badRequest("invalid_json", "Request body must be JSON");
  }
  return schema.parse(body);
}

export const json = (data: unknown, init?: ResponseInit) => NextResponse.json(data, init);
