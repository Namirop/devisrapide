import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth, signIn } from "@/lib/auth";

type SearchParams = Promise<{ callbackUrl?: string; error?: string }>;

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  const { callbackUrl, error } = await searchParams;

  if (session) {
    redirect(session.user.role === "ADMIN" ? "/admin" : "/pro");
  }

  async function login(formData: FormData) {
    "use server";
    const callback = (formData.get("callbackUrl") as string) || "/";
    const target =
      callback.startsWith("/pro") || callback.startsWith("/admin")
        ? callback
        : "/pro";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: target,
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect(`/connexion?error=invalid&callbackUrl=${encodeURIComponent(callback)}`);
      }
      throw err;
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <Card>
        <CardHeader>
          <CardTitle>Connexion</CardTitle>
          <CardDescription>
            Accédez à votre espace pro ou administrateur.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm
            action={login}
            callbackUrl={callbackUrl ?? ""}
            error={error}
          />
        </CardContent>
      </Card>
    </div>
  );
}
