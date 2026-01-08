"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { availableInterests } from "@/data/interests";

type Props = {
  initial: string[];
};

export default function InterestsEditor({ initial }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (item: string) => {
    setSelected((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  const save = async () => {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch("/api/profile/interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erro ao salvar");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="interests-editor">
      <div className="interests-picker">
        {availableInterests.map((item) => {
          const active = selected.includes(item);
          return (
            <button
              key={item}
              type="button"
              className={`chip chip-select ${active ? "active" : ""}`}
              onClick={() => toggle(item)}
            >
              {item}
            </button>
          );
        })}
      </div>
      <div className="interests-actions">
        {error && <span className="error">{error}</span>}
        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Salvando..." : "Salvar interesses"}
        </button>
      </div>
    </div>
  );
}
