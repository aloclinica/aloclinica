import { ReactNode, forwardRef, useState, ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Sparkles, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─────────────── EmailField ─────────────── */
interface FieldBaseProps extends Omit<ComponentProps<"input">, "ref"> {
  label: string;
  icon: LucideIcon;
  hint?: ReactNode;
  /** Element rendered to the right of the label (e.g. "Esqueci senha") */
  labelTrailing?: ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, FieldBaseProps>(
  ({ label, icon: Icon, hint, labelTrailing, className, id, ...rest }, ref) => {
    const inputId = id ?? `f-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={inputId} className="text-[13.5px] font-semibold text-foreground">
            {label}
          </Label>
          {labelTrailing}
        </div>
        <div className="relative mt-1.5">
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/55"
            aria-hidden="true"
          />
          <Input
            id={inputId}
            ref={ref}
            className={cn(
              "pl-11 h-[52px] rounded-2xl bg-card border-border/60 shadow-sm text-[15px]",
              "focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)] focus-visible:border-primary/45 focus-visible:ring-0 focus-visible:ring-offset-0",
              "transition-shadow",
              className
            )}
            {...rest}
          />
        </div>
        {hint && <div className="mt-1.5">{hint}</div>}
      </div>
    );
  }
);
AuthField.displayName = "AuthField";

/* ─────────────── PasswordField ─────────────── */
interface PasswordFieldProps extends Omit<FieldBaseProps, "icon" | "type" | "labelTrailing"> {
  /** Show "Esqueci minha senha" link */
  showForgot?: boolean;
  forgotHref?: string;
  /** Pass <PasswordStrength password={value} /> here */
  strength?: ReactNode;
  icon: LucideIcon;
}

export const AuthPasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  ({ label, icon: Icon, showForgot, forgotHref = "/forgot-password", strength, className, id, ...rest }, ref) => {
    const [show, setShow] = useState(false);
    const inputId = id ?? "f-password";
    return (
      <div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={inputId} className="text-[13.5px] font-semibold text-foreground">
            {label}
          </Label>
          {showForgot && (
            <Link
              to={forgotHref}
              className="text-[12.5px] font-semibold text-primary hover:underline"
            >
              Esqueci minha senha
            </Link>
          )}
        </div>
        <div className="relative mt-1.5">
          <Icon
            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/55"
            aria-hidden="true"
          />
          <Input
            id={inputId}
            ref={ref}
            type={show ? "text" : "password"}
            className={cn(
              "pl-11 pr-11 h-[52px] rounded-2xl bg-card border-border/60 shadow-sm text-[15px]",
              "focus-visible:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)] focus-visible:border-primary/45 focus-visible:ring-0 focus-visible:ring-offset-0",
              "transition-shadow",
              className
            )}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors p-1 -m-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            tabIndex={-1}
          >
            {show ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
          </button>
        </div>
        {strength}
      </div>
    );
  }
);
AuthPasswordField.displayName = "AuthPasswordField";

/* ─────────────── SubmitButton ─────────────── */
interface SubmitButtonProps {
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
  loadingLabel?: string;
  /** Tailwind classes for the button background (gradient / color) */
  variantClassName?: string;
  /** Optional icon shown before the label */
  icon?: ReactNode;
  type?: "submit" | "button";
  onClick?: () => void;
  className?: string;
}

export const AuthSubmitButton = ({
  loading,
  disabled,
  children,
  loadingLabel = "Carregando...",
  variantClassName = "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:brightness-110",
  icon,
  type = "submit",
  onClick,
  className,
}: SubmitButtonProps) => (
  <Button
    type={type}
    onClick={onClick}
    disabled={loading || disabled}
    size="lg"
    className={cn(
      "w-full h-[52px] rounded-2xl font-bold text-base active:scale-[0.98] transition-all",
      variantClassName,
      className
    )}
  >
    {loading ? (
      <motion.span
        animate={{ opacity: [1, 0.55, 1] }}
        transition={{ repeat: Infinity, duration: 1.2 }}
        className="flex items-center gap-2"
      >
        <Sparkles className="w-4 h-4 animate-spin" />
        {loadingLabel}
      </motion.span>
    ) : (
      <span className="flex items-center justify-center gap-2">
        {icon}
        {children}
      </span>
    )}
  </Button>
);

/* ─────────────── Form heading ─────────────── */
export const AuthHeading = ({
  title,
  subtitle,
  className,
}: {
  title: string;
  subtitle?: string;
  className?: string;
}) => (
  <div className={cn("mb-6", className)}>
    <h2 className="text-[26px] sm:text-[28px] font-extrabold text-foreground tracking-tight leading-tight">
      {title}
    </h2>
    {subtitle && <p className="text-[14px] text-muted-foreground mt-1.5">{subtitle}</p>}
  </div>
);
