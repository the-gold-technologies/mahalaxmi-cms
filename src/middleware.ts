import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

// Read-only content endpoints the public website consumes (GET/HEAD only).
const PUBLIC_GET_PREFIXES = [
  "/api/home",
  "/api/blogs",
  "/api/products",
  "/api/about-us",
  "/api/privacy-policy",
  "/api/nav-links",
  "/api/contact-us",
  "/api/events",
  "/api/seo",
  "/api/health",
  "/api/download",
];

// Website form submissions (POST only). Protected by rate limiting + captcha in the route.
const PUBLIC_POST_PATHS = ["/api/enquiries", "/api/distributor-leads"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(prefix + "/");
}

function isPublicApiRequest(pathname: string, method: string) {
  if (matchesPrefix(pathname, "/api/auth")) return true;
  if (method === "GET" || method === "HEAD") {
    return PUBLIC_GET_PREFIXES.some((p) => matchesPrefix(pathname, p));
  }
  if (method === "POST") return PUBLIC_POST_PATHS.includes(pathname);
  return false;
}

/**
 * Origins allowed to call the API cross-origin (the public website).
 * Configure with ALLOWED_ORIGINS (comma-separated) and/or NEXT_PUBLIC_WEBSITE_URL.
 * "*" allows any origin, but credentials are never allowed cross-origin.
 */
function getAllowedOrigins(): string[] {
  const list = [process.env.ALLOWED_ORIGINS || "", process.env.NEXT_PUBLIC_WEBSITE_URL || ""]
    .join(",")
    .split(",")
    .map((o) => o.trim().replace(/\/$/, ""))
    .filter(Boolean);
  return Array.from(new Set(list));
}

function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin) return {};
  const allowed = getAllowedOrigins();
  const isAllowed = allowed.includes("*") || allowed.includes(origin.replace(/\/$/, ""));
  if (!isAllowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { nextUrl } = req;
  const currentUrl = new URL(req.url);
  const origin = req.headers.get("origin");

  // 1. API routes: CORS + access control
  if (nextUrl.pathname.startsWith("/api/")) {
    const cors = corsHeaders(origin);

    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: cors });
    }

    // Cross-origin requests may only reach public endpoints, so a third-party
    // site can never ride on an admin's session cookie.
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || nextUrl.host;
    let isSameOrigin = !origin;
    if (origin) {
      try {
        isSameOrigin = new URL(origin).host === host;
      } catch {
        isSameOrigin = false;
      }
    }
    const isPublic = isPublicApiRequest(nextUrl.pathname, req.method);

    if (!isPublic && (!isLoggedIn || !isSameOrigin)) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: cors },
      );
    }

    const response = NextResponse.next();
    for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
    return response;
  }

  // 2. Auth Routes & Public Pages
  const isPublicRoute = ["/login", "/robots.txt", "/sitemap.xml"].includes(nextUrl.pathname);

  if (isPublicRoute) {
    if (isLoggedIn && nextUrl.pathname === "/login") {
      return NextResponse.redirect(new URL("/", currentUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", currentUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
