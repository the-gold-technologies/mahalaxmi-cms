import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const links = await prisma.navLink.findMany({
      orderBy: { order: "asc" },
    });

    // Deduplicate by normalized label to ensure clean navigation hierarchy without duplicate rows
    const seen = new Set<string>();
    const uniqueLinks = links.filter((l: any) => {
      const normalizedLabel = l.label.toLowerCase().trim();
      if (seen.has(normalizedLabel)) {
        return false;
      }
      seen.add(normalizedLabel);
      return true;
    });

    return NextResponse.json({ success: true, data: uniqueLinks });
  } catch (error) {
    console.error("Error fetching nav links:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { links } = body;

    if (!Array.isArray(links)) {
      return NextResponse.json(
        { success: false, error: "links array is required" },
        { status: 400 }
      );
    }

    // 1. Remove deleted links from database
    const incomingIds = links
      .filter((l: any) => l.id && !l.id.startsWith("nav-"))
      .map((l: any) => l.id);

    await prisma.navLink.deleteMany({
      where: {
        id: { notIn: incomingIds },
      },
    });

    // 2. Upsert existing & new links with updated order
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const navData = {
        label: link.label,
        title: link.title || link.label.toUpperCase(),
        url: link.url,
        type: link.type || "Main Link",
        parent: link.parent || "-",
        order: i,
      };

      if (link.id && !link.id.startsWith("nav-")) {
        await prisma.navLink.update({
          where: { id: link.id },
          data: navData,
        });
      } else {
        await prisma.navLink.create({
          data: navData,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating nav links:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
