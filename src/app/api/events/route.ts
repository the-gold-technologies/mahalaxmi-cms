import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleSectionsPut } from "@/lib/pageSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const EVENTS_SLUG = "events";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug && slug !== EVENTS_SLUG) {
      const event = await prisma.event.findUnique({ where: { slug } });
      return NextResponse.json({ success: true, data: event, seo: null });
    }

    // 1. Fetch static Page Sections for events page
    const page = await prisma.page.findUnique({
      where: { slug: EVENTS_SLUG },
      include: { sections: true },
    });

    const sectionsMap: Record<string, any> = {};
    if (page?.sections) {
      for (const section of page.sections) {
        sectionsMap[section.type] = section.content;
      }
    }

    const seo = page
      ? {
          title: page.metaTitle || page.title,
          metaTitle: page.metaTitle || page.title,
          metaDescription: page.metaDescription,
          targetKeywords: page.targetKeywords,
          canonicalUrl: page.canonicalUrl,
          noIndex: page.noIndex,
          schema: page.schema,
          headingOptions: page.headingOptions,
        }
      : null;

    return NextResponse.json({
      success: true,
      data: sectionsMap,
      seo,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  return handleSectionsPut(body, EVENTS_SLUG, { title: "Events & Activities" }, []);
}
