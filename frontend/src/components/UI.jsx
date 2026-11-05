import { useEffect, useRef } from "react";
import {
  ArrowRight,
  Check,
  CircleAlert,
  LoaderCircle,
  SearchX,
  X,
} from "lucide-react";
import { useApp } from "../state/context";

export function Button({
  children,
  variant = "primary",
  busy,
  disabled,
  className = "",
  ...props
}) {
  return (
    <button
      className={`btn btn-${variant} ${className}`}
      disabled={busy || disabled}
      {...props}
    >
      {busy && <LoaderCircle className="spin" size={17} />}
      {children}
    </button>
  );
}

export function Empty({ icon: Icon = SearchX, title, text, children }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={30} strokeWidth={1.5} />
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  );
}

export function ErrorMessage({ message }) {
  return message ? (
    <div className="error-message" role="alert">
      <CircleAlert size={18} />
      <span>{message}</span>
    </div>
  ) : null;
}

export function Modal({ title, children, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const lastFocused = document.activeElement;
    const dialog = ref.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.focus();
    function keyboard(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const focusable = [
          ...dialog.querySelectorAll(
            'button, a, input, select, textarea, [tabindex="0"]',
          ),
        ].filter((item) => !item.disabled);
        const first = focusable[0];
        const last = focusable.at(-1);
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === dialog)
        ) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", keyboard);
      lastFocused?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
      >
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            <X size={21} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function Toast() {
  const { toast, setToast } = useApp();
  if (!toast) return null;
  return (
    <div
      className={`toast ${toast.type}`}
      role={toast.type === "error" ? "alert" : "status"}
      key={toast.id}
    >
      {toast.type === "error" ? (
        <CircleAlert size={20} />
      ) : (
        <span className="toast-check">
          <Check size={15} />
        </span>
      )}
      <span>{toast.message}</span>
      <button aria-label="Закрыть уведомление" onClick={() => setToast(null)}>
        <X size={17} />
      </button>
    </div>
  );
}

export function PageHeading({ eyebrow, title, text, children }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {text && <p>{text}</p>}
      </div>
      {children}
    </div>
  );
}

export function TextLink({ children, ...props }) {
  return (
    <button className="text-link" {...props}>
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
