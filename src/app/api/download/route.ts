import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Only these local folders may serve PDFs
const LOCAL_PUBLIC_ROOTS = [
  path.resolve(process.cwd(), "public"),
  path.resolve(process.cwd(), "..", "mahalaxmi-enterprises ", "public"),
];

function resolveLocalPdf(fileUrl: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(fileUrl.split("?")[0]);
  } catch {
    return null;
  }
  if (decoded.includes("\0") || !decoded.toLowerCase().endsWith(".pdf")) return null;

  const relative = decoded.replace(/^\/+/, "");
  const fileName = path.basename(relative);

  for (const root of LOCAL_PUBLIC_ROOTS) {
    for (const candidate of [path.resolve(root, relative), path.resolve(root, "docs", fileName)]) {
      // Block path traversal: the resolved file must stay inside the public root
      if (!candidate.startsWith(root + path.sep)) continue;
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
    }
  }
  return null;
}

/** Only allow files hosted in this project's own Cloudinary account. */
function isOwnCloudinaryUrl(fileUrl: string): boolean {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!cloudName) return false;
  try {
    const u = new URL(fileUrl);
    return (
      u.protocol === "https:" &&
      u.hostname === "res.cloudinary.com" &&
      u.pathname.startsWith(`/${cloudName}/`) &&
      /\/(raw|image)\/upload\//.test(u.pathname)
    );
  } catch {
    return false;
  }
}

async function fetchPdf(url: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(url, { redirect: "error" });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    // Verify PDF magic bytes "%PDF"
    const head = new Uint8Array(buffer.slice(0, 4));
    if (String.fromCharCode(...head) !== "%PDF") return null;
    return buffer;
  } catch (err) {
    console.warn("PDF fetch failed:", err);
    return null;
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get("url");
    const customName = searchParams.get("name") || "document.pdf";

    if (!fileUrl || fileUrl === "#") {
      return NextResponse.json({ error: "No PDF file specified or uploaded" }, { status: 400 });
    }

    const sanitizedName = customName.endsWith(".pdf") ? customName : customName + ".pdf";
    const cleanFilename = sanitizedName.replace(/[^a-zA-Z0-9_.-]/g, "_").slice(0, 150);

    const responseHeaders: Record<string, string> = {
      ...CORS_HEADERS,
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + cleanFilename + '"',
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    };

    // Case 1: Local / Relative path (e.g. /docs/... or /uploads/...)
    const isRemote = /^[a-z][a-z0-9+.-]*:/i.test(fileUrl) || fileUrl.startsWith("//");

    if (!isRemote) {
      const localPath = resolveLocalPdf(fileUrl);
      if (!localPath) {
        return NextResponse.json(
          { error: "Requested PDF file does not exist on the server" },
          { status: 404 },
        );
      }
      return new NextResponse(fs.readFileSync(localPath), {
        status: 200,
        headers: responseHeaders,
      });
    }

    // Case 2: Remote URL — only this project's Cloudinary account is allowed
    if (!isOwnCloudinaryUrl(fileUrl)) {
      return NextResponse.json({ error: "File source is not allowed" }, { status: 400 });
    }

    const cleanUrl = fileUrl.split("?")[0];
    let signedUrl: string | null = null;
    try {
      if (cleanUrl.includes("/raw/upload/")) {
        const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/i);
        if (match?.[1]) {
          signedUrl = cloudinary.utils.private_download_url(match[1], "", {
            resource_type: "raw",
            type: "upload",
            attachment: true,
          });
        }
      } else {
        const match = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.pdf)?$/i);
        if (match?.[1]) {
          signedUrl = cloudinary.utils.private_download_url(match[1], "pdf", {
            resource_type: "image",
            type: "upload",
            attachment: true,
          });
        }
      }
    } catch (err) {
      console.error("Error generating Cloudinary private download URL:", err);
    }

    let fileBuffer: ArrayBuffer | null = null;
    if (signedUrl) fileBuffer = await fetchPdf(signedUrl);
    if (!fileBuffer) fileBuffer = await fetchPdf(cleanUrl);
    if (!fileBuffer) {
      fileBuffer = await fetchPdf(cleanUrl.replace("/upload/", "/upload/fl_attachment/"));
    }

    if (!fileBuffer) {
      return NextResponse.json(
        {
          error:
            "Failed to download the uploaded PDF from Cloudinary. Please verify the uploaded file.",
        },
        { status: 502 },
      );
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("PDF download proxy error:", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
