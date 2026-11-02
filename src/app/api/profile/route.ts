import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { EMAIL_RE } from "@/lib/security";

import { cleanupObsoleteCloudinaryAssets } from "@/lib/cloudinaryCleanup";

export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 8;

async function getSessionUser() {
  const session = await auth();
  const sessionEmail = session?.user?.email;
  if (!sessionEmail) return null;
  return prisma.user.findUnique({ where: { email: sessionEmail } });
}

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ success: false, error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, currentPassword, newPassword, image } = body;

    const updateData: { name?: string; email?: string; password?: string; image?: string } = {};

    const trimmedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    const wantsEmailChange = !!trimmedEmail && trimmedEmail !== user.email;
    const wantsPasswordChange = typeof newPassword === "string" && !!newPassword.trim();

    // Sensitive changes (email / password) require the current password
    if (wantsEmailChange || wantsPasswordChange) {
      if (!currentPassword) {
        return NextResponse.json(
          {
            success: false,
            error: "Please enter your current password to change your email or password",
          },
          { status: 400 },
        );
      }
      const isMatch = user.password
        ? await bcrypt.compare(String(currentPassword), user.password)
        : false;
      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Current password is incorrect" },
          { status: 400 },
        );
      }
    }

    if (image !== undefined && image !== user.image) {
      updateData.image = image;
      cleanupObsoleteCloudinaryAssets(user.image, image).catch((err) =>
        console.error("Profile image cleanup error:", err),
      );
    }

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim().slice(0, 120);
    }

    if (wantsEmailChange) {
      if (!EMAIL_RE.test(trimmedEmail)) {
        return NextResponse.json(
          { success: false, error: "Please enter a valid email address" },
          { status: 400 },
        );
      }
      const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
      if (existing && existing.id !== user.id) {
        return NextResponse.json(
          { success: false, error: "This email address is already in use by another user" },
          { status: 400 },
        );
      }
      updateData.email = trimmedEmail;
    }

    if (wantsPasswordChange) {
      const trimmedNewPassword = newPassword.trim();
      if (trimmedNewPassword.length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
          },
          { status: 400 },
        );
      }
      updateData.password = await bcrypt.hash(trimmedNewPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "Profile and credentials updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
