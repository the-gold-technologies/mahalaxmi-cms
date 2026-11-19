import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function savePersistedSubcategories(list: string[]): Promise<void> {
  const uniqueList = Array.from(new Set(list.map((s) => s.trim()))).filter(Boolean);
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

    const map = new Map<string, { name: string; categorySlug?: string; count: number }>();

    // Seed persisted items first with count 0
    for (const name of persisted) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      const key = trimmed.toUpperCase();
      map.set(key, {
        name: trimmed,
        count: 0,
      });
    }

    // Count products for each subcategory
    for (const p of products) {
      const title = p.subCategoryTitle?.trim();
      if (!title) continue;

      const key = title.toUpperCase();
      if (!map.has(key)) {
        map.set(key, {
          name: title,
          categorySlug: p.categorySlug,
          count: 0,
        });
      }
      map.get(key)!.count += 1;
      if (!map.get(key)!.categorySlug) {
        map.get(key)!.categorySlug = p.categorySlug;
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

    const trimmed = name.trim();
    const currentList = await getPersistedSubcategories();

    const exists = currentList.some((s) => s.toLowerCase() === trimmed.toLowerCase());
    if (!exists) {
      currentList.push(trimmed);
      await savePersistedSubcategories(currentList);
    }

    return NextResponse.json({
      success: true,
      data: {
        name: trimmed,
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

    const trimmed = name.trim();

    // 1. Remove from persisted store
    const currentList = await getPersistedSubcategories();
    const filteredList = currentList.filter((s) => s.toLowerCase() !== trimmed.toLowerCase());
    await savePersistedSubcategories(filteredList);

    // 2. Clear subCategoryTitle on all matching products
    const res = await prisma.product.updateMany({
      where: {
        subCategoryTitle: {
          equals: trimmed,
          mode: "insensitive",
        },
      },
      data: {
        subCategoryTitle: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Removed "${trimmed}" from ${res.count} products`,
      affectedCount: res.count,
    });
  } catch (error: any) {
    console.error("Error deleting subcategory:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to delete subcategory" },
      { status: 500 },
    );
  }
}
