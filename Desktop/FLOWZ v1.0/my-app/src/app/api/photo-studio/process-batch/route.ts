/**
 * POST /api/photo-studio/process-batch
 *
 * Server-side batch dispatcher for Photo Studio.
 * Accepts a batchId, fetches all pending studio_jobs for that batch,
 * and processes them sequentially server-side (no browser loop needed).
 *
 * This eliminates the browser-side sequential dispatch pattern,
 * preventing issues with tab closure, network interruption, etc.
 */

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 minutes for large batches

// Internal URL for process-job calls (same server)
function getProcessJobUrl(request: NextRequest): string {
  const origin = request.nextUrl.origin;
  return `${origin}/api/photo-studio/process-job`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Parse request
  let body: { batchId: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { batchId } = body;
  if (!batchId) {
    return NextResponse.json(
      { success: false, error: "batchId is required" },
      { status: 400 }
    );
  }

  // 2. Auth check
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  // 3. Verify batch ownership
  const { data: batch, error: batchError } = await supabase
    .from("batch_jobs")
    .select("id, tenant_id, total_items")
    .eq("id", batchId)
    .eq("tenant_id", user.id)
    .single();

  if (batchError || !batch) {
    return NextResponse.json(
      { success: false, error: "Batch not found or access denied" },
      { status: 404 }
    );
  }

  // 4. Fetch all pending jobs for this batch
  const { data: pendingJobs, error: jobsError } = await supabase
    .from("studio_jobs")
    .select("id")
    .eq("batch_id", batchId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (jobsError) {
    return NextResponse.json(
      { success: false, error: jobsError.message },
      { status: 500 }
    );
  }

  if (!pendingJobs || pendingJobs.length === 0) {
    return NextResponse.json({
      success: true,
      message: "No pending jobs to process",
      processed: 0,
    });
  }

  // 5. Mark batch as processing
  await supabase
    .from("batch_jobs")
    .update({ status: "processing" })
    .eq("id", batchId);

  // 6. Forward cookies for auth propagation to process-job
  const cookieHeader = request.headers.get("cookie") || "";
  const processJobUrl = getProcessJobUrl(request);

  // 7. Process jobs sequentially server-side
  let successCount = 0;
  let failCount = 0;

  for (const job of pendingJobs) {
    try {
      const res = await fetch(processJobUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({ jobId: job.id }),
      });

      if (res.ok) {
        successCount++;
      } else {
        failCount++;
        const data = await res.json().catch(() => ({}));
        console.error(
          `[process-batch] Job ${job.id} failed:`,
          data.error || res.statusText
        );
      }
    } catch (err) {
      failCount++;
      console.error(`[process-batch] Job ${job.id} dispatch error:`, err);
    }
  }

  return NextResponse.json({
    success: true,
    total: pendingJobs.length,
    successful: successCount,
    failed: failCount,
  });
}
