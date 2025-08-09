'use client';

import { SignIn } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function Page() {
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect_url') || '/workspaces';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignIn 
        afterSignInUrl={redirectUrl}
        redirectUrl={redirectUrl}
        routing="path"
        path="/auth/sign-in"
      />
    </div>
  );
} 