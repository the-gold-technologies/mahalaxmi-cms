import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "pages") {
      const pages = await prisma.page.findMany({
        orderBy: { order: "asc" },
      });
      return NextResponse.json({ success: true, data: pages });
    }

    const config = await prisma.globalConfig.findFirst();
    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const body = await request.json();

    if (type === "pages") {
      const { slug, ...seoData } = body;
      if (!slug) {
        return NextResponse.json(
          { success: false, error: "slug is required" },
          { status: 400 }
        );
      }
      const updated = await prisma.page.upsert({
        where: { slug },
        create: {
          slug,
          title: seoData.title || slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          ...seoData,
        },
        update: seoData,
      });
      return NextResponse.json({ success: true, data: updated });
    }

    const updatedConfig = await prisma.globalConfig.upsert({
      where: { id: "global" },
      create: {
        id: "global",
        siteTitle: body.siteTitle || "Mahalaxmi Enterprises",
        siteDescription: body.siteDescription || "HP Lubricants Distributor",
        ...body,
      },
      update: body,
    });

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error("Error saving SEO config:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
