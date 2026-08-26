import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const EVENTS_SLUG = "events";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");

    if (slug && slug !== EVENTS_SLUG) {
      const event = await prisma.event.findUnique({ where: { slug } });
      return NextResponse.json({ success: true, data: event });
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

    return NextResponse.json({
      success: true,
      data: sectionsMap,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // 1. Ensure the Events Page exists
    const page = await prisma.page.upsert({
      where: { slug: EVENTS_SLUG },
      create: {
        title: "Events & Activities",
        slug: EVENTS_SLUG,
        type: "static",
        visibility: "published",
      },
      update: {},
    });

    let sectionsToSave: Record<string, any> = {};

    if (body.section && body.content !== undefined) {
      sectionsToSave[body.section] = body.content;
    } else if (body.sections && typeof body.sections === "object") {
      sectionsToSave = body.sections;
    } else {
      sectionsToSave = body;
    }

    for (const [sectionType, content] of Object.entries(sectionsToSave)) {
      if (
        sectionType === "sections" ||
        sectionType === "section" ||
        sectionType === "content"
      )
        continue;

      const existing = await prisma.section.findFirst({
        where: { pageId: page.id, type: sectionType },
      });

      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { content: content as any },
        });
      } else {
        await prisma.section.create({
          data: {
            pageId: page.id,
            type: sectionType,
            content: content as any,
          },
        });
      }
    }

    return NextResponse.json({ success: true, message: "Saved successfully" });
  } catch (error) {
    console.error("Error updating events section:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await prisma.event.create({ data: body });
    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Error creating event:", error);
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
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }
    await prisma.event.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
