"use client";

import {
  BellIcon,
  ChatBubbleIcon,
  EnvelopeClosedIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  PersonIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = (username?: string) => [
  { label: "Início", href: "/", icon: <HomeIcon /> },
  { label: "Explorar", href: "/?tab=discover", icon: <MagnifyingGlassIcon /> },
  { label: "Chat", href: "/chat", icon: <ChatBubbleIcon />, mobileHidden: true },
  {
    label: "Mensagens",
    href: "/messages",
    icon: <EnvelopeClosedIcon />,
    mobileHidden: true,
  },
  { label: "Notificações", href: "/notifications", icon: <BellIcon /> },
  {
    label: "Perfil",
    href: username ? `/profile/${username}` : "/auth",
    icon: <PersonIcon />,
  },
  {
    label: "Nova publicação",
    href: "#composer",
    icon: <PlusCircledIcon />,
    action: "compose",
  },
];

export default function Sidebar({ username }: { username?: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const openComposer = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("open-compose"));
    }
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" />
        <span>social</span>
      </div>

      <nav className="nav">
        {navItems(username).map((item) => {
          const active = item.href.includes("discover")
            ? tab === "discover"
            : pathname === item.href || pathname.startsWith(item.href);

          if (item.action === "compose") {
            return (
              <button
                key={item.label}
                type="button"
                className="nav-button"
                data-action={item.action}
                onClick={openComposer}
                data-mobile={item.mobileHidden ? "hide" : "show"}
              >
                {item.icon}
                <span className="nav-label">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-button ${active ? "active" : ""}`}
              data-action={item.action}
              data-mobile={item.mobileHidden ? "hide" : "show"}
            >
              {item.icon}
              <span className="nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="nav" style={{ marginTop: "auto" }}>
        <button
          className="nav-button"
          onClick={() => signOut({ callbackUrl: "/auth" })}
        >
          <span className="nav-label">Sair</span>
        </button>
        <div className="muted" style={{ fontSize: "0.85rem" }}>
          Entrou como @{username ?? "convidado"}
        </div>
      </div>
    </aside>
  );
}
