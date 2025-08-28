import { cva, type VariantProps } from "class-variance-authority";
import { type ClassValue, clsx } from "clsx";
import { Loader2 } from "lucide-react";
import type React from "react";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Array<ClassValue>) {
  return twMerge(clsx(inputs));
}

const spinnerVariants = cva("flex-col items-center justify-center", {
  defaultVariants: {
    show: true,
  },
  variants: {
    show: {
      false: "hidden",
      true: "flex",
    },
  },
});

const loaderVariants = cva("animate-spin text-primary", {
  defaultVariants: {
    color: "blue",
    size: "medium",
  },
  variants: {
    color: {
      black: "text-black",
      blue: "text-blue",
      gray: "text-gray",
      green: "text-green",
      primary: "text-(--primary-color)",
      red: "text-red",
      white: "text-white",
      yellow: "text-yellow",
    },
    size: {
      large: "size-12",
      medium: "size-8",
      small: "size-6",
    },
  },
});

interface SpinnerContentProps
  extends VariantProps<typeof spinnerVariants>,
    VariantProps<typeof loaderVariants> {
  className?: string;
  children?: React.ReactNode;
  fullVh?: boolean;
}

export function LoadingSpinner({
  size,
  color,
  show,
  children,
  className,
  fullVh = false,
}: SpinnerContentProps) {
  const jsxInner = (
    <span className={cn(spinnerVariants({ show }))}>
      <Loader2 className={cn(loaderVariants({ color, size }), className)} />
      {children}
    </span>
  );

  return fullVh ? (
    <div className="flex h-dvh w-full items-center justify-center">
      {jsxInner}
    </div>
  ) : (
    jsxInner
  );
}
