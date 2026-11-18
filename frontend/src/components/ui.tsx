import { useRef } from "react";
import type { ReactNode, ButtonHTMLAttributes } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ArrowUpRight, Sparkles, Search, Inbox } from "lucide-react";
import { STAGE_COLORS } from "../lib";
import type { Account, Member } from "../types";

export function Button({
  children,
  variant = "secondary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "ai" | "danger";
}) {
  return (
    <button className={`button ${variant} ${className}`} {...props}>
      {children}
    </button>
  );
}
export function IconButton({
  children,
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={`icon-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function Avatar({
  person,
  size = "sm",
}: {
  person?: Member | { initials: string; color: string; name?: string };
  size?: "xs" | "sm" | "lg";
}) {
  return (
    <span
      title={person?.name}
      className={`avatar ${size}`}
      style={{ background: person?.color || "#e5dcfa" }}
    >
      {person?.initials || "AM"}
    </span>
  );
}
export function CompanyLogo({
  account,
  size = "sm",
}: {
  account?: Account;
  size?: "sm" | "lg";
}) {
  return (
    <span
      className={`company-logo ${size} ${account?.color === "#181c28" ? "dark" : ""}`}
      style={{ background: account?.color || "#e5dcfa" }}
    >
      {account?.name === "Acme" ? (
        <span className="acme-mark">a</span>
      ) : (
        account?.initials || "J"
      )}
    </span>
  );
}
export function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`stage-badge stage-${stage.toLowerCase()}`}>
      <i style={{ background: STAGE_COLORS[stage] }} />
      {stage}
    </span>
  );
}
export function AiMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`ai-mark ${small ? "small" : ""}`}>
      <Sparkles size={small ? 14 : 21} strokeWidth={1.6} />
    </span>
  );
}
export function Empty({
  title,
  children,
  action,
  search = false,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  search?: boolean;
}) {
  return (
    <div className="empty-state">
      {search ? <Search size={25} /> : <Inbox size={25} />}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}
export function Panel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <div>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
export function TextLink({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button className="text-link" onClick={onClick}>
      {children}
      <ArrowUpRight size={14} />
    </button>
  );
}
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const close = () => {
    if (
      ref.current?.querySelector('[data-unsaved="true"]') &&
      !window.confirm("Discard your unsaved changes?")
    )
      return;
    onClose();
  };
  return (
    <Dialog.Root open={open} onOpenChange={(value) => !value && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content ref={ref} className={`modal-content ${className}`}>
          <div className="modal-heading">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>
                {description ||
                  "Your changes are saved to this demo workspace."}
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <IconButton label="Close dialog">
                <X size={20} />
              </IconButton>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
