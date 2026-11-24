import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonStyles = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-[transform,background-color,opacity] duration-150 ease-out focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none active:not-disabled:scale-[0.96] disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-primary text-on-primary hover:bg-primary/90",
        ghost: "bg-transparent text-fg hover:bg-fg/5",
        soft: "bg-primary-soft text-primary-ink hover:bg-primary-soft/80",
        danger: "bg-danger text-on-primary hover:bg-danger/90",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonStyles>;

export function Button({ className, variant, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonStyles({ variant }), className)} {...props} />;
}
