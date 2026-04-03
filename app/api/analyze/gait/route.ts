import { NextRequest, NextResponse } from "next/server";
import { saveGaitResult } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import ffmpegPath from "ffmpeg-static";
import { execFile } from "child_process";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

const GAIT_API_URL = process.env.GAIT_API_URL;
const CONFIGURED_VIDEO_BUCKET = process.env.SUPABASE_VIDEO_BUCKET;
const VIDEO_BUCKET_SIZE_LIMIT = process.env.SUPABASE_VIDEO_BUCKET_SIZE_LIMIT || "50MB";
const execFileAsync = promisify(execFile);

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isLikelyVideoPath(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v.length > 2048) return false;
  if (v.startsWith("data:")) return false;

  // Reject high-entropy base64-like payloads that sometimes appear in API payloads.
  if (
    v.length > 180 &&
    !v.includes(".mp4") &&
    !v.includes(".webm") &&
    !v.includes(".mov") &&
    /^[A-Za-z0-9+/=]+$/.test(v)
  ) {
    return false;
  }

  return (
    v.startsWith("http://") ||
    v.startsWith("https://") ||
    v.startsWith("/") ||
    v.includes(".mp4") ||
    v.includes(".webm") ||
    v.includes(".mov") ||
    v.includes("/video") ||
    v.includes("video/")
  );
}

function extractVideoPathDeep(source: unknown, maxDepth = 4): string | null {
  const visited = new Set<unknown>();

  const walk = (node: unknown, depth: number): string | null => {
    if (depth < 0 || node == null) return null;
    if (visited.has(node)) return null;

    if (isLikelyVideoPath(node)) return node;

    if (typeof node !== "object") return null;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth - 1);
        if (found) return found;
      }
      return null;
    }

    const obj = node as Record<string, unknown>;
    const preferredKeys = [
      "annotated_video",
      "annotated_video_url",
      "annotated",
      "output_video",
      "video_url",
      "video",
      "path",
      "url",
    ];

    for (const key of preferredKeys) {
      if (key in obj) {
        const found = walk(obj[key], depth - 1);
        if (found) return found;
      }
    }

    for (const value of Object.values(obj)) {
      const found = walk(value, depth - 1);
      if (found) return found;
    }

    return null;
  };

  return walk(source, maxDepth);
}

function isLikelyBase64Video(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v) return false;

  if (v.startsWith("data:video/")) return true;

  // Raw base64 payloads are usually long and limited to base64 chars.
  return v.length > 1000 && /^[A-Za-z0-9+/=\r\n]+$/.test(v);
}

function extractBase64VideoDeep(source: unknown, maxDepth = 5): string | null {
  const visited = new Set<unknown>();

  const walk = (node: unknown, depth: number): string | null => {
    if (depth < 0 || node == null) return null;
    if (visited.has(node)) return null;

    if (isLikelyBase64Video(node)) return node;

    if (typeof node !== "object") return null;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth - 1);
        if (found) return found;
      }
      return null;
    }

    const obj = node as Record<string, unknown>;
    const preferredKeys = [
      "annotated_video_base64",
      "video_base64",
      "output_video_base64",
      "base64",
      "data",
      "content",
      "video",
      "annotated_video",
    ];

    for (const key of preferredKeys) {
      if (key in obj) {
        const found = walk(obj[key], depth - 1);
        if (found) return found;
      }
    }

    for (const value of Object.values(obj)) {
      const found = walk(value, depth - 1);
      if (found) return found;
    }

    return null;
  };

  return walk(source, maxDepth);
}

