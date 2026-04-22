"use client";

import { useState } from "react";
import type { BusinessFormType } from "@/lib/business-forms";

type FieldOption = {
  label: string;
  value: string;
};

type FormField =
  | {
      name: string;
      label: string;
      type: "text" | "email" | "tel";
      placeholder?: string;
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "select";
      options: FieldOption[];
      required?: boolean;
    }
  | {
      name: string;
      label: string;
      type: "textarea";
      placeholder?: string;
      required?: boolean;
      rows?: number;
    };

type BusinessFormProps = {
  formType: BusinessFormType;
  title: string;
  description: string;
  submitLabel: string;
  fields: FormField[];
};

type FormState = {
  status: "idle" | "loading" | "success" | "error";
  message: string;
};

const initialStatus: FormState = {
  status: "idle",
  message: ""
};

function createInitialValues(fields: FormField[]) {
  const values: Record<string, string> = {};

  for (const field of fields) {
    values[field.name] = field.type === "select" ? field.options[0]?.value ?? "" : "";
  }

  values.website = "";
  return values;
}

export function BusinessForm({
  formType,
  title,
  description,
  submitLabel,
  fields
}: BusinessFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => createInitialValues(fields));
  const [state, setState] = useState<FormState>(initialStatus);

  function handleChange(name: string, value: string) {
    setValues((current) => ({
      ...current,
      [name]: value
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading", message: "Sending your request..." });

    try {
      const response = await fetch("/api/forms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          formType,
          ...values
        })
      });

      const payload = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit form.");
      }

      setState({
        status: "success",
        message: payload.message ?? "Request submitted successfully."
      });
      setValues(createInitialValues(fields));
    } catch (error) {
      setState({
        status: "error",
        message: error instanceof Error ? error.message : "Unable to submit form."
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-6 p-6 sm:p-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.22em] text-slate-500">{title}</p>
        <h3 className="font-[var(--font-display)] text-2xl font-semibold text-slate-950">
          {description}
        </h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const isFullWidth = field.type === "textarea";
          const className = isFullWidth ? "space-y-2 sm:col-span-2" : "space-y-2";

          if (field.type === "textarea") {
            return (
              <label key={field.name} className={className}>
                <span className="text-sm text-slate-600">{field.label}</span>
                <textarea
                  required={field.required}
                  name={field.name}
                  rows={field.rows ?? 6}
                  value={values[field.name] ?? ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>
            );
          }

          if (field.type === "select") {
            return (
              <label key={field.name} className={className}>
                <span className="text-sm text-slate-600">{field.label}</span>
                <select
                  required={field.required}
                  name={field.name}
                  value={values[field.name] ?? ""}
                  onChange={(event) => handleChange(field.name, event.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {field.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            );
          }

          return (
            <label key={field.name} className={className}>
              <span className="text-sm text-slate-600">{field.label}</span>
              <input
                required={field.required}
                type={field.type}
                name={field.name}
                value={values[field.name] ?? ""}
                onChange={(event) => handleChange(field.name, event.target.value)}
                placeholder={field.placeholder}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
              />
            </label>
          );
        })}
      </div>

      <label className="hidden">
        <span>Website</span>
        <input
          name="website"
          autoComplete="off"
          tabIndex={-1}
          value={values.website ?? ""}
          onChange={(event) => handleChange("website", event.target.value)}
        />
      </label>

      <button type="submit" className="button-primary w-full sm:w-auto">
        {state.status === "loading" ? "Sending..." : submitLabel}
      </button>

      {state.message ? (
        <p className={state.status === "error" ? "text-sm text-rose-600" : "text-sm text-emerald-600"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
