import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleSectionsPut } from "@/lib/pageSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const ABOUT_SLUG = "about-us";

export async function GET() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: ABOUT_SLUG },
      include: { sections: true },
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
    console.error("Error fetching about-us:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  return handleSectionsPut(body, ABOUT_SLUG, { title: "About Us" }, []);
}
