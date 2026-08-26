import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
        sectionsMap[section.type] = section.content;
      }
    }

    const offices = await prisma.officeLocation.findMany({
      orderBy: { order: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        sections: sectionsMap,
        offices: offices || [],
      },
    });
  } catch (error) {
    console.error("Error fetching contact-us:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const page = await prisma.page.upsert({
      where: { slug: CONTACT_SLUG },
      create: {
        title: "Contact Us",
        slug: CONTACT_SLUG,
        type: "static",
        visibility: "published",
      },
      update: {},
    });

    // 1. Check if section-level update
    if (body.section && body.content !== undefined) {
      // If saving regional offices array into DB
      if (body.section === "RegionalOffices" && Array.isArray(body.content.offices)) {
        // Save section content
        const existing = await prisma.section.findFirst({
          where: { pageId: page.id, type: body.section },
        });

        if (existing) {
          await prisma.section.update({
            where: { id: existing.id },
            data: { content: body.content },
          });
        } else {
          await prisma.section.create({
            data: {
              pageId: page.id,
              type: body.section,
              content: body.content,
              order: 2,
            },
          });
        }

        // Also sync officeLocation table
        for (const off of body.content.offices) {
          const offData = {
            name: off.name,
            type: `${off.region} Regional Office`,
            address: off.address,
            phone: off.contactNo,
            email: off.email,
            contactPerson: off.contactName,
          };

          const existingOff = await prisma.officeLocation.findFirst({
            where: { name: off.name },
          });

          if (existingOff) {
            await prisma.officeLocation.update({
              where: { id: existingOff.id },
              data: offData,
            });
          } else {
            await prisma.officeLocation.create({
              data: offData,
            });
          }
        }

        return NextResponse.json({ success: true, message: "Directory saved" });
      }

      // Other sections (e.g. ContactHero, ContactHeadquarter)
      const existing = await prisma.section.findFirst({
        where: { pageId: page.id, type: body.section },
      });

      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { content: body.content },
        });
      } else {
        await prisma.section.create({
          data: {
            pageId: page.id,
            type: body.section,
            content: body.content,
          },
        });
      }

      return NextResponse.json({ success: true, message: "Section saved" });
    }

    if (body.office) {
      const { id, ...officeData } = body.office;
      if (id) {
        await prisma.officeLocation.update({
          where: { id },
          data: officeData,
        });
      } else {
        await prisma.officeLocation.create({
          data: officeData,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating contact-us:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.office) {
      const created = await prisma.officeLocation.create({
        data: body.office,
      });
      return NextResponse.json({ success: true, data: created });
    }
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  } catch (error) {
    console.error("Error creating depot office:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get("officeId");
    if (!officeId) {
      return NextResponse.json(
        { success: false, error: "officeId is required" },
        { status: 400 }
      );
    }
    await prisma.officeLocation.delete({
      where: { id: officeId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting depot office:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
