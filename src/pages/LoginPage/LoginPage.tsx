import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, type LoginFailureReason } from "../../context/AuthContext";
import { Button } from "../../components/Button";
import { LogoMark } from "../../components/LogoMark";
import { TextField } from "../../components/TextField";
import styles from "./LoginPage.module.scss";

const ERROR_MESSAGES = {
  "invalid-token": "Invalid API token.",
  "no-organization": "No organization found for that ID.",
  unknown: "Something went wrong. Please try again.",
} as const;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [token, setToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorReason, setErrorReason] = useState<LoginFailureReason | null>(
    null,
  );

  const canSubmit =
    token.trim() !== "" && organizationId.trim() !== "" && !isSubmitting;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setErrorReason(null);
    setIsSubmitting(true);
    const result = await login(token.trim(), organizationId.trim());
    setIsSubmitting(false);

    if (result.ok) {
      navigate("/", { replace: true });
      return;
    }

    // Login failures stay on the form (field-level where we know which
    // credential is wrong) rather than a toast. A toast would auto-dismiss
    // away from the fields the user has to fix; ADR 0002's distinct
    // messages only help if they stay visible next to those fields.
    setErrorReason(result.reason);
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <LogoMark size={26} />
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
          onChange={(event) => {
            setToken(event.target.value);
            setErrorReason(null);
          }}
          error={
            errorReason === "invalid-token"
              ? ERROR_MESSAGES["invalid-token"]
              : undefined
          }
        />

        <TextField
          label="Organization ID"
          mono
          type="text"
          autoComplete="off"
          value={organizationId}
          onChange={(event) => {
            setOrganizationId(event.target.value);
            setErrorReason(null);
          }}
          error={
            errorReason === "no-organization"
              ? ERROR_MESSAGES["no-organization"]
              : undefined
          }
        />

        {errorReason === "unknown" && (
          <p className={styles.formError} role="alert">
            {ERROR_MESSAGES.unknown}
          </p>
        )}

        <Button type="submit" variant="primary" fullWidth disabled={!canSubmit}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
