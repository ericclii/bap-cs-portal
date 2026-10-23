"use client";

import { useEffect, useState } from "react";
import { Button } from "./ui";

/**
 * Two-step inline confirmation instead of the browser's confirm() dialog:
 * the first tap swaps the button for "Cancel / <confirm>", which resets
 * after a few seconds of inaction.
 */
export function ConfirmButton({
  children,
  confirmLabel,
  onConfirm,
  disabled,
  destructive = true,
  size = "sm",
  className,
}: {
  children: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  destructive?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 5000);
    return () => clearTimeout(id);
  }, [armed]);

  if (!armed) {
    return (
      <Button size={size} variant="plain" disabled={disabled} className={className} onClick={() => setArmed(true)}>
        {children}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5" role="group" aria-label="Confirm">
      <Button size={size} variant="secondary" onClick={() => setArmed(false)}>
        Cancel
      </Button>
      <Button
        size={size}
        variant={destructive ? "destructive" : "primary"}
        disabled={disabled}
        autoFocus
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
      >
        {confirmLabel}
      </Button>
    </span>
  );
}