function decodeBase64VideoPayload(payload: string): { buffer: Buffer; contentType: string } | null {
  const trimmed = payload.trim();

  // Data URI format: data:video/mp4;base64,AAAA...
  const dataUriMatch = /^data:(video\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/.exec(trimmed);
  if (dataUriMatch) {
    const [, mime, b64] = dataUriMatch;
    try {
      const normalized = b64
        .replace(/\s+/g, "")
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .replace(/^b'/, "")
        .replace(/'$/, "");
      const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
      return {
        buffer: Buffer.from(padded, "base64"),
        contentType: mime,
      };
    } catch {
      return null;
    }
  }

  try {
    const normalized = trimmed
      .replace(/\s+/g, "")
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/^b'/, "")
      .replace(/'$/, "");
    const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
    const raw = Buffer.from(padded, "base64");
    if (!raw || raw.length === 0) return null;

    // Best-effort media type detection.
    const mp4 = raw.length > 12 && raw.subarray(4, 8).toString("ascii") === "ftyp";
    const webm = raw.length > 4 && raw[0] === 0x1a && raw[1] === 0x45 && raw[2] === 0xdf && raw[3] === 0xa3;
    const contentType = mp4 ? "video/mp4" : webm ? "video/webm" : "video/mp4";

    return { buffer: raw, contentType };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  if (!GAIT_API_URL) {
    return NextResponse.json(
      { error: "GAIT_API_URL is not configured." },
      { status: 500 }
    );
  }

  const formData = await req.formData();

  const session_id = formData.get("session_id") as string;
  const file       = formData.get("video") as File;
  const gender     = formData.get("gender") as string; // From UI (patientData.gender)
  const patient_id = formData.get("patient_id") as string; // Patient ID from UI

  if (!session_id || !file || !gender || !patient_id) {
    return NextResponse.json(
      { error: "session_id, gender, patient_id, and video are required." },
      { status: 400 }
    );
  }

  // Validate session_id is a valid UUID
  if (!isUuid(session_id)) {
    return NextResponse.json(
      { error: "Invalid session_id format." },
      { status: 400 }
    );
  }

  // patient_id can come as patient code (e.g. p004) or UUID; resolve to UUID for patient_videos table.
  let patientUuid = patient_id;
  if (!isUuid(patient_id)) {
    const { data: patientRow, error: patientLookupError } = await supabase
      .from("patients")
      .select("id")
      .eq("patient_id", patient_id)
      .maybeSingle();

    if (patientLookupError) {
      return NextResponse.json(
        { error: `Could not resolve patient_id. ${patientLookupError.message}` },
        { status: 400 }
      );
    }

    if (!patientRow?.id) {
      return NextResponse.json(
        { error: "Invalid patient_id: patient not found." },
        { status: 400 }
      );
    }

    patientUuid = patientRow.id as string;
  }

  // ── 1. Forward to Gait API ─────────────────────────────────────────────────
  const upstream = new FormData();
  upstream.append("video", file);
  upstream.append("gender", gender);

  const gaitBaseUrl = GAIT_API_URL.replace(/\/+$/, "");
  const hfDownloadUrlCandidate = `${gaitBaseUrl}/download/${session_id}_annotated.mp4`;
  console.log(`[gait] HF download URL candidate: ${hfDownloadUrlCandidate}`);

  let apiResult: Record<string, unknown>;
  const t0 = Date.now();
  try {
    const response = await fetch(`${gaitBaseUrl}/analyze`, {
      method: "POST",
      body: upstream,
    });
    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Gait API: ${detail}` }, { status: response.status });
    }
    apiResult = await response.json();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown network error";
    return NextResponse.json(
      { error: `Could not reach Gait API. ${message}` },
      { status: 502 }
    );
  }
  const processing_time_ms = Date.now() - t0;

  console.log("[gait] Response keys:", Object.keys(apiResult));

  // Extract necessary fields
  const gait_score_candidate =
    (apiResult.gait_stability_score as number | undefined) ??
    (apiResult.gait_score as number | undefined) ??
    (apiResult.score as number | undefined);

  const gait_score = typeof gait_score_candidate === "number"
    ? gait_score_candidate
    : undefined;

  const downloadUrls = apiResult.download_urls as Record<string, unknown> | undefined;
  const files = apiResult.files as Record<string, unknown> | undefined;
  const metadata = apiResult.metadata as Record<string, unknown> | undefined;
  const inferredAnnotatedFilename = extractAnnotatedFilenameDeep(apiResult);
  const inferredDownloadUrl = inferredAnnotatedFilename
    ? `${gaitBaseUrl}/download/${inferredAnnotatedFilename}`
    : null;
  console.log("[gait] files keys:", Object.keys(files ?? {}));
  console.log("[gait] metadata keys:", Object.keys(metadata ?? {}));

  const candidateVideoPaths: unknown[] = [
    downloadUrls?.annotated_video,
    downloadUrls?.annotated,
    downloadUrls?.annotated_video_url,
    downloadUrls?.video,
    downloadUrls?.output_video,
    files?.annotated_video,
    files?.annotated,
    files?.video,
    files?.output_video,
    files?.annotated_video_url,
    apiResult.annotated_video_url,
    apiResult.video_url,
    apiResult.output_video,
    inferredDownloadUrl,
    extractVideoPathDeep(files),
    extractVideoPathDeep(metadata),
    extractVideoPathDeep(apiResult),
  ];

  const embeddedVideoPayload =
    extractBase64VideoDeep(files) ??
    extractBase64VideoDeep(metadata) ??
    extractBase64VideoDeep(apiResult);

  const annotatedPath = candidateVideoPaths.find(isLikelyVideoPath);
  const api_video_url = annotatedPath
    ? annotatedPath.startsWith("http")
      ? annotatedPath
      : `${gaitBaseUrl}/${annotatedPath.replace(/^\/+/, "")}`
    : null;

  if (api_video_url) {
    console.log(`[gait] Download URL candidate: ${api_video_url}`);
    console.log("[gait] Video URL extracted successfully");
  } else if (embeddedVideoPayload) {
    if (inferredDownloadUrl) {
      console.log(`[gait] Inferred download URL (HF style): ${inferredDownloadUrl}`);
    }
    console.log("[gait] Embedded base64 video payload found");
  }

  // Extract gait parameters
  const features = apiResult.features as Record<string, unknown> | undefined;
  const stride_variability = typeof features?.stride_variability === "number" ? features.stride_variability : undefined;
  const cadence = typeof features?.cadence === "number" ? features.cadence : undefined;
  const gait_symmetry = typeof features?.symmetry_ratio === "number" ? features.symmetry_ratio : undefined;
  const overall_arm_swing = typeof features?.l_arm_amp === "number" ? features.l_arm_amp : undefined;
  const arm_swing_asymmetry = typeof features?.arm_asymmetry_index === "number" ? features.arm_asymmetry_index : undefined;

  if (typeof gait_score === "undefined") {
    return NextResponse.json(
      { error: "Gait API did not return a gait score field." },
      { status: 500 }
    );
  }

  // ── 2. Download video from API and upload to Supabase ───────────────────────
  let supabase_video_url: string | null = null;
  let video_error: string | null = null;
  let video_source: "url" | "embedded_base64" | "none" = "none";
  let transcoded_for_browser = false;
  if (api_video_url || embeddedVideoPayload) {
    try {
      let videoBuffer: ArrayBuffer | Buffer | null = null;
      let uploadContentType = "video/mp4";

      if (api_video_url) {
        video_source = "url";
        console.log(`[gait] ✅ Downloading video from:`, api_video_url);
        const videoResponse = await fetch(api_video_url);
        if (!videoResponse.ok) {
          console.error(`[gait] ❌ Failed to download video from API: ${videoResponse.status}`);
          video_error = `Video download failed (${videoResponse.status})`;
        } else {
          videoBuffer = await videoResponse.arrayBuffer();
          const responseType = videoResponse.headers.get("content-type");
          if (responseType?.startsWith("video/")) {
            uploadContentType = responseType;
          }
        }
      } else if (embeddedVideoPayload) {
        video_source = "embedded_base64";
        const decoded = decodeBase64VideoPayload(embeddedVideoPayload);
        if (!decoded) {
          console.error("[gait] ❌ Failed to decode embedded base64 video payload");
          video_error = "Embedded video payload could not be decoded";
        } else {
          videoBuffer = decoded.buffer;
          uploadContentType = decoded.contentType;
          console.log(`[gait] ✅ Decoded embedded video payload: ${decoded.buffer.length} bytes`);
        }
      }

      if (!videoBuffer) {
        console.error("[gait] ❌ No valid video buffer to upload");
        if (!video_error) {
          video_error = "No valid video buffer generated from API response";
        }
      } else {
        let uploadBuffer = Buffer.isBuffer(videoBuffer)
          ? videoBuffer
          : Buffer.from(videoBuffer);

        const browserSafe = await transcodeVideoForBrowser(uploadBuffer);
        if (browserSafe) {
          uploadBuffer = browserSafe.buffer;
          uploadContentType = browserSafe.contentType;
          transcoded_for_browser = true;
          console.log(`[gait] ✅ Using transcoded video for upload: ${uploadBuffer.length} bytes`);
        } else {
          console.warn(`[gait] ⚠️ Transcode failed, uploading original video (may not be browser-friendly): ${uploadBuffer.length} bytes`);
        }

        const ext = uploadContentType.includes("webm") ? "webm" : "mp4";
        const videoFileName = `gait/${session_id}_${Date.now()}_annotated.${ext}`;

        const bucketCandidates = [
          CONFIGURED_VIDEO_BUCKET,
          "analysis-videos",
          "analysis_videos",
          "videos",
        ].filter((value): value is string => Boolean(value));

        let selectedBucket: string | null = null;
        let lastUploadError: string | null = null;

        for (const bucket of bucketCandidates) {
          const ensured = await ensureStorageBucket(bucket);
          if (!ensured.ok) {
            lastUploadError = `Bucket '${bucket}' unavailable: ${ensured.message}`;
            console.warn(`[gait] ⚠️ ${lastUploadError}`);
            continue;
          }

          let { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(videoFileName, uploadBuffer, {
              contentType: uploadContentType,
              upsert: true,
            });

          if (uploadError && /maximum allowed size/i.test(uploadError.message)) {
            console.warn(`[gait] ⚠️ Bucket '${bucket}' file size limit too small. Attempting update + retry...`);
            const { error: updateBucketError } = await supabase.storage.updateBucket(bucket, {
              public: true,
              fileSizeLimit: VIDEO_BUCKET_SIZE_LIMIT,
            });

            if (!updateBucketError) {
              const retry = await supabase.storage
                .from(bucket)
                .upload(videoFileName, uploadBuffer, {
                  contentType: uploadContentType,
                  upsert: true,
                });
              uploadError = retry.error;
            } else {
              console.warn(`[gait] ⚠️ Could not update bucket '${bucket}' size limit: ${updateBucketError.message}`);
            }
          }

          if (uploadError) {
            lastUploadError = `Upload failed for bucket '${bucket}': ${uploadError.message}`;
            console.warn(`[gait] ⚠️ ${lastUploadError}`);
            continue;
          }

          selectedBucket = bucket;
          break;
        }

        if (!selectedBucket) {
          video_error = lastUploadError ?? "Supabase upload failed for all candidate buckets";
          console.error(`[gait] ❌ ${video_error}`);
        } else {
          const { data: publicData } = supabase.storage
            .from(selectedBucket)
            .getPublicUrl(videoFileName);
          supabase_video_url = publicData.publicUrl;
          console.log(`[gait] ✅ Video uploaded successfully. Public URL: ${supabase_video_url}`);

          const { error: videoError } = await supabase
            .from("patient_videos")
            .insert({
              patient_id: patientUuid,
              analysis_type: "gait",
              video_url: supabase_video_url,
              file_path: `${selectedBucket}/${videoFileName}`,
              session_id,
            });

          if (videoError) {
            console.error(`[gait] ❌ Failed to insert video record:`, videoError);
            video_error = `Video uploaded but DB insert failed: ${videoError.message}`;
          } else {
            console.log(`[gait] ✅ Video record inserted into patient_videos table`);
          }
        }
      }
    } catch (err) {
      console.error(`[gait] ❌ Video upload to Supabase failed:`, err);
      video_error = err instanceof Error ? err.message : "Unknown upload failure";
    }
  } else {
    console.warn("[gait] ⚠️  No video URL found in API response");
    console.warn("[gait] Looked for: download_urls/files/top-level + nested files/metadata keys (annotated_video, video_url, output_video, path/url)");
    video_error = "No video URL or embedded video payload found in API response";
  }

  // ── 3. Save to Supabase (OPTIONAL - Skip if columns don't exist yet) ──────────────────────
  let saved = false;
  try {
    // Try to save to database, but don't fail if columns are missing
    await saveGaitResult(session_id, {
      gait_score: gait_score,
      processing_time_ms,
      stride_variability,
      cadence,
      gait_symmetry,
      overall_arm_swing,
      arm_swing_asymmetry,
    });
    saved = true;
    console.log("[gait] ✅ Saved to database");
  } catch {
    console.warn("[gait] ⚠️  Database save skipped (columns may not exist yet). Data still in response.");
    // Don't fail the entire request - we still have the data in the response
    saved = false;
  }

  return NextResponse.json({ 
    gait_score: gait_score, 
    video_source,
    transcoded_for_browser,
    video_error,
    processing_time_ms,
    stride_variability,
    cadence,
    gait_symmetry,
    overall_arm_swing,
    arm_swing_asymmetry,
    saved 
  });
}

async function ensureStorageBucket(bucket: string) {
  const { error: getBucketError } = await supabase.storage.getBucket(bucket);

  if (getBucketError && String((getBucketError as { statusCode?: string }).statusCode) === "404") {
    const { error: createBucketError } = await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: VIDEO_BUCKET_SIZE_LIMIT,
    });

    if (createBucketError) {
      return { ok: false, message: createBucketError.message };
    }

    return { ok: true, created: true };
  }

  if (getBucketError) {
    return { ok: false, message: getBucketError.message };
  }

  return { ok: true, created: false };
}

function extractAnnotatedFilenameDeep(source: unknown, maxDepth = 5): string | null {
  const visited = new Set<unknown>();
  const filePattern = /([0-9a-fA-F-]{36}_annotated\.(mp4|webm|mov))/;

  const walk = (node: unknown, depth: number): string | null => {
    if (depth < 0 || node == null) return null;
    if (visited.has(node)) return null;

    if (typeof node === "string") {
      const match = node.match(filePattern);
      return match ? match[1] : null;
    }

    if (typeof node !== "object") return null;
    visited.add(node);

    if (Array.isArray(node)) {
      for (const item of node) {
        const found = walk(item, depth - 1);
        if (found) return found;
      }
      return null;
    }

    for (const value of Object.values(node as Record<string, unknown>)) {
      const found = walk(value, depth - 1);
      if (found) return found;
    }

    return null;
  };

  return walk(source, maxDepth);
}

async function transcodeVideoForBrowser(inputBuffer: Buffer): Promise<{ buffer: Buffer; contentType: string } | null> {
  if (!ffmpegPath) {
    console.warn("[gait] ⚠️ ffmpegPath not available, skipping transcode");
    return null;
  }

  const jobId = randomUUID();
  const inputPath = path.join(os.tmpdir(), `gait-${jobId}-input.bin`);
  const outputPath = path.join(os.tmpdir(), `gait-${jobId}-output.mp4`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    console.log(`[gait] 📝 Temp input written: ${inputPath} (${inputBuffer.length} bytes)`);

    await execFileAsync(ffmpegPath, [
      "-y",
      "-i",
      inputPath,
      "-c:v",
      "libx264",
      "-profile:v",
      "baseline",
      "-level",
      "3.0",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-an",
      outputPath,
    ]);

    // Explicit guard: verify output file exists before reading
    const stats = await fs.stat(outputPath).catch(() => null);
    if (!stats || stats.size === 0) {
      throw new Error(`ffmpeg produced no output file or empty file at ${outputPath}`);
    }

    const transcoded = await fs.readFile(outputPath);
    console.log(`[gait] ✅ ffmpeg transcode succeeded: ${inputBuffer.length} -> ${transcoded.length} bytes (moov=faststart)`);
    return {
      buffer: transcoded,
      contentType: "video/mp4",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[gait] ❌ Transcode FAILED: ${errorMsg} — falling back to original (non-faststart) video`);
    return null;
  } finally {
    await fs.rm(inputPath, { force: true }).catch(() => undefined);
    await fs.rm(outputPath, { force: true }).catch(() => undefined);
  }
}