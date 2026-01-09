import Link from "next/link";
import { redirect } from "next/navigation";
import AuthForms from "@/components/shared/AuthForms";
import { authOptions } from "@/lib/authOptions";
import { getServerSession } from "next-auth";

export default async function AuthPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/");
  }

  return (
    <div className="auth-page">
      <div className="brand" style={{ marginBottom: "1rem" }}>
        <span className="brand-mark" />
        <span>social</span>
      </div>
      <h1 style={{ margin: "0 0 .35rem", letterSpacing: "-0.02em" }}>
        Entre para a conversa
      </h1>
      <p className="muted" style={{ margin: "0 0 1rem" }}>
        Uma rede feita para conversas rápidas, respostas em tempo real e
        descoberta de pessoas.
      </p>
      <AuthForms />
      <p className="muted" style={{ marginTop: "1rem" }}>
        Dica: use as contas seed{" "}
        <Link href="#" className="thread-name">
          ana / bruno / clara
        </Link>{" "}
        com senha <span className="thread-name">senha123</span>.
      </p>
    </div>
  );
}
