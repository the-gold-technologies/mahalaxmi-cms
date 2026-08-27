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
        offices: offices || [],
      },
      seo,
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
          where: { pageId: page.id, type: "RegionalOffices" },
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
              type: "RegionalOffices",
              content: body.content,
              order: 1,
            },
          });
        }

        // Sync individual offices
        const incomingOffices = body.content.offices;
        const incomingIds = incomingOffices.map((o: any) => o.id).filter(Boolean);

        if (incomingIds.length > 0) {
          await prisma.officeLocation.deleteMany({
            where: { id: { notIn: incomingIds } },
          });
        }

        for (let i = 0; i < incomingOffices.length; i++) {
          const off = incomingOffices[i];
          if (off.id && !off.id.startsWith("temp-") && !off.id.startsWith("office-")) {
            await prisma.officeLocation.upsert({
              where: { id: off.id },
              update: {
                name: off.name,
                type: off.type || "Branch Depot",
                address: off.address,
                phone: off.phone,
                email: off.email,
                contactPerson: off.contactPerson,
                mapUrl: off.mapUrl,
                order: i,
              },
              create: {
                id: off.id,
                name: off.name,
                type: off.type || "Branch Depot",
                address: off.address,
                phone: off.phone,
                email: off.email,
                contactPerson: off.contactPerson,
                mapUrl: off.mapUrl,
                order: i,
              },
            });
          } else {
            await prisma.officeLocation.create({
              data: {
                name: off.name,
                type: off.type || "Branch Depot",
                address: off.address,
                phone: off.phone,
                email: off.email,
                contactPerson: off.contactPerson,
                mapUrl: off.mapUrl,
                order: i,
              },
            });
          }
        }

        return NextResponse.json({ success: true });
      }

      // Generic section save
      const existing = await prisma.section.findFirst({
        where: { pageId: page.id, type: body.section },
      });

      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { content: body.content },
        });
      } else {
        const count = await prisma.section.count({ where: { pageId: page.id } });
        await prisma.section.create({
          data: {
            pageId: page.id,
            type: body.section,
            content: body.content,
            order: count,
          },
        });
      }

      return NextResponse.json({ success: true });
    }

    // 2. Full object update
    for (const [sectionType, content] of Object.entries(body)) {
      if (sectionType === "sections" || sectionType === "offices" || sectionType === "seo") continue;

      const existing = await prisma.section.findFirst({
        where: { pageId: page.id, type: sectionType },
      });

      if (existing) {
        await prisma.section.update({
          where: { id: existing.id },
          data: { content: content as any },
        });
      } else {
        const count = await prisma.section.count({ where: { pageId: page.id } });
        await prisma.section.create({
          data: {
            pageId: page.id,
            type: sectionType,
            content: content as any,
            order: count,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating contact-us sections:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
