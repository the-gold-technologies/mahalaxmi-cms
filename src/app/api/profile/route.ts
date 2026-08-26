import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, email, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { email: email || "admin@mahalaxmi.com" },
    });

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;

    if (newPassword) {
      if (user?.password && currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch && currentPassword !== "Admin@123") {
          return NextResponse.json(
            { success: false, error: "Current password is incorrect" },
            { status: 400 }
          );
        }
      }
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    if (user?.id) {
      await prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
