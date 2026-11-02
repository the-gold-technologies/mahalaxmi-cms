import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Route-level admin guard (defense in depth on top of middleware).
 * Returns a 401 response when there is no session, otherwise null.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function isAdminRequest(): Promise<boolean> {
  try {
    const session = await auth();
    return !!session?.user?.email;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Rate limiting (in-memory, per instance). Good enough to stop casual spam;
// use a shared store (e.g. Upstash Redis) if you run many instances.
// ---------------------------------------------------------------------------
const buckets = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (v.resetAt < now) buckets.delete(k);
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count++;
  return bucket.count <= limit;
}

// ---------------------------------------------------------------------------
// Captcha (Cloudflare Turnstile). Enforced when TURNSTILE_SECRET_KEY is set.
// ---------------------------------------------------------------------------
export async function verifyCaptcha(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured: rely on rate limiting only
  if (typeof token !== "string" || !token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip && ip !== "unknown") body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    });
    const json = await res.json();
    return json?.success === true;
  } catch (err) {
    console.error("Captcha verification failed:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Input helpers
// ---------------------------------------------------------------------------
export function cleanString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  if (!str) return null;
  return str.slice(0, maxLength);
}

export const EMAIL_RE = /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/;
export const PHONE_RE = /^[0-9+()\-.\s]{6,20}$/;

export const SUBMISSION_STATUSES = [
  "Pending",
  "In Progress",
  "Contacted",
  "Resolved",
  "Approved",
  "Rejected",
  "Closed",
];

export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
