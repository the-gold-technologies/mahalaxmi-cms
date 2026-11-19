import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { deleteSeoPage } from "@/lib/pageSections";
import { deleteCloudinaryAssetsFromData } from "@/lib/cloudinaryCleanup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONFIG_SLUG = "system__subcategories_config";

async function getPersistedSubcategories(): Promise<string[]> {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: CONFIG_SLUG },
      select: { description: true },
    });
    if (!page?.description) return [];
    const parsed = JSON.parse(page.description);
    if (!Array.isArray(parsed)) return [];

    // Deduplicate case-insensitively and normalize to uppercase
    const map = new Map<string, string>();
    for (const item of parsed) {
      const s = String(item || "")
        .trim()
        .toUpperCase();
      if (s) map.set(s, s);
    }
    return Array.from(map.values());
  } catch {
    return [];
  }
}

async function savePersistedSubcategories(list: string[]): Promise<void> {
  const map = new Map<string, string>();
  for (const item of list) {
    const s = String(item || "")
      .trim()
      .toUpperCase();
    if (s) map.set(s, s);
  }
  const uniqueList = Array.from(map.values());

  await prisma.page.upsert({
    where: { slug: CONFIG_SLUG },
    update: { description: JSON.stringify(uniqueList) },
    create: {
      slug: CONFIG_SLUG,
      title: "System Subcategories Store",
      description: JSON.stringify(uniqueList),
      visibility: "system",
      isStatic: true,
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");

    const where: any = {
      subCategoryTitle: { not: null },
    };
    if (categorySlug && categorySlug !== "all") {
      where.categorySlug = categorySlug;
    }

    // 1. Fetch products with sub-categories
    const products = await prisma.product.findMany({
      where,
      select: {
        id: true,
        subCategoryTitle: true,
        categorySlug: true,
      },
    });

    // 2. Fetch standalone/persisted sub-categories (which may have 0 products)
    const persisted = await getPersistedSubcategories();

    // Key is normalized UPPERCASE
    const map = new Map<string, { name: string; categorySlug?: string; count: number }>();

    // Seed persisted items first with count 0
    for (const name of persisted) {
      const norm = name.trim().toUpperCase();
      if (!norm) continue;
      map.set(norm, {
        name: norm,
        count: 0,
      });
    }

    // Count products for each subcategory
    for (const p of products) {
      const title = p.subCategoryTitle?.trim();
      if (!title) continue;

      const norm = title.toUpperCase();
      if (!map.has(norm)) {
        map.set(norm, {
          name: norm,
          categorySlug: p.categorySlug,
          count: 0,
        });
      }
      map.get(norm)!.count += 1;
      if (!map.get(norm)!.categorySlug) {
        map.get(norm)!.categorySlug = p.categorySlug;
      }
    }

    const subcategories = Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ success: true, data: subcategories });
  } catch (error: any) {
    console.error("Error fetching subcategories:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to fetch subcategories" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Sub-classification name is required" },
        { status: 400 },
      );
    }

    const norm = name.trim().toUpperCase();
    const currentList = await getPersistedSubcategories();

    const exists = currentList.some((s) => s.toUpperCase() === norm);
    if (!exists) {
      currentList.push(norm);
      await savePersistedSubcategories(currentList);
    }

    return NextResponse.json({
      success: true,
      data: {
        name: norm,
        count: 0,
      },
    });
  } catch (error: any) {
    console.error("Error saving subcategory:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to create subcategory" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get("name");

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Sub-classification name is required" },
        { status: 400 },
      );
    }

    const norm = name.trim().toUpperCase();

    // 1. Remove from persisted store
    const currentList = await getPersistedSubcategories();
    const filteredList = currentList.filter((s) => s.trim().toUpperCase() !== norm);
    await savePersistedSubcategories(filteredList);

    // 2. Find and delete all matching products
    const matchingProducts = await prisma.product.findMany({
      where: {
        subCategoryTitle: {
          equals: norm,
          mode: "insensitive",
        },
      },
    });

    for (const prod of matchingProducts) {
      await prisma.product.delete({
        where: { id: prod.id },
      });
      await deleteSeoPage(`products/${prod.categorySlug}/${prod.slug}`).catch(() => {});
      deleteCloudinaryAssetsFromData(prod).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      message: `Deleted "${norm}" and its ${matchingProducts.length} product(s)`,
      affectedCount: matchingProducts.length,
    });
  } catch (error: any) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete subcategory" },
      { status: 500 },
    );
  }
}
