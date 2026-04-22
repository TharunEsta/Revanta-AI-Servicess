"use client";

import { useState } from "react";

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

const initialState: FormState = {
  status: "idle",
  message: ""
};

const serviceOptions = [
  "AI Automation",
  "SaaS Development",
  "Mobile App Development",
  "Web Development",
  "Custom Software",
  "CRM / ERP Solutions"
];

const projectOptions = [
  "Website build",
  "Automation system",
  "SaaS product",
  "Mobile app",
  "Internal tool",
  "CRM / ERP implementation"
];

export function ReviewForm() {
  const [selectedRating, setSelectedRating] = useState(5);
  const [state, setState] = useState<FormState>(initialState);

  async function handleSubmit(formData: FormData) {
    formData.set("rating", String(selectedRating));
    setState({ status: "loading", message: "Submitting review for moderation..." });

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(Object.fromEntries(formData.entries()))
      });

      const payload = (await response.json()) as { error?: string; ok?: boolean; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit review.");
      }

      setState({
        status: "success",
        message: payload.message ?? "Review submitted and waiting for admin approval."
      });

      const form = document.getElementById("review-form") as HTMLFormElement | null;
      form?.reset();
      setSelectedRating(5);
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to submit review."
      });
    }
  }

  return (
    <form id="review-form" action={handleSubmit} className="panel space-y-6 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Full Name</span>
          <input
            required
            name="fullName"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Client full name"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Company Name</span>
          <input
            required
            name="companyName"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Company name"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Role / Position</span>
          <input
            required
            name="role"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Founder, Operations Lead, Product Manager"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Email</span>
          <input
            required
            type="email"
            name="email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="client@company.com"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Service Used</span>
          <select
            required
            name="serviceUsed"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            defaultValue={serviceOptions[0]}
          >
            {serviceOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Project Type</span>
          <select
            required
            name="projectType"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            defaultValue={projectOptions[0]}
          >
            {projectOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <span className="text-sm text-slate-600">Star Rating</span>
        <div className="flex flex-wrap gap-3">
          {Array.from({ length: 5 }, (_, index) => {
            const rating = index + 1;

            return (
              <button
                key={rating}
                type="button"
                onClick={() => setSelectedRating(rating)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  selectedRating === rating
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400"
                }`}
              >
                {rating} Star{rating > 1 ? "s" : ""}
              </button>
            );
          })}
        </div>
      </div>

      <label className="hidden">
        <span>Website</span>
        <input name="website" autoComplete="off" tabIndex={-1} />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-slate-600">Written Review</span>
        <textarea
          required
          name="reviewText"
          rows={7}
          minLength={40}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          placeholder="Share your experience working with Revanta AI, the quality of delivery, and the outcome achieved."
        />
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
        <input
          required
          type="checkbox"
          name="permissionToPublish"
          value="true"
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>I confirm this review is genuine and I give permission for Revanta AI to publish it publicly after approval.</span>
      </label>

      <button type="submit" className="button-primary">
        {state.status === "loading" ? "Submitting..." : "Submit Review"}
      </button>

      {state.message ? (
        <p className={state.status === "error" ? "text-sm text-rose-600" : "text-sm text-emerald-600"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
