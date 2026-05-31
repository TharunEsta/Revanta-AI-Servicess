"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConversationStateToggle({
  conversationId,
  aiState
}: {
  conversationId: string;
  aiState: "AI_ACTIVE" | "HUMAN_ACTIVE";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleState() {
    setBusy(true);
    try {
      const nextState = aiState === "AI_ACTIVE" ? "HUMAN_ACTIVE" : "AI_ACTIVE";
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiState: nextState,
          humanTakeover: nextState === "HUMAN_ACTIVE"
        })
      });
      if (response.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="button-secondary" onClick={toggleState} disabled={busy}>
      {busy ? "Saving..." : aiState === "AI_ACTIVE" ? "Take control" : "Return to AI"}
    </button>
  );
}
