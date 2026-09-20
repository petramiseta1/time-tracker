import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.scss";

type ModalProps = {
  onClose: () => void;
  children: ReactNode;
};

// Plain centered overlay (portaled to <body>, not anchored to any row) —
// distinct from the Floating-UI-anchored popups planned for edit/delete
// (docs/tech-stack.md), which need viewport-aware positioning relative to
// an entry row that this doesn't. Still no dedicated route for add
// (docs/adr/0007-add-entry-stays-inline.md) — this is purely a visual
// presentation choice, driven by local component state.
export function Modal({ onClose, children }: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
