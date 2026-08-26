import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const BLOGS_SLUG = "blogs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const slug = searchParams.get("slug");
    const mode = searchParams.get("mode");

    if (id) {
      const blog = await prisma.blogPost.findUnique({ where: { id } });
      return NextResponse.json({ success: true, data: blog });
    }

    if (slug && slug !== BLOGS_SLUG) {
      const blog = await prisma.blogPost.findUnique({ where: { slug } });
      return NextResponse.json({ success: true, data: blog });
    }

    // 1. Fetch blogs list
    const blogs = await prisma.blogPost.findMany({
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch page sections for Blogs Hero
    const page = await prisma.page.findUnique({
      where: { slug: BLOGS_SLUG },
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
      data: {
        blogs,
        sections: sectionsMap,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, slug, ...rest } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: "Title and slug are required" },
        { status: 400 }
      );
    }

    const created = await prisma.blogPost.create({
      data: { title, slug, ...rest },
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Error creating blog:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    // Check if this is a section-level update (e.g. BlogsHero)
    if (body.section && body.content !== undefined) {
      const page = await prisma.page.upsert({
        where: { slug: BLOGS_SLUG },
        create: {
          title: "Technical Articles & Lubrication Insights",
          slug: BLOGS_SLUG,
          type: "static",
          visibility: "published",
        },
        update: {},
      });

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

    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required for update" },
        { status: 400 }
      );
    }

    const updated = await prisma.blogPost.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating blog:", error);
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
    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting blog:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
