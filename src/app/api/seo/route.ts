import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupObsoleteCloudinaryAssets } from "@/lib/cloudinaryCleanup";

export const dynamic = "force-dynamic";

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

    // Company contact details are managed on the Contact Us page (Headquarter section);
    // serve them here so the header, privacy page and SEO schema use the same values.
    const contactPage = await prisma.page.findUnique({
      where: { slug: "contact-us" },
      include: { sections: { where: { type: "ContactHeadquarter" } } },
    });
    const hq = (contactPage?.sections?.[0]?.content || {}) as Record<string, any>;
    const data = config
      ? {
          ...config,
          phone: hq.phone || config.phone,
          email: hq.email || config.email,
          address: hq.address || config.address,
        }
      : config;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching SEO config:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
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
        return NextResponse.json({ success: false, error: "slug is required" }, { status: 400 });
      }

      const existingPage = await prisma.page.findUnique({ where: { slug } });

      const updated = await prisma.page.upsert({
        where: { slug },
        create: {
          slug,
          title:
            seoData.title ||
            slug.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          ...seoData,
        },
        update: seoData,
      });

      if (existingPage) {
        cleanupObsoleteCloudinaryAssets(existingPage, updated).catch((err) =>
          console.error("SEO page cleanup error:", err),
        );
      }

      return NextResponse.json({ success: true, data: updated });
    }

    const existingConfig = await prisma.globalConfig.findFirst({ where: { id: "global" } });

    // Merge partial socialLinks updates so saving one form never wipes other keys
    if (body.socialLinks && typeof body.socialLinks === "object") {
      const existingSocials =
        existingConfig?.socialLinks && typeof existingConfig.socialLinks === "object"
          ? existingConfig.socialLinks
          : {};
      body.socialLinks = { ...existingSocials, ...body.socialLinks };
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

    // Only compare fields this request actually changed, so saving unrelated settings
    // can never delete assets (like footer badges) stored in other fields
    if (existingConfig) {
      const changedKeys = Object.keys(body);
      const pick = (obj: any) => Object.fromEntries(changedKeys.map((k) => [k, obj?.[k]]));
      cleanupObsoleteCloudinaryAssets(pick(existingConfig), pick(body)).catch((err) =>
        console.error("Global SEO cleanup error:", err),
      );
    }

    // Also sync home page headingOptions, schema, and metaTitle/metaDescription
    if (
      body.headingOptions !== undefined ||
      body.siteTitle !== undefined ||
      body.siteDescription !== undefined ||
      body.schema !== undefined
    ) {
      await prisma.page.upsert({
        where: { slug: "home" },
        update: {
          ...(body.siteTitle !== undefined ? { metaTitle: body.siteTitle } : {}),
          ...(body.siteDescription !== undefined ? { metaDescription: body.siteDescription } : {}),
          ...(body.headingOptions !== undefined ? { headingOptions: body.headingOptions } : {}),
          ...(body.schema !== undefined ? { schema: body.schema } : {}),
        },
        create: {
          slug: "home",
          title: "Home",
          metaTitle: body.siteTitle,
          metaDescription: body.siteDescription,
          headingOptions: body.headingOptions,
          schema: body.schema,
          visibility: "published",
        },
      });
    }

    return NextResponse.json({ success: true, data: updatedConfig });
  } catch (error) {
    console.error("Error saving SEO config:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
