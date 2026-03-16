import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPortalRoute = createRouteMatcher(["/portal(.*)"]);
const isAuthPage = createRouteMatcher(["/login(.*)", "/signup(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isAuthPage(req)) {
    return NextResponse.next();
  }

  if (isPortalRoute(req)) {
    await auth.protect();
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
