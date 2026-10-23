import "server-only";
import { notFound } from "next/navigation";
import { ApiError } from "./http";

/** Runs a service call from a page; access/not-found errors render a 404. */
export async function orNotFound<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 403)) notFound();
    throw err;
  }
}
