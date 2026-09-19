import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Button } from "../../components/Button";
import { TextField } from "../../components/TextField";
import styles from "./LoginPage.module.scss";

const ERROR_MESSAGES = {
  "invalid-token": "Invalid API token.",
  "no-organization": "No organization found for that ID.",
  unknown: "Something went wrong. Please try again.",
} as const;

export function LoginPage() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    token.trim() !== "" && organizationId.trim() !== "" && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    const result = await login(token.trim(), organizationId.trim());
    setIsSubmitting(false);

    if (result.ok) {
      navigate("/", { replace: true });
      return;
    }

    showToast(ERROR_MESSAGES[result.reason], "error");
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <span className={styles.logoMark} />
          <span className={styles.brandName}>Time Tracker</span>
        </div>

        <h1 className={styles.title}>Sign in</h1>
        <p className={styles.subtitle}>
          Paste your API token and the organization you want to track time for.
        </p>

        <TextField
          label="API token"
          type="password"
          autoComplete="off"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />

        <TextField
          label="Organization ID"
          mono
          type="text"
          autoComplete="off"
          value={organizationId}
          onChange={(event) => setOrganizationId(event.target.value)}
        />

        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit}>
          {isSubmitting ? "Signing in…" : "Continue"}
        </Button>

        <p className={styles.footnote}>
          Credentials stay in your browser. Logging out clears them.
        </p>
      </form>
    </div>
  );
}
