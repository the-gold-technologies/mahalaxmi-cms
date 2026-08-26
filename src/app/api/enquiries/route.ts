import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit");

    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      ...(limit ? { take: parseInt(limit, 10) } : {}),
    });

    return NextResponse.json({ success: true, data: enquiries });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const created = await prisma.enquiry.create({
      data: body,
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error("Error submitting enquiry:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "id and status are required" },
        { status: 400 }
      );
    }

    const updated = await prisma.enquiry.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating enquiry:", error);
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

    await prisma.enquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
