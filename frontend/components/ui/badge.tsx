import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-bold border-2 border-[#09090B] transition-all duration-75",
  {
    variants: {
      variant: {
        default:
          "bg-[#EDE9FE] text-[#5B21B6] rounded-lg px-3 py-1 text-[0.75rem] shadow-[2px_2px_0_#09090B]",
        success:
          "bg-[#DCFCE7] text-[#15803D] rounded-lg px-3 py-1 text-[0.75rem] shadow-[2px_2px_0_#09090B]",
        warning:
          "bg-[#FEF9C3] text-[#92400E] rounded-lg px-3 py-1 text-[0.75rem] shadow-[2px_2px_0_#09090B]",
        muted:
          "bg-white text-[#09090B] rounded-lg px-3 py-1 text-[0.75rem] shadow-[2px_2px_0_#09090B]",
        milestone:
          "bg-[#FFE500] text-[#09090B] rounded-xl px-4 py-2 text-[0.875rem] shadow-[3px_3px_0_#09090B] animate-bounce-in",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
