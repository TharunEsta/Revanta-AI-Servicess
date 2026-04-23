type EmailTemplatePayload = {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  requirement?: string;
  message: string;
};

export const emailJsConfig = {
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY?.trim() ?? "",
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID?.trim() ?? "",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID?.trim() ?? ""
} as const;

function assertEmailJsConfig() {
  if (!emailJsConfig.publicKey || !emailJsConfig.serviceId || !emailJsConfig.templateId) {
    throw new Error("Email service is not configured. Please add the EmailJS public environment variables.");
  }
}

export async function sendEmailJsTemplate(payload: EmailTemplatePayload) {
  assertEmailJsConfig();

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      service_id: emailJsConfig.serviceId,
      template_id: emailJsConfig.templateId,
      user_id: emailJsConfig.publicKey,
      template_params: {
        name: payload.name,
        email: payload.email,
        company: payload.company ?? "",
        budget: payload.budget ?? "",
        requirement: payload.requirement ?? "",
        message: payload.message
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Unable to send your request right now.");
  }
}
