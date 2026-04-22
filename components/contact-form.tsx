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

export function ContactForm() {
  const [state, setState] = useState<FormState>(initialState);

  async function handleSubmit(formData: FormData) {
    setState({ status: "loading", message: "Sending your project details..." });

    const payload = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Unable to submit right now.");
      }

      setState({
        status: "success",
        message: "Your request has been received. Revanta AI will follow up soon."
      });
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Something went wrong."
      });
    }
  }

  return (
    <form action={handleSubmit} className="panel space-y-5 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Name</span>
          <input
            required
            name="name"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Your name"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Email</span>
          <input
            required
            name="email"
            type="email"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="you@company.com"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Company</span>
          <input
            name="company"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="Company name"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Phone</span>
          <input
            name="phone"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            placeholder="+91 90000 00000"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Service</span>
          <select
            name="service"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            defaultValue="AI Automation"
          >
            <option>AI Automation</option>
            <option>SaaS Development</option>
            <option>Mobile App Development</option>
            <option>Web Development</option>
            <option>Custom Software</option>
            <option>CRM / ERP Solutions</option>
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm text-slate-600">Budget</span>
          <select
            name="budget"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            defaultValue="INR 1L - INR 3L"
          >
            <option>INR 1L - INR 3L</option>
            <option>INR 3L - INR 5L</option>
            <option>INR 5L - INR 10L</option>
            <option>INR 10L+</option>
          </select>
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm text-slate-600">Project details</span>
        <textarea
          required
          name="message"
          rows={6}
          className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
          placeholder="Tell us what you want to build, your current bottlenecks, and the timeline."
        />
      </label>

      <button type="submit" className="button-primary w-full sm:w-auto">
        {state.status === "loading" ? "Sending..." : "Start Project"}
      </button>

      {state.message ? (
        <p
          className={
            state.status === "error" ? "text-sm text-rose-600" : "text-sm text-emerald-600"
          }
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
