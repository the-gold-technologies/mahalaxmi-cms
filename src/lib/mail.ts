import nodemailer from "nodemailer";

interface EnquiryEmailData {
  id?: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  product?: string | null;
  interestedIn?: string | null;
  budget?: string | null;
  message?: string | null;
  createdAt?: Date;
}

interface DistributorLeadEmailData {
  id?: string;
  name: string;
  firmName: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  existingBusiness?: string | null;
  annualTurnover?: string | null;
  experienceYears?: string | null;
  message?: string | null;
  createdAt?: Date;
}

/**
 * Creates and returns a configured Nodemailer transporter.
 * Returns null if SMTP host/user is missing or not configured.
 */
function getMailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || user === "smtp_username_placeholder") {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send an email notification when a new customer enquiry is received.
 */
export async function sendEnquiryNotificationEmail(data: EnquiryEmailData) {
  try {
    const transporter = getMailTransporter();
    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL || "admin@mahalaxmilubricants.com";
    const fromAddress =
      process.env.SMTP_FROM || "Mahalaxmi Enterprises <no-reply@mahalaxmilubricants.com>";

    if (!transporter) {
      console.log(
        "📧 [SMTP Notice] SMTP is not configured or using placeholders. Skipping email dispatch for Enquiry:",
        data.name
      );
      return { sent: false, reason: "SMTP not configured" };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #002b5c; padding: 16px 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">New Customer Enquiry</h2>
        </div>
        <div style="padding: 24px 20px; color: #374151;">
          <p style="font-size: 15px; margin-top: 0;">You have received a new inquiry from the Mahalaxmi Enterprises website:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; width: 35%; color: #6b7280;">Full Name:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${data.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Email Address:</td>
              <td style="padding: 10px 0; color: #111827;">${data.email || "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Phone Number:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${data.phone || "N/A"}</td>
            </tr>
            ${
              data.company
                ? `<tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Company / Firm:</td>
                    <td style="padding: 10px 0; color: #111827;">${data.company}</td>
                  </tr>`
                : ""
            }
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Product / Requirement:</td>
              <td style="padding: 10px 0; color: #D8232A; font-weight: bold;">${data.product || data.interestedIn || "General Inquiry"}</td>
            </tr>
            ${
              data.budget
                ? `<tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Budget:</td>
                    <td style="padding: 10px 0; color: #111827;">${data.budget}</td>
                  </tr>`
                : ""
            }
          </table>
          ${
            data.message
              ? `<div style="margin-top: 20px; padding: 14px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #002b5c;">
                  <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px;">Customer Note / Message:</strong>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #374151;">${data.message}</p>
                </div>`
              : ""
          }
        </div>
        <div style="padding: 14px 20px; background-color: #f9fafb; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
          Mahalaxmi Enterprises CMS &bull; Automated Lead Notification
        </div>
      </div>
    `;

    // 1. Admin Alert
    await transporter.sendMail({
      from: fromAddress,
      to: adminEmail,
      subject: `🔔 New Enquiry: ${data.name} - ${data.product || "Product Quote"}`,
      html: htmlContent,
    });

    // 2. Customer Confirmation (if valid customer email provided)
    if (data.email && !data.email.includes("noemail@")) {
      const customerAckHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <div style="background-color: #002b5c; padding: 16px 20px; border-radius: 6px 6px 0 0; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Thank You for Contacting Mahalaxmi Enterprises</h2>
          </div>
          <div style="padding: 24px 20px; color: #374151; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>${data.name}</strong>,</p>
            <p>We have received your enquiry regarding <strong>${data.product || "our products & lubricants"}</strong>.</p>
            <p>Our dedicated sales & technical team will review your requirement and reach out to you shortly at <strong>${data.phone || data.email}</strong>.</p>
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">Warm regards,<br><strong style="color: #002b5c;">Mahalaxmi Enterprises Team</strong><br>Authorized HPCL Lubricants & Greases Distributor</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: fromAddress,
        to: data.email,
        subject: `Enquiry Received: Mahalaxmi Enterprises`,
        html: customerAckHtml,
      }).catch((e) => console.error("Error sending customer acknowledgement email:", e));
    }

    return { sent: true };
  } catch (error) {
    console.error("Error in sendEnquiryNotificationEmail:", error);
    return { sent: false, error };
  }
}

/**
 * Send an email notification when a new Distribution Leaders / Dealership application is received.
 */
export async function sendDistributorLeadNotificationEmail(
  data: DistributorLeadEmailData
) {
  try {
    const transporter = getMailTransporter();
    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL || "admin@mahalaxmilubricants.com";
    const fromAddress =
      process.env.SMTP_FROM || "Mahalaxmi Enterprises <no-reply@mahalaxmilubricants.com>";

    if (!transporter) {
      console.log(
        "📧 [SMTP Notice] SMTP is not configured or using placeholders. Skipping email dispatch for Distributor Lead:",
        data.firmName
      );
      return { sent: false, reason: "SMTP not configured" };
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
        <div style="background-color: #D8232A; padding: 16px 20px; border-radius: 6px 6px 0 0; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;">New Distribution Leader Application</h2>
        </div>
        <div style="padding: 24px 20px; color: #374151;">
          <p style="font-size: 15px; margin-top: 0;">A new dealership / distributorship application has been submitted:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; width: 38%; color: #6b7280;">Firm / Company:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: bold; font-size: 15px;">${data.firmName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Applicant Name:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${data.name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Phone Number:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${data.phone}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Email Address:</td>
              <td style="padding: 10px 0; color: #111827;">${data.email}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Territory / Location:</td>
              <td style="padding: 10px 0; color: #111827; font-weight: 600;">${data.city}, ${data.state}</td>
            </tr>
            ${
              data.existingBusiness
                ? `<tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Existing Business:</td>
                    <td style="padding: 10px 0; color: #111827;">${data.existingBusiness}</td>
                  </tr>`
                : ""
            }
            ${
              data.annualTurnover
                ? `<tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Annual Turnover:</td>
                    <td style="padding: 10px 0; color: #111827;">${data.annualTurnover}</td>
                  </tr>`
                : ""
            }
            ${
              data.experienceYears
                ? `<tr style="border-bottom: 1px solid #f3f4f6;">
                    <td style="padding: 10px 0; font-weight: bold; color: #6b7280;">Industry Experience:</td>
                    <td style="padding: 10px 0; color: #111827;">${data.experienceYears} Years</td>
                  </tr>`
                : ""
            }
          </table>
          ${
            data.message
              ? `<div style="margin-top: 20px; padding: 14px; background-color: #f9fafb; border-radius: 6px; border-left: 4px solid #D8232A;">
                  <strong style="display: block; font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 6px;">Application Note / Territory Coverage:</strong>
                  <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #374151;">${data.message}</p>
                </div>`
              : ""
          }
        </div>
        <div style="padding: 14px 20px; background-color: #f9fafb; border-radius: 0 0 6px 6px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6;">
          Mahalaxmi Enterprises CMS &bull; Distribution Leaders Application
        </div>
      </div>
    `;

    // 1. Admin Alert
    await transporter.sendMail({
      from: fromAddress,
      to: adminEmail,
      subject: `💼 Dealership Application: ${data.firmName} (${data.city}, ${data.state})`,
      html: htmlContent,
    });

    // 2. Applicant Confirmation
    if (data.email && !data.email.includes("noemail@")) {
      const applicantAckHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #ffffff;">
          <div style="background-color: #002b5c; padding: 16px 20px; border-radius: 6px 6px 0 0; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Distributor Application Received</h2>
          </div>
          <div style="padding: 24px 20px; color: #374151; line-height: 1.6;">
            <p style="font-size: 15px; margin-top: 0;">Dear <strong>${data.name}</strong> (${data.firmName}),</p>
            <p>Thank you for expressing interest in joining our distribution network for HPCL lubricants and industrial greases.</p>
            <p>Our channel development manager will review your firm's details and get in touch with you regarding partnership opportunities in <strong>${data.city}, ${data.state}</strong>.</p>
            <p style="margin-top: 20px; font-size: 13px; color: #6b7280;">Warm regards,<br><strong style="color: #002b5c;">Mahalaxmi Enterprises</strong><br>Channel & Network Management</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: fromAddress,
        to: data.email,
        subject: `Application Acknowledged: Mahalaxmi Distribution Network`,
        html: applicantAckHtml,
      }).catch((e) => console.error("Error sending applicant acknowledgement email:", e));
    }

    return { sent: true };
  } catch (error) {
    console.error("Error in sendDistributorLeadNotificationEmail:", error);
    return { sent: false, error };
  }
}
