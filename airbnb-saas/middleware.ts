import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: Request) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) =>
          req.headers.get("cookie")?.match(new RegExp(`${name}=([^;]*)`))?.[1],
        set: () => {},
        remove: () => {},
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const url = new URL(req.url);
  const protectedPaths = ["/my-listings"];
  const isProtected = protectedPaths.some((p) => url.pathname.startsWith(p));

  if (isProtected && !user) {
    const redirectTo = new URL("/login", req.url);
    redirectTo.searchParams.set("redirect", url.pathname);
    return NextResponse.redirect(redirectTo);
  }

  return res;
}

export const config = {
  matcher: ["/my-listings/:path*"],
};
