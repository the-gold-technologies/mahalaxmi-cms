import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categorySlug = searchParams.get("category");
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (id) {
      const product = await prisma.product.findUnique({
        where: { id },
      });
      return NextResponse.json({ success: true, data: product });
    }

    if (slug) {
      const product = await prisma.product.findUnique({
        where: { slug },
      });
      return NextResponse.json({ success: true, data: product });
    }

    const where: any = {};
    if (categorySlug && categorySlug !== "all") {
      where.categorySlug = categorySlug;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { order: "asc" },
    });

    const categories = await prisma.productCategory.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: { products, categories },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slug, ...rest } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: "Name and slug are required" },
        { status: 400 }
      );
    }

    const created = await prisma.product.create({
      data: { name, slug, ...rest },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Product ID is required" },
        { status: 400 }
      );
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
