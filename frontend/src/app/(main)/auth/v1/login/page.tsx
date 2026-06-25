import Link from "next/link";
import { Command } from "lucide-react";

export default function LoginV1() {
  return (
    <div className="flex h-dvh">
      <div className="hidden bg-primary lg:block lg:w-1/3">
        <div className="flex h-full flex-col items-center justify-center p-12 text-center">
          <Command className="mx-auto size-12 text-primary-foreground" />
          <h1 className="mt-6 font-light text-5xl text-primary-foreground">Hello again</h1>
          <p className="mt-2 text-primary-foreground/80 text-xl">Login to continue</p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-background p-8 lg:w-2/3">
        <div className="w-full max-w-md space-y-6 text-center">
          <h2 className="font-semibold text-2xl">Login</h2>
          <p className="text-muted-foreground text-sm">Login form coming soon.</p>
          <p className="text-muted-foreground text-xs">
            Don&apos;t have an account?{" "}
            <Link prefetch={false} href="register" className="text-primary">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
