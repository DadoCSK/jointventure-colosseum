"use client";
import { useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Modal({
  trigger,
  title,
  children,
  className = "btn btn-primary",
  triggerDisabled = false,
}: {
  trigger: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
  triggerDisabled?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  return (
    <>
      <button
        className={className}
        disabled={triggerDisabled}
        onClick={() => ref.current?.showModal()}
      >
        {trigger}
      </button>
      <dialog
        ref={ref}
        className="modal"
        aria-labelledby={titleId}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(
            event.currentTarget.querySelectorAll<HTMLElement>(
              ".modal-box button:not(:disabled), .modal-box input:not(:disabled), .modal-box select:not(:disabled), .modal-box a[href]",
            ),
          ).filter((element) => element.getClientRects().length > 0);
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="modal-box">
          <form method="dialog">
            <button
              className="modal-close btn btn-ghost btn-circle"
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          </form>
          <h2 id={titleId}>{title}</h2>
          {children}
        </div>
        <form method="dialog" className="modal-backdrop">
          <button aria-label="Dismiss dialog">close</button>
        </form>
      </dialog>
    </>
  );
}
