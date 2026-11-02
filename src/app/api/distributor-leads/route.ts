import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDistributorLeadNotificationEmail } from "@/lib/mail";
import {
  requireAdmin,
  rateLimit,
  getClientIp,
  verifyCaptcha,
  cleanString,
  EMAIL_RE,
  PHONE_RE,
  SUBMISSION_STATUSES,
} from "@/lib/security";

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const leads = await prisma.distributorApplication.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, data: leads });
  } catch (error) {
    console.error("Error fetching distributor leads:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(`lead:${ip}`, 3, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many submissions. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    const body = await request.json();

    if (body?.website) {
      return NextResponse.json({ success: true });
    }

    if (!(await verifyCaptcha(body?.captchaToken, ip))) {
      return NextResponse.json(
        { success: false, error: "Captcha verification failed. Please try again." },
        { status: 400 },
      );
    }

    const name = cleanString(body.name, 120);
    const firmName = cleanString(body.firmName, 200);
    const email = cleanString(body.email, 200);
    const phone = cleanString(body.phone, 20);
    const city = cleanString(body.city, 100);
    const state = cleanString(body.state, 100);
    const existingBusiness = cleanString(body.existingBusiness, 300);
    const annualTurnover = cleanString(body.annualTurnover, 100);
    const experienceYears = cleanString(body.experienceYears, 20);
    const message = cleanString(body.message, 3000);

    if (!name || !firmName || !phone) {
      return NextResponse.json(
        { success: false, error: "Name, firm name, and phone number are required" },
        { status: 400 },
      );
    }
    if (!PHONE_RE.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid phone number" },
        { status: 400 },
      );
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 },
      );
    }

    const created = await prisma.distributorApplication.create({
      data: {
        name,
        firmName,
        email: email || "noemail@provided.com",
        phone,
        city: city || "N/A",
        state: state || "N/A",
        existingBusiness,
        annualTurnover,
        experienceYears,
        message,
        status: "Pending",
      },
    });

    sendDistributorLeadNotificationEmail(created).catch((mailErr) => {
      console.error("Async email dispatch failed for distributor lead:", mailErr);
    });

    return NextResponse.json({ success: true, data: { id: created.id } });
  } catch (error) {
    console.error("Error submitting distributor lead:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, error: "id and status are required" },
        { status: 400 },
      );
    }
    if (!SUBMISSION_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, error: `status must be one of: ${SUBMISSION_STATUSES.join(", ")}` },
        { status: 400 },
      );
    }

    const updated = await prisma.distributorApplication.update({
      where: { id: String(id) },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating lead status:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "id is required" }, { status: 400 });
    }

    await prisma.distributorApplication.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
