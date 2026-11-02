import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupObsoleteCloudinaryAssets } from "@/lib/cloudinaryCleanup";

interface PageDefaults {
  title: string;
  type?: string;
}

const isPlainObject = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === "object" && !Array.isArray(v);

/** Keys in a PUT body that are request metadata, never section names */
const RESERVED_KEYS = new Set(["section", "sectionType", "content", "sections", "seo"]);

export async function ensurePage(slug: string, defaults: PageDefaults) {
  return prisma.page.upsert({
    where: { slug },
    create: {
      slug,
      title: defaults.title,
      type: defaults.type || "static",
      visibility: "published",
    },
    update: {},
  });
}

/**
 * Saves one section of a page.
 * Object content is MERGED into what is stored, so fields a form does not manage
 * are never wiped. Lists inside a field (slides, gallery items...) are replaced as a whole.
 */
export async function saveSection(pageId: string, type: string, content: unknown) {
  const existing = await prisma.section.findFirst({ where: { pageId, type } });

  if (existing) {
    const merged =
      isPlainObject(existing.content) && isPlainObject(content)
        ? { ...existing.content, ...content }
        : content;

    await prisma.section.update({
      where: { id: existing.id },
      data: { content: merged as any },
    });

    // Runs after the save so the reference check sees the new data
    cleanupObsoleteCloudinaryAssets(existing.content, merged).catch((err) =>
      console.error(`Cleanup error (${type}):`, err),
    );
    return merged;
  }

  const highest = await prisma.section.aggregate({
    where: { pageId },
    _max: { order: true },
  });
  await prisma.section.create({
    data: {
      pageId,
      type,
      content: content as any,
      order: (highest._max.order ?? -1) + 1,
    },
  });
  return content;
}

/** Reads `{ section, content }`, `{ sections: {...} }` or `{ SectionName: content, ... }` */
export function parseSectionsBody(body: any, ignoreKeys: string[] = []): Record<string, unknown> {
  const sectionName = body?.section || body?.sectionType;
  if (sectionName && body.content !== undefined) return { [sectionName]: body.content };
  if (isPlainObject(body?.sections)) return body.sections;

  const out: Record<string, unknown> = {};
  if (isPlainObject(body)) {
    for (const [k, v] of Object.entries(body)) {
      if (!RESERVED_KEYS.has(k) && !ignoreKeys.includes(k)) out[k] = v;
    }
  }
  return out;
}

/** Shared PUT handler for page-content APIs (home, about-us, contact-us, events, blogs) */
export async function handleSectionsPut(
  body: any,
  pageSlug: string,
  defaults: PageDefaults,
  ignoreKeys: string[] = [],
) {
  try {
    const sections = parseSectionsBody(body, ignoreKeys);
    if (Object.keys(sections).length === 0) {
      return NextResponse.json(
        { success: false, error: "'section' and 'content' are required" },
        { status: 400 },
      );
    }

    const page = await ensurePage(pageSlug, defaults);
    const saved: Record<string, unknown> = {};
    for (const [type, content] of Object.entries(sections)) {
      saved[type] = await saveSection(page.id, type, content);
    }
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error(`Error saving ${pageSlug} sections:`, error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Per-item SEO records (Page rows like "blogs/<slug>" or "products/<cat>/<slug>")
// ---------------------------------------------------------------------------

/** Moves an item's SEO record when its URL changes, so its SEO settings are kept. */
export async function moveSeoPage(oldSlug: string, newSlug: string) {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return;
  const old = await prisma.page.findUnique({ where: { slug: oldSlug } });
  if (!old) return;
  const target = await prisma.page.findUnique({ where: { slug: newSlug } });
  if (target) {
    console.warn(`[SEO] Not moving ${oldSlug}: ${newSlug} already has its own SEO record`);
    return;
  }
  await prisma.page.update({ where: { id: old.id }, data: { slug: newSlug } });
}

/** Removes an item's SEO record when the item is deleted (never pages with content). */
export async function deleteSeoPage(slug: string) {
  if (!slug) return;
  await prisma.page.deleteMany({ where: { slug, sections: { none: {} } } });
}
