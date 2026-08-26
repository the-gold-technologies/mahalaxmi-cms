import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
      return NextResponse.json({ success: true, data: {} });
    }

    const sectionsMap: Record<string, any> = {};
    for (const section of page.sections) {
      sectionsMap[section.type] = section.content;
    }

    return NextResponse.json({ success: true, data: sectionsMap });
  } catch (error) {
    console.error("Error fetching home page content:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const sectionName = body.section || body.sectionType;
    const { content } = body;

    if (!sectionName || typeof sectionName !== "string") {
      return NextResponse.json(
        { success: false, error: "'section' or 'sectionType' (string) is required" },
        { status: 400 }
      );
    }

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

    const existingSection = await prisma.section.findFirst({
      where: { pageId: page.id, type: sectionName },
    });

    let savedSection;
    if (existingSection) {
      savedSection = await prisma.section.update({
        where: { id: existingSection.id },
        data: { content },
      });
    } else {
      const sectionCount = await prisma.section.count({
        where: { pageId: page.id },
      });
      savedSection = await prisma.section.create({
        data: {
          pageId: page.id,
          type: sectionName,
          content,
          order: sectionCount,
        },
      });
    }

    return NextResponse.json({ success: true, data: savedSection });
  } catch (error) {
    console.error("Error saving home page section:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
