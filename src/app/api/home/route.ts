import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cleanupObsoleteCloudinaryAssets } from "@/lib/cloudinaryCleanup";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HOME_SLUG = "home";

export async function GET() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: HOME_SLUG },
      include: {
        sections: {
          orderBy: { order: "asc" },
        },
      },
    });

    if (!page) {
      return NextResponse.json({ success: true, data: {}, seo: null });
    }

    const sectionsMap: Record<string, any> = {};
    for (const section of page.sections) {
      sectionsMap[section.type] = section.content;
    }

    // SEO object outside data
    const seo = {
      title: page.metaTitle || page.title,
      metaTitle: page.metaTitle || page.title,
      metaDescription: page.metaDescription,
      targetKeywords: page.targetKeywords,
      canonicalUrl: page.canonicalUrl,
      noIndex: page.noIndex,
      schema: page.schema,
      headingOptions: page.headingOptions,
    };

    return NextResponse.json({ success: true, data: sectionsMap, seo });
  } catch (error) {
    console.error("Error fetching home page content:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const sectionName = body.section || body.sectionType;
    const { content } = body;

    const page = await prisma.page.upsert({
      where: { slug: HOME_SLUG },
      create: {
        title: "Home",
        slug: HOME_SLUG,
        type: "static",
        visibility: "published",
      },
      update: {},
    });

    const sectionsToSave: Record<string, any> = {};
    if (sectionName && content !== undefined) {
      sectionsToSave[sectionName] = content;
    } else if (body.sections && typeof body.sections === "object") {
      Object.assign(sectionsToSave, body.sections);
    } else if (typeof body === "object") {
      for (const [key, val] of Object.entries(body)) {
        if (key !== "seo" && key !== "section" && key !== "sectionType" && key !== "content") {
          sectionsToSave[key] = val;
        }
      }
    }

    if (Object.keys(sectionsToSave).length === 0) {
      return NextResponse.json(
        { success: false, error: "'section' or 'sections' is required" },
        { status: 400 },
      );
    }

    for (const [sName, sContent] of Object.entries(sectionsToSave)) {
      const existingSection = await prisma.section.findFirst({
        where: {
          pageId: page.id,
          type: sName,
        },
      });

      if (existingSection) {
        await prisma.section.update({
          where: { id: existingSection.id },
          data: { content: sContent as any },
        });
        cleanupObsoleteCloudinaryAssets(existingSection.content, sContent).catch((err) =>
          console.error("Cleanup error:", err),
        );
      } else {
        const highestOrder = await prisma.section.aggregate({
          where: { pageId: page.id },
          _max: { order: true },
        });
        const newOrder = (highestOrder._max.order ?? -1) + 1;

        await prisma.section.create({
          data: {
            pageId: page.id,
            type: sName,
            content: sContent as any,
            order: newOrder,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving home section:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
