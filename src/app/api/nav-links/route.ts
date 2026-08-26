import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const links = await prisma.navLink.findMany({
      orderBy: { order: "asc" },
    });
    return NextResponse.json({ success: true, data: links });
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
