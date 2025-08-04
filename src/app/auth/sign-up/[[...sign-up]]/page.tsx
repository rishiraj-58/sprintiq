import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <SignUp 
        afterSignUpUrl="/auth/callback"
        redirectUrl="/auth/callback"
        routing="path"
        path="/auth/sign-up"
      />
    </div>
  );
} 