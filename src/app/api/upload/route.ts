import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const file: File | null = (data.get("file") || data.get("files")) as unknown as File;
    let folder = (data.get("folder") as string) || "mahalaxmi-enterprises/uploads";
    if (folder.startsWith("mahalaxmi/")) {
      folder = folder.replace(/^mahalaxmi\//, "mahalaxmi-enterprises/");
    }

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const originalBuffer = Buffer.from(bytes);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const isImage =
      (file.type.startsWith("image/") || /\.(jpe?g|png|webp|avif|tiff|bmp)$/i.test(file.name)) &&
      !file.type.includes("svg") &&
      !file.name.toLowerCase().endsWith(".svg");

    let uploadBuffer = originalBuffer;
    let finalFileName = file.name;
    let resourceType: "raw" | "image" | "auto" = isPdf ? "raw" : "auto";

    // 1. Compress PDF using stream compaction
    if (isPdf) {
      try {
        const originalSizeKb = (originalBuffer.length / 1024).toFixed(1);
        const pdfDoc = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
        const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
        const compressedBuffer = Buffer.from(compressedBytes);

        if (compressedBuffer.length <= originalBuffer.length) {
          uploadBuffer = compressedBuffer;
        }

        const finalSizeKb = (uploadBuffer.length / 1024).toFixed(1);
        console.log(
          `[Cloudinary Upload] Compressed PDF ${file.name} (${originalSizeKb} KB) -> (${finalSizeKb} KB)`,
        );
      } catch (pdfError) {
        console.warn(
          "[Cloudinary Upload] PDF compression failed, falling back to original file:",
          pdfError,
        );
      }
    }

    // 2. Compress image to lightweight WebP in KB before uploading to Cloudinary
    if (isImage) {
      try {
        const originalSizeKb = (originalBuffer.length / 1024).toFixed(1);
        const compressed = await sharp(originalBuffer)
          .rotate() // preserve correct camera/phone orientation
          .resize(1920, 1920, {
            fit: "inside",
            withoutEnlargement: true,
          })
          .webp({ quality: 80, effort: 4 })
          .toBuffer();

        // If compressed version is smaller or within bounds, use compressed WebP
        if (compressed.length <= originalBuffer.length) {
          uploadBuffer = compressed;
          finalFileName = file.name.replace(/\.[a-zA-Z0-9]+$/, ".webp");
          if (!finalFileName.endsWith(".webp")) {
            finalFileName += ".webp";
          }
        }
        resourceType = "image";

        const finalSizeKb = (uploadBuffer.length / 1024).toFixed(1);
        console.log(
          `[Cloudinary Upload] Compressed ${file.name} (${originalSizeKb} KB) -> ${finalFileName} (${finalSizeKb} KB)`,
        );
      } catch (sharpError) {
        console.warn(
          "[Cloudinary Upload] Image compression failed, falling back to original file:",
          sharpError,
        );
      }
    }

    const cleanBaseName = finalFileName
      .replace(/\.[a-zA-Z0-9]+$/i, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const publicId = isPdf ? `${cleanBaseName}_${Date.now()}.pdf` : undefined;

    const result = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          ...(publicId ? { public_id: publicId } : {}),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        },
      );
      uploadStream.end(uploadBuffer);
    });

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      urls: [result.secure_url],
      publicId: result.public_id,
      name: finalFileName,
      size: uploadBuffer.length,
      sizeKb: (uploadBuffer.length / 1024).toFixed(1) + " KB",
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Upload failed" },
      { status: 500 },
    );
  }
}
