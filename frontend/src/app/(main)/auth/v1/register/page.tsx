"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, GraduationCap, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,72}$/;

const schema = z.object({
  schoolName: z.string().min(2, "School name is required").max(255),
  schoolEmail: z.string().email("Enter a valid email"),
  schoolPhone: z.string().optional(),
  address: z.string().max(1000).optional(),
  adminFirstName: z.string().min(1, "First name is required").max(100),
  adminLastName: z.string().min(1, "Last name is required").max(100),
  adminEmail: z.string().email("Enter a valid admin email"),
  adminPassword: z.string().regex(passwordRegex, "Password does not meet requirements"),
  adminPhone: z.string().max(20).optional(),
});
type FormValues = z.infer<typeof schema>;

type RegisterErrorCode = "TENANT_EMAIL_EXISTS" | "ADMIN_EMAIL_EXISTS" | "TENANT_SLUG_EXISTS";

const ERROR_MAP: Record<RegisterErrorCode, string> = {
  TENANT_EMAIL_EXISTS: "This school email is already registered.",
  ADMIN_EMAIL_EXISTS: "An admin account with this email already exists.",
  TENANT_SLUG_EXISTS: "This school name is already taken.",
};

export default function RegisterPage() {
  const [showPw, setShowPw] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      schoolName: "",
      schoolEmail: "",
      schoolPhone: "",
      address: "",
      adminFirstName: "",
      adminLastName: "",
      adminEmail: "",
      adminPassword: "",
      adminPhone: "",
    },
  });

  const passwordVal = watch("adminPassword") || "";
  const pwRules = [
    { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
    { label: "At least one uppercase letter", test: (v: string) => /[A-Z]/.test(v) },
    { label: "At least one number", test: (v: string) => /\d/.test(v) },
    { label: "At least one special character (!@#$%^&*...)", test: (v: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(v) },
    { label: "Maximum 72 characters", test: (v: string) => v.length <= 72 },
  ];

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/v1/tenants/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw data;
      }

      setIsSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      const code = err?.code as RegisterErrorCode | undefined;
      setApiError(
        (code && ERROR_MAP[code]) || err?.message || "Registration failed. Please check your details and try again."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background font-sans relative">
      {/* Subtle background pattern/gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <main className="relative mx-auto w-full max-w-2xl px-6 py-10 md:py-16">
        <header className="mb-10 text-center flex flex-col items-center">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] ds-accent-bg">
              <GraduationCap size={22} className="text-white" />
            </div>
            <span className="text-2xl font-semibold text-foreground">
              EduAdmin
            </span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">
            Start your free trial
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            Register your school and get started in minutes. No credit card required.
          </p>
        </header>

        {isSuccess ? (
          <div className="rounded-xl border border-success bg-success/10 p-6 text-center">
            <CheckCircle2 size={48} className="mx-auto mb-4 text-success" />
            <h2 className="mb-2 text-xl font-semibold text-success">Registration Successful!</h2>
            <p className="mb-6 text-sm text-foreground/80">
              Your school account has been created on a free TRIAL plan. Please log in with your admin credentials.
            </p>
            <Link
              href="/auth/v1/login"
              className="inline-flex w-full md:w-auto items-center justify-center rounded-lg ds-accent-bg px-8 py-3 font-semibold text-white transition-all hover:brightness-110"
            >
              Go to Login &rarr;
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-sm">
              {apiError && (
                <div
                  role="alert"
                  className="mb-8 flex items-start gap-3 rounded-lg border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
                  <span>{apiError}</span>
                </div>
              )}

              {/* SECTION A: School Information */}
              <div className="mb-6">
                <div className="ds-label">School Information</div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Field label="School Name" error={errors.schoolName?.message}>
                      <input
                        type="text"
                        placeholder="Greenwood High School"
                        {...register("schoolName")}
                        className={inputClasses(!!errors.schoolName)}
                      />
                    </Field>
                  </div>
                  <Field label="School Email" error={errors.schoolEmail?.message}>
                    <input
                      type="email"
                      placeholder="info@school.com"
                      {...register("schoolEmail")}
                      className={inputClasses(!!errors.schoolEmail)}
                    />
                  </Field>
                  <Field label="School Phone (Optional)" error={errors.schoolPhone?.message}>
                    <input
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      {...register("schoolPhone")}
                      className={inputClasses(!!errors.schoolPhone)}
                    />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Address (Optional)" error={errors.address?.message}>
                      <textarea
                        placeholder="123 School Lane, Dhaka"
                        {...register("address")}
                        className={cn(inputClasses(!!errors.address), "h-20 resize-none")}
                      />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="my-8 h-px w-full bg-border" />

              {/* SECTION B: Admin Account */}
              <div>
                <div className="ds-label">Admin Account</div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="First Name" error={errors.adminFirstName?.message}>
                    <input
                      type="text"
                      placeholder="Rahim"
                      {...register("adminFirstName")}
                      className={inputClasses(!!errors.adminFirstName)}
                    />
                  </Field>
                  <Field label="Last Name" error={errors.adminLastName?.message}>
                    <input
                      type="text"
                      placeholder="Uddin"
                      {...register("adminLastName")}
                      className={inputClasses(!!errors.adminLastName)}
                    />
                  </Field>
                  <Field label="Admin Email" error={errors.adminEmail?.message}>
                    <input
                      type="email"
                      placeholder="admin@greenwood.edu.bd"
                      {...register("adminEmail")}
                      className={inputClasses(!!errors.adminEmail)}
                    />
                  </Field>
                  <Field label="Admin Phone (Optional)" error={errors.adminPhone?.message}>
                    <input
                      type="tel"
                      placeholder="+880 1XXX-XXXXXX"
                      {...register("adminPhone")}
                      className={inputClasses(!!errors.adminPhone)}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Password">
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          placeholder="Create a strong password"
                          {...register("adminPassword")}
                          className={cn(inputClasses(!!errors.adminPassword), "pr-11")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </Field>
                    <div className="mt-3 space-y-1.5 rounded-lg bg-background/50 p-3 text-xs text-muted-foreground">
                      <p className="mb-2 font-medium">Password Requirements:</p>
                      {pwRules.map((rule, idx) => {
                        const passed = rule.test(passwordVal);
                        return (
                          <div
                            key={idx}
                            className={cn(
                              "flex items-center gap-2 transition-colors",
                              passed ? "text-success" : ""
                            )}
                          >
                            {passed ? (
                              <CheckCircle2 size={14} className="text-success" />
                            ) : (
                              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 ml-1 mr-1" />
                            )}
                            <span>{rule.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <SubmitButton
                disabled={!isValid || submitting}
                loading={submitting}
                idleLabel="Register School & Create Admin Account"
                loadingLabel="Creating your account..."
              />
              <p className="mt-6 text-sm text-muted-foreground text-center">
                Already have an account?{" "}
                <Link href="/auth/v1/login" className="font-medium text-primary hover:underline">
                  Sign in &rarr;
                </Link>
                <br />
                <span className="mt-2 block text-xs text-muted-foreground/70">
                  By registering, your account starts on a free TRIAL plan.
                </span>
              </p>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs text-destructive">{error}</span>}
    </label>
  );
}

function inputClasses(hasError: boolean) {
  return cn(
    "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 text-sm outline-none transition-colors",
    "placeholder:text-muted-foreground focus:border-primary",
    hasError && "border-destructive focus:border-destructive"
  );
}

function SubmitButton({
  disabled,
  loading,
  idleLabel,
  loadingLabel,
}: {
  disabled?: boolean;
  loading?: boolean;
  idleLabel: string;
  loadingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className={cn(
        "flex w-full sm:w-auto min-w-[280px] items-center justify-center gap-2 rounded-[10px] px-8 py-4 text-base font-semibold transition-all duration-150",
        disabled
          ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
          : "ds-accent-bg border border-transparent text-white hover:brightness-110 shadow-lg shadow-primary/20"
      )}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {loading ? loadingLabel : idleLabel}
    </button>
  );
}
