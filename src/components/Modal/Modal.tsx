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
  labelledBy?: string;
  children: ReactNode;
};

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Must match dialogOut/backdropOut in Modal.module.scss.
const CLOSE_ANIMATION_MS = 160;

const ModalCloseContext = createContext<(() => void) | null>(null);

// eslint-disable-next-line react-refresh/only-export-components
export function useModalClose(): () => void {
  const requestClose = useContext(ModalCloseContext);
  if (!requestClose) {
    throw new Error("useModalClose must be used within a Modal");
  }
  return requestClose;
}

export function Modal({ onClose, labelledBy, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isClosing, setIsClosing] = useState(false);

  // Animate out, then call onClose.
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
    // Don't steal focus from a child that already autoFocused.
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
