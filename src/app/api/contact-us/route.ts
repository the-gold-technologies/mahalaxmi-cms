import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleSectionsPut } from "@/lib/pageSections";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONTACT_SLUG = "contact-us";

export async function GET() {
  try {
    const page = await prisma.page.findUnique({
      where: { slug: CONTACT_SLUG },
      include: { sections: true },
    });

    const sectionsMap: Record<string, any> = {};
    if (page?.sections) {
      for (const section of page.sections) {
        if (section.type !== "RegionalOffices") {
          sectionsMap[section.type] = section.content;
        }
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
      data: {
        sections: sectionsMap,
      },
      seo,
    });
  } catch (error) {
    console.error("Error fetching contact-us:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json().catch(() => null);
  return handleSectionsPut(body, CONTACT_SLUG, { title: "Contact Us" }, [
    "offices",
    "RegionalOffices",
  ]);
}
