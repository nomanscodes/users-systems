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
  email: z.string().email("Enter a valid email"),
  phone: z.string().max(20).optional(),
  address: z.string().max(1000).optional(),
  password: z.string().regex(passwordRegex, "Password does not meet requirements"),
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
      email: "",
      phone: "",
      address: "",
      password: "",
    },
  });

  const passwordVal = watch("password") || "";
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
    <div className="flex min-h-screen font-sans bg-background">
      {/* Left panel (matches Login page exactly) */}
      <aside className="relative hidden w-2/5 flex-col items-center justify-center overflow-hidden p-12 md:flex ds-accent-bg">
        <div className="absolute left-12 top-16 h-3 w-3 rounded-full bg-white/30" />
        <div className="absolute right-20 top-1/3 h-5 w-5 rounded-full bg-white/20" />
        <div className="absolute bottom-24 left-1/3 h-4 w-4 rounded-full bg-white/25" />
        <GraduationCap size={48} className="text-white" strokeWidth={1.5} />
        <h1 className="mt-6 text-center text-4xl font-light leading-tight text-white">
          Join EduAdmin
        </h1>
        <p className="mt-3 text-center text-lg text-white/80">
          Start your free trial today
        </p>
      </aside>

      {/* Right panel */}
      <main className="flex w-full flex-col items-center justify-center px-6 py-10 md:w-3/5">
        <div className="w-full max-w-[480px]">
          {/* Brand */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-[8px] ds-accent-bg">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">
              EduAdmin
            </span>
          </div>

          {isSuccess ? (
            <div className="rounded-xl border border-success bg-success/10 p-6 text-center">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-success" />
              <h2 className="mb-2 text-xl font-semibold text-success">Registration Successful!</h2>
              <p className="mb-6 text-sm text-foreground/80">
                Your school account has been created on a free TRIAL plan. Please log in to get started.
              </p>
              <Link
                href="/auth/v1/login"
                className="inline-flex w-full items-center justify-center rounded-[10px] ds-accent-bg px-6 py-3.5 text-base font-semibold text-white transition-all hover:brightness-110"
              >
                Go to Login &rarr;
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-foreground">
                Register your school
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Set up your school profile in minutes. No credit card required.
              </p>

              {apiError && (
                <div
                  role="alert"
                  className="mt-6 flex items-start gap-3 rounded-lg px-4 py-3 text-sm bg-destructive/10 border border-destructive text-destructive"
                >
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-destructive" />
                  <span>{apiError}</span>
                </div>
              )}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-6 space-y-5"
                noValidate
              >
                <Field label="School Name" error={errors.schoolName?.message}>
                  <input
                    type="text"
                    placeholder="Green Valley High"
                    {...register("schoolName")}
                    className={cn(
                      "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 text-sm outline-none transition-colors",
                      "placeholder:text-muted-foreground focus:border-primary",
                      errors.schoolName && "border-destructive focus:border-destructive"
                    )}
                  />
                </Field>

                <Field label="Email Address" error={errors.email?.message}>
                  <input
                    type="email"
                    placeholder="contact@greenvalley.edu"
                    {...register("email")}
                    className={cn(
                      "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 text-sm outline-none transition-colors",
                      "placeholder:text-muted-foreground focus:border-primary",
                      errors.email && "border-destructive focus:border-destructive"
                    )}
                  />
                </Field>

                <Field label="Phone (Optional)" error={errors.phone?.message}>
                  <input
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    {...register("phone")}
                    className={cn(
                      "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 text-sm outline-none transition-colors",
                      "placeholder:text-muted-foreground focus:border-primary",
                      errors.phone && "border-destructive focus:border-destructive"
                    )}
                  />
                </Field>

                <Field label="Address (Optional)" error={errors.address?.message}>
                  <textarea
                    placeholder="123 Education Lane, Dhaka"
                    {...register("address")}
                    className={cn(
                      "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 text-sm outline-none transition-colors resize-none h-20",
                      "placeholder:text-muted-foreground focus:border-primary",
                      errors.address && "border-destructive focus:border-destructive"
                    )}
                  />
                </Field>

                <Field label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      placeholder="Create a strong password"
                      {...register("password")}
                      className={cn(
                        "w-full bg-background border border-border text-foreground rounded-lg px-3.5 py-3 pr-11 text-sm outline-none transition-colors",
                        "placeholder:text-muted-foreground focus:border-primary",
                        errors.password && "border-destructive focus:border-destructive"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPw ? "Hide password" : "Show password"}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  
                  {/* Password requirements checklist */}
                  <div className="mt-3 space-y-1.5 rounded-lg bg-muted/30 border border-border p-3 text-xs text-muted-foreground">
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
                </Field>

                <SubmitButton
                  disabled={!isValid || submitting}
                  loading={submitting}
                  idleLabel="Start Free Trial"
                  loadingLabel="Creating account..."
                />
              </form>

              <p className="mt-6 text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link href="/auth/v1/login" className="font-medium text-primary">
                  Sign in &rarr;
                </Link>
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1.5 block text-xs text-destructive">
          {error}
        </span>
      )}
      {hint && !error && <div className="mt-2 text-sm text-muted-foreground">{hint}</div>}
    </label>
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
        "flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-base font-semibold transition-all duration-150 mt-8",
        disabled
          ? "bg-muted border border-border text-muted-foreground cursor-not-allowed"
          : "ds-accent-bg border border-transparent text-white hover:brightness-110"
      )}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {loading ? loadingLabel : idleLabel}
    </button>
  );
}
