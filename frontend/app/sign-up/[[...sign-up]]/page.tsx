import * as React from "react";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthContainer } from "@/components/auth/auth-container";

export default async function SignUpPage(): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <AuthContainer mode="sign-up">
      <SignUp
        fallbackRedirectUrl="/dashboard"
        signInFallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-transparent shadow-none border-none p-0 w-full",
            headerTitle: "text-2xl font-black tracking-tight text-zinc-950",
            headerSubtitle: "text-xs text-zinc-500 font-medium mt-1",
            socialButtonsBlockButton:
              "border border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300 text-zinc-900 rounded-xl transition-all font-semibold text-xs py-2.5 shadow-2xs",
            socialButtonsBlockButtonText: "font-semibold text-xs text-zinc-800",
            dividerRow: "my-4",
            dividerLine: "bg-zinc-200",
            dividerText: "text-zinc-400 text-[11px] font-semibold tracking-wider uppercase",
            formFieldLabel: "text-xs font-bold text-zinc-800 mb-1",
            formFieldInput:
              "rounded-xl border-zinc-200 bg-zinc-50/50 hover:bg-zinc-50 focus:bg-white text-xs transition-all focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10 py-2.5 px-3",
            formButtonPrimary:
              "bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow-md shadow-zinc-950/20 py-3 transition-all cursor-pointer mt-2",
            footerActionLink: "text-zinc-950 font-bold hover:underline ml-1",
            footerActionText: "text-xs text-zinc-500 font-medium",
            footer: "bg-transparent border-t border-zinc-100 mt-4 pt-4",
          },
        }}
      />
    </AuthContainer>
  );
}
