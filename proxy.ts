import { NextRequest, NextResponse } from "next/server";

// In-memory store: IP → { count, resetAt }
// Note: resets between cold starts on Vercel, but effective for burst protection
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS = 10;      // max 10 uploads per IP per minute

export default function proxy(request: NextRequest) {
  try {
    // Only rate-limit Next.js Server Action POSTs (the upload path)
    const isServerAction =
      request.method === "POST" &&
      request.headers.get("next-action") !== null;

    if (!isServerAction) {
      return NextResponse.next();
    }

    // Get the real client IP (works on Vercel)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    if (!entry || now > entry.resetAt) {
      // First request or window expired — reset
      rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
      return NextResponse.next();
    }

    if (entry.count >= MAX_REQUESTS) {
      // Too many requests — block with 429
      return new NextResponse(
        JSON.stringify({
          error: "Too many uploads. Please wait a minute before trying again.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            "X-RateLimit-Limit": String(MAX_REQUESTS),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      );
    }

    // Increment count and allow
    entry.count += 1;
    rateLimitMap.set(ip, entry);

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS));
    response.headers.set(
      "X-RateLimit-Remaining",
      String(MAX_REQUESTS - entry.count)
    );
    return response;
  } catch (error) {
    console.error("Failsafe: Proxy middleware encountered an error:", error);
    return NextResponse.next();
  }
}

export const config = {
  // Apply middleware to all routes (the check inside filters to uploads only)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
