import { NextResponse } from "next/server";

// Short-link target for SMS/email alert bodies (see load-matching.ts's
// loadUrl construction) -- SMS can't hide a long URL behind link text the
// way HTML email can, so this just redirects to the real destination
// instead of duplicating its auth/access-control logic. All of that stays
// on /dashboard/pilot-car and GET /api/loads/[id]; this route does nothing
// but forward loadId.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ loadId: string }> }
) {
  const { loadId } = await params;
  return NextResponse.redirect(
    new URL(`/dashboard/pilot-car?loadId=${loadId}`, request.url)
  );
}
