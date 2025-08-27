import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

// Variants & sizes (bebas kamu modif sesuai design system)
const badgeVariants = cva(
  // base styles
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium select-none " +
    "transition-[background-color,color,border-color] duration-150",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-800 border-transparent",
        secondary: "bg-gray-800 text-white border-transparent",
        destructive: "bg-red-600 text-white border-transparent",
        outline: "bg-transparent text-gray-800 border-current",
        soft: "bg-gray-50 text-gray-700 border-transparent",
      },
      size: {
        sm: "text-[10px] px-2 py-[2px]",
        md: "text-xs px-2.5 py-0.5",
        lg: "text-sm px-3 py-1",
      },
      highContrast: {
        true: "contrast-125",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

export function Badge({
  className,
  variant,
  size,
  highContrast,
  asChild,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      className={twMerge(badgeVariants({ variant, size, highContrast }), className)}
      {...props}
    />
  );
}

// Helper untuk className di luar komponen (opsional)
export { badgeVariants };
export default Badge;
