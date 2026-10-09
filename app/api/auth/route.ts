import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  isAdminAuthenticated,
  ADMIN_COOKIE_NAME,
} from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";

// GET — Check current admin session status
export async function GET(req: NextRequest) {
  const authenticated = isAdminAuthenticated(req);
  return NextResponse.json({ authenticated });
}

// POST — Authenticate or logout
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action || "login";

    if (action === "logout") {
      const response = NextResponse.json({
        authenticated: false,
        message: "Logged out successfully",
      });

      response.cookies.set({
        name: ADMIN_COOKIE_NAME,
        value: "",
        path: "/",
        maxAge: 0,
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
      });

      return response;
    }

    // Rate limit login attempts: 5 attempts per 10 minutes to stop brute-forcing
    const rateLimit = checkRateLimit(req, {
      limit: 5,
      windowSeconds: 600,
      endpointKey: "auth-login",
    });

    if (!rateLimit.success && rateLimit.response) {
      return rateLimit.response;
    }

    const { password } = body;
    const authResult = verifyAdminPassword(password);

    if (!authResult.success || !authResult.token) {
      return NextResponse.json(
        {
          authenticated: false,
          error: authResult.error || "Invalid admin credentials",
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      authenticated: true,
      message: "Admin authentication successful",
    });

    response.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: authResult.token,
      path: "/",
      maxAge: 86400 * 7, // 7 days
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("Auth endpoint error:", error);
    return NextResponse.json(
      { error: "Internal authentication error" },
      { status: 500 }
    );
  }
}
