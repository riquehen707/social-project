"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  username: z
    .string()
    .min(3, "Mínimo 3 caracteres")
    .regex(/^[a-z0-9_.]+$/, "Use apenas letras, números, ponto e underline"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Use ao menos 6 caracteres"),
});

const loginSchema = z.object({
  identifier: z.string().min(2, "Informe usuário ou e-mail"),
  password: z.string().min(1, "Digite sua senha"),
});

type RegisterData = z.infer<typeof registerSchema>;
type LoginData = z.infer<typeof loginSchema>;

export default function AuthForms() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors, isSubmitting: registerPending },
  } = useForm<RegisterData>({
    resolver: zodResolver(registerSchema),
  });

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors, isSubmitting: loginPending },
  } = useForm<LoginData>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = handleLoginSubmit(async (data) => {
    setError(null);
    const response = await signIn("credentials", {
      redirect: false,
      identifier: data.identifier,
      password: data.password,
    });

    if (response?.error) {
      setError("Credenciais inválidas");
      return;
    }

    router.push("/");
    router.refresh();
  });

  const onRegister = handleRegisterSubmit(async (data) => {
    setError(null);
    setMessage(null);
    try {
      await axios.post("/api/register", data);
      setMessage("Conta criada! Entrando...");
      await signIn("credentials", {
        redirect: false,
        identifier: data.username,
        password: data.password,
      });
      router.push("/");
      router.refresh();
    } catch (err) {
      const msg =
        axios.isAxiosError(err) && err.response?.data?.error
          ? err.response.data.error
          : "Não foi possível criar sua conta";
      setError(msg);
    }
  });

  return (
    <div className="auth-card">
      <div style={{ display: "flex", gap: ".75rem", marginBottom: "1rem" }}>
        <button
          type="button"
          className={`btn ${mode === "login" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("login")}
        >
          Entrar
        </button>
        <button
          type="button"
          className={`btn ${mode === "register" ? "btn-primary" : "btn-ghost"}`}
          onClick={() => setMode("register")}
        >
          Criar conta
        </button>
      </div>

      {mode === "login" ? (
        <form
          className="panel-card"
          onSubmit={onLogin}
          style={{ display: "grid", gap: "0.8rem" }}
        >
          <div className="field">
            <label>Usuário ou e-mail</label>
            <input
              placeholder="ana ou ana@exemplo.com"
              {...registerLogin("identifier")}
            />
            {loginErrors.identifier && (
              <div className="error">{loginErrors.identifier.message}</div>
            )}
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="********"
              {...registerLogin("password")}
            />
            {loginErrors.password && (
              <div className="error">{loginErrors.password.message}</div>
            )}
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn btn-primary" disabled={loginPending} type="submit">
            {loginPending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      ) : (
        <form
          className="panel-card"
          onSubmit={onRegister}
          style={{ display: "grid", gap: "0.8rem" }}
        >
          <div className="field">
            <label>Nome</label>
            <input placeholder="Seu nome" {...registerRegister("name")} />
            {registerErrors.name && (
              <div className="error">{registerErrors.name.message}</div>
            )}
          </div>
          <div className="field">
            <label>Usuário</label>
            <input placeholder="ex: ana" {...registerRegister("username")} />
            {registerErrors.username && (
              <div className="error">{registerErrors.username.message}</div>
            )}
          </div>
          <div className="field">
            <label>E-mail</label>
            <input placeholder="voce@exemplo.com" {...registerRegister("email")} />
            {registerErrors.email && (
              <div className="error">{registerErrors.email.message}</div>
            )}
          </div>
          <div className="field">
            <label>Senha</label>
            <input
              type="password"
              placeholder="********"
              {...registerRegister("password")}
            />
            {registerErrors.password && (
              <div className="error">{registerErrors.password.message}</div>
            )}
          </div>
          {error && <div className="error">{error}</div>}
          {message && <div className="success">{message}</div>}
          <button
            className="btn btn-primary"
            disabled={registerPending}
            type="submit"
          >
            {registerPending ? "Criando..." : "Criar conta"}
          </button>
        </form>
      )}
    </div>
  );
}
