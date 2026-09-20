import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import styles from "./Modal.module.scss";

type ModalProps = {
  onClose: () => void;
  // id of the element (usually the dialog's own <h3> title) that names it
  // for assistive tech — passed in rather than rendered here since each
  // caller's content owns its own title markup/placement.
  labelledBy?: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Matches the dialogOut/backdropOut animation durations in Modal.module.scss
// — kept in sync manually since CSS can't tell JS how long it's animating.
const CLOSE_ANIMATION_MS = 160;

// Lets content rendered inside a Modal (EntryForm, EntryDeleteConfirm) ask
// for the closing animation to play before the modal actually unmounts,
// instead of calling the parent's onClose directly and cutting the
// animation short. Modal is the only provider, so useModalClose() assumes
// one is always an ancestor.
const ModalCloseContext = createContext<(() => void) | null>(null);

// Context + its hook are colocated deliberately (see docs/tech-stack.md's
// project structure), so this file exports more than one component-shaped
// thing — safe to ignore for fast-refresh purposes.
// eslint-disable-next-line react-refresh/only-export-components
export function useModalClose(): () => void {
  const requestClose = useContext(ModalCloseContext);
  if (!requestClose) {
    throw new Error("useModalClose must be used within a Modal");
  }
  return requestClose;
}

// Plain centered overlay, portaled to <body> — shared by add (no route,
// docs/adr/0007-add-entry-stays-inline.md, shown/hidden via local component
// state) and edit (its own route, docs/adr/0004-route-driven-entry-overlay.md,
// shown/hidden by whether that route matches).
export function Modal({ onClose, labelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Plays the closing animation, then hands off to the real onClose (which
  // actually unmounts/navigates away) once it finishes. Backdrop click,
  // Escape, and any close action inside the dialog's own content all funnel
  // through this instead of calling onClose straight away.
  const requestClose = useCallback(() => {
    setIsClosing(true);
  }, []);

  useEffect(() => {
    if (!isClosing) {
      return;
    }
    const timeoutId = window.setTimeout(onClose, CLOSE_ANIMATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [isClosing, onClose]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    // A child field may already hold focus via its own `autoFocus` (e.g.
    // EntryForm's duration input) — that fires during commit, before this
    // effect runs, so don't clobber it by jumping to the first focusable
    // element regardless.
    if (!dialog?.contains(document.activeElement)) {
      const firstFocusable =
        dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (firstFocusable ?? dialog)?.focus();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        requestClose();
        return;
      }

      if (event.key !== "Tab" || !dialog) {
        return;
      }

      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [requestClose]);

  return createPortal(
    <div
      className={clsx(styles.backdrop, isClosing && styles.backdropClosing)}
      onClick={requestClose}
    >
      <div
        ref={dialogRef}
        className={clsx(styles.dialog, isClosing && styles.dialogClosing)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <ModalCloseContext.Provider value={requestClose}>
          {children}
        </ModalCloseContext.Provider>
      </div>
    </div>,
    document.body,
  );
}
