import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isAuthPage = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;

  if (isAuthPage(req)) {
    return NextResponse.next();
  }

  if (isPortalRoute(req)) {
    await auth.protect();
  }

  if (pathname === "/eo-admin" || (pathname.startsWith("/eo-admin/") && pathname !== "/eo-admin/login")) {
    const hasStaffCookie = Boolean(req.cookies.get("eo_staff_session")?.value);
    if (!hasStaffCookie) {
      return NextResponse.redirect(new URL("/eo-admin/login", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
