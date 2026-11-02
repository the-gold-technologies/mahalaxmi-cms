import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEnquiryNotificationEmail } from "@/lib/mail";
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

export async function GET(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const limitParam = parseInt(searchParams.get("limit") || "", 10);
    const take =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : undefined;

    const enquiries = await prisma.enquiry.findMany({
      orderBy: { createdAt: "desc" },
      ...(take ? { take } : {}),
    });

    return NextResponse.json({ success: true, data: enquiries });
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    if (!rateLimit(`enquiry:${ip}`, 5, 10 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many submissions. Please try again in a few minutes." },
        { status: 429 },
      );
    }

    const body = await request.json();

    // Honeypot: real users never fill this hidden field
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
    const rawEmail = cleanString(body.email, 200);
    const email = rawEmail && rawEmail !== "noemail@provided.com" ? rawEmail : null;
    const phone = cleanString(body.phone, 20);
    const company = cleanString(body.company, 200);
    const interestedIn = cleanString(body.interestedIn, 200);
    const product = cleanString(body.product, 300);
    const budget = cleanString(body.budget, 100);
    const message = cleanString(body.message, 3000);

    if (!name || (!email && !phone)) {
      return NextResponse.json(
        {
          success: false,
          error: "Name and at least one contact method (email or phone) are required",
        },
        { status: 400 },
      );
    }
    if (email && !EMAIL_RE.test(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 },
      );
    }
    if (phone && !PHONE_RE.test(phone)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid phone number" },
        { status: 400 },
      );
    }

    const created = await prisma.enquiry.create({
      data: {
        name,
        email: email || "noemail@provided.com",
        phone,
        company,
        interestedIn,
        product: product || interestedIn,
        budget,
        message,
        status: "Pending",
      },
    });

    // Fire email notifications asynchronously without blocking the response
    sendEnquiryNotificationEmail(created).catch((mailErr) => {
      console.error("Async email dispatch failed for enquiry:", mailErr);
    });

    return NextResponse.json({ success: true, data: { id: created.id } });
  } catch (error) {
    console.error("Error submitting enquiry:", error);
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

    const updated = await prisma.enquiry.update({
      where: { id: String(id) },
      data: { status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating enquiry:", error);
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

    await prisma.enquiry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting enquiry:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
