import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isAgentRoute = createRouteMatcher(["/agent(.*)"]);
const isAuthPage = createRouteMatcher(["/login(.*)", "/signup(.*)", "/agent/login"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAuthPage(req)) {
    return NextResponse.next();
  }

  const hasDelegateSession = req.cookies.has("eo_delegate_session");

  if (isAgentRoute(req) && !hasDelegateSession) {
    return NextResponse.redirect(new URL("/agent/login", req.url));
  }

  if (isPortalRoute(req) && hasDelegateSession) {
    return NextResponse.redirect(new URL("/agent/services", req.url));
  }

  if (isPortalRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
