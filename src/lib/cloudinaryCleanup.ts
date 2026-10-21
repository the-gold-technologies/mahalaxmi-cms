import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Extracts all Cloudinary URLs belonging to this project from any string, array, or object
 */
export function extractCloudinaryUrls(data: any, collected: Set<string> = new Set()): Set<string> {
  if (!data) return collected;

  if (typeof data === "string") {
    const matches = data.match(/https?:\/\/[^\s"'<>)\]]+(?:res\.cloudinary\.com)[^\s"'<>)\]]*/gi);
    if (matches) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      for (let m of matches) {
        // Strip trailing punctuation
        m = m.replace(/[),;.]+$/, "");
        // Only target uploaded assets in this cloudinary cloud or mahalaxmi folder
        const isOurCloud = cloudName && m.includes(`res.cloudinary.com/${cloudName}/`);
        const isMahalaxmi = m.includes("/mahalaxmi");
        if (isOurCloud || isMahalaxmi || (!cloudName && m.includes("cloudinary.com"))) {
          collected.add(m);
        }
      }
    }
  } else if (Array.isArray(data)) {
    for (const item of data) {
      extractCloudinaryUrls(item, collected);
    }
  } else if (typeof data === "object") {
    for (const val of Object.values(data)) {
      extractCloudinaryUrls(val, collected);
    }
  }

  return collected;
}

/**
 * Parses Cloudinary URL into publicId and resourceType
 */
export function getPublicIdFromUrl(
  url: string,
): { publicId: string; resourceType: "image" | "video" | "raw" } | null {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) return null;

  try {
    const cleanUrl = url.split("?")[0].replace(/[),;.]+$/, "");
    const isRaw = cleanUrl.includes("/raw/upload/");
    const isVideo = cleanUrl.includes("/video/upload/");
    const resourceType: "image" | "video" | "raw" = isRaw ? "raw" : isVideo ? "video" : "image";

    const uploadIdx = cleanUrl.indexOf("/upload/");
    if (uploadIdx === -1) return null;
    const afterUpload = cleanUrl.slice(uploadIdx + "/upload/".length);

    const parts = afterUpload.split("/");
    let startIndex = 0;
    while (startIndex < parts.length - 1) {
      const part = parts[startIndex];
      if (/^v\d+$/.test(part)) {
        startIndex++;
        break;
      } else if (part.includes(",") || part.includes("_")) {
        startIndex++;
      } else {
        break;
      }
    }

    const publicIdWithExt = parts.slice(startIndex).join("/");
    if (isRaw) {
      return { publicId: publicIdWithExt, resourceType };
    } else {
      const lastDot = publicIdWithExt.lastIndexOf(".");
      const publicId = lastDot !== -1 ? publicIdWithExt.substring(0, lastDot) : publicIdWithExt;
      return { publicId, resourceType };
    }
  } catch {
    return null;
  }
}

/**
 * Permanently deletes a single Cloudinary asset by URL
 */
export async function deleteCloudinaryAsset(url: string | null | undefined): Promise<boolean> {
  if (!url || typeof url !== "string" || !url.includes("cloudinary.com")) {
    return false;
  }

  try {
    const parsed = getPublicIdFromUrl(url);
    if (!parsed || !parsed.publicId) return false;

    const { publicId, resourceType } = parsed;

    let res = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });

    // If image deletion returned not_found, try with full extension included
    if (res?.result === "not found" && resourceType !== "raw") {
      const cleanUrl = url.split("?")[0].replace(/[),;.]+$/, "");
      const matchWithExt = cleanUrl.match(/\/upload\/(?:v\d+\/)?(.+)$/i);
      if (matchWithExt && matchWithExt[1] !== publicId) {
        res = await cloudinary.uploader.destroy(matchWithExt[1], {
          resource_type: resourceType,
          invalidate: true,
        });
      }
    }

    const success = res?.result === "ok";
    if (success) {
      console.log(`[Cloudinary Cleanup] Deleted obsolete asset: ${publicId} (${resourceType})`);
    } else {
      console.warn(`[Cloudinary Cleanup] Result for ${publicId}:`, res?.result);
    }
    return success;
  } catch (error) {
    console.error(`[Cloudinary Cleanup] Failed to delete asset from URL ${url}:`, error);
    return false;
  }
}

/**
 * Compares old data against new data, finding Cloudinary URLs that were replaced or removed,
 * and deletes them from Cloudinary. Triggered on Save button in forms.
 */
export async function cleanupObsoleteCloudinaryAssets(oldData: any, newData: any): Promise<void> {
  try {
    const oldUrls = Array.from(extractCloudinaryUrls(oldData));
    const newUrls = Array.from(extractCloudinaryUrls(newData));

    const obsoleteUrls = oldUrls.filter((url) => !newUrls.includes(url));

    if (obsoleteUrls.length > 0) {
      console.log(
        `[Cloudinary Cleanup] Cleaning up ${obsoleteUrls.length} obsolete asset(s)...`,
        obsoleteUrls,
      );
      await Promise.allSettled(obsoleteUrls.map((url) => deleteCloudinaryAsset(url)));
    }
  } catch (err) {
    console.error("[Cloudinary Cleanup] Error during obsolete assets cleanup:", err);
  }
}

/**
 * Deletes all Cloudinary URLs found in data (used when an entire entity is deleted)
 */
export async function deleteCloudinaryAssetsFromData(data: any): Promise<void> {
  try {
    const urls = Array.from(extractCloudinaryUrls(data));
    if (urls.length > 0) {
      console.log(
        `[Cloudinary Cleanup] Deleting ${urls.length} asset(s) on entity removal...`,
        urls,
      );
      await Promise.allSettled(urls.map((url) => deleteCloudinaryAsset(url)));
    }
  } catch (err) {
    console.error("[Cloudinary Cleanup] Error deleting entity assets:", err);
  }
}
