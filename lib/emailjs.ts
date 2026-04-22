type EmailTemplatePayload = {
  name: string;
  email: string;
  company?: string;
  budget?: string;
  requirement?: string;
  message: string;
};

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

export const emailJsConfig = {
  publicKey:
    getEnv("EMAILJS_PUBLIC_KEY") ||
    getEnv("NEXT_PUBLIC_EMAILJS_PUBLIC_KEY") ||
    "jAlfgHRCxsV2_Mlrb",
  serviceId:
    getEnv("EMAILJS_SERVICE_ID") ||
    getEnv("NEXT_PUBLIC_EMAILJS_SERVICE_ID") ||
    "service_adwk38d",
  templateId:
    getEnv("EMAILJS_TEMPLATE_ID") ||
    getEnv("NEXT_PUBLIC_EMAILJS_TEMPLATE_ID") ||
    "template_mvlzwoj"
} as const;

export async function sendEmailJsTemplate(payload: EmailTemplatePayload) {
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
    throw new Error(errorText || "EmailJS request failed.");
  }
}
