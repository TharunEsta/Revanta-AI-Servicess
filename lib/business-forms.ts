export type BusinessFormType =
  | "bookConsultation"
  | "contact"
  | "quoteRequest"
  | "reviewRequest";

export type FormSubmissionPayload = Record<string, string | boolean | undefined>;

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function requireField(value: string, message: string) {
  if (!value) {
    throw new Error(message);
  }
}

function requireEmail(value: string) {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    throw new Error("Please enter a valid email address.");
  }
}

function buildMessage(title: string, pairs: Array<[string, string]>) {
  return [title, "", ...pairs.flatMap(([label, value]) => [label, value || "Not provided", ""])].join(
    "\n"
  );
}

export function validateAndNormalizeFormPayload(
  formType: BusinessFormType,
  input: FormSubmissionPayload
) {
  const common = {
    name: normalizeString(input.name),
    email: normalizeString(input.email).toLowerCase(),
    company: normalizeString(input.company),
    phone: normalizeString(input.phone),
    service: normalizeString(input.service),
    budget: normalizeString(input.budget),
    message: normalizeString(input.message)
  };

  requireField(common.name, "Please enter your name.");
  requireField(common.email, "Please enter your email.");
  requireEmail(common.email);

  switch (formType) {
    case "bookConsultation": {
      const goals = normalizeString(input.goals);
      const preferredTime = normalizeString(input.preferredTime);
      requireField(goals, "Please tell us what you want to discuss.");

      return {
        templatePayload: {
          name: common.name,
          email: common.email,
          company: common.company,
          budget: common.budget,
          requirement: common.service || "Book Consultation",
          message: buildMessage("Book Consultation Request", [
            ["Company", common.company],
            ["Phone", common.phone],
            ["Service Interest", common.service],
            ["Budget", common.budget],
            ["Preferred Time", preferredTime],
            ["Consultation Goals", goals]
          ])
        },
        successMessage: "Consultation request sent successfully. Revanta AI will follow up soon."
      };
    }

    case "contact": {
      requireField(common.message, "Please add your project details.");

      return {
        templatePayload: {
          name: common.name,
          email: common.email,
          company: common.company,
          budget: common.budget,
          requirement: common.service || "Contact Form",
          message: buildMessage("Contact Form Submission", [
            ["Company", common.company],
            ["Phone", common.phone],
            ["Service", common.service],
            ["Budget", common.budget],
            ["Project Details", common.message]
          ])
        },
        successMessage: "Your message has been sent successfully."
      };
    }

    case "quoteRequest": {
      const industry = normalizeString(input.industry);
      const projectType = normalizeString(input.projectType);
      const timeline = normalizeString(input.timeline);
      const requirements = normalizeString(input.requirements);
      const aiOpportunities = normalizeString(input.aiOpportunities);
      requireField(projectType, "Please select a project type.");
      requireField(requirements, "Please describe your requirements.");

      return {
        templatePayload: {
          name: common.name,
          email: common.email,
          company: common.company || industry,
          budget: common.budget,
          requirement: projectType,
          message: buildMessage("Quote Request", [
            ["Company / Industry", common.company || industry],
            ["Project Type", projectType],
            ["Budget Direction", common.budget],
            ["Expected Timeline", timeline],
            ["Main Requirements", requirements],
            ["AI / Automation Opportunities", aiOpportunities]
          ])
        },
        successMessage: "Quote request sent successfully. We'll review it and get back to you."
      };
    }

    case "reviewRequest": {
      const role = normalizeString(input.role);
      const projectName = normalizeString(input.projectName);
      const completedService = normalizeString(input.completedService);
      const reviewNotes = normalizeString(input.reviewNotes);
      requireField(projectName, "Please enter the completed project name.");

      return {
        templatePayload: {
          name: common.name,
          email: common.email,
          company: common.company,
          budget: "",
          requirement: "Future Review Request",
          message: buildMessage("Future Review Request", [
            ["Company", common.company],
            ["Role", role],
            ["Completed Service", completedService],
            ["Project Name", projectName],
            ["Additional Notes", reviewNotes]
          ])
        },
        successMessage: "Review request sent successfully. Revanta AI will follow up when needed."
      };
    }
  }
}
