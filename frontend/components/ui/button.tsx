import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold",
    "border-2 border-[#09090B] cursor-pointer select-none",
    "transition-all duration-75",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7C3AED] focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "shadow-[4px_4px_0_#09090B]",
    "hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[3px_3px_0_#09090B]",
    "active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-[#7C3AED] text-white rounded-2xl",
        accent:
          "bg-[#FFE500] text-[#09090B] rounded-2xl",
        success:
          "bg-[#16A34A] text-white rounded-2xl",
        warning:
          "bg-[#F59E0B] text-white rounded-2xl",
        destructive:
          "bg-[#DC2626] text-white rounded-2xl",
        ghost:
          "bg-white text-[#09090B] rounded-2xl",
        outline:
          "bg-transparent text-[#09090B] rounded-2xl shadow-none hover:shadow-none hover:translate-x-0 hover:translate-y-0 hover:bg-white/60 border-dashed",
      },
      size: {
        default: "h-[52px] px-5 w-full text-[1rem]",
        sm: "h-10 px-4 text-[0.875rem] rounded-xl border-[1.5px] shadow-[2px_2px_0_#09090B] hover:shadow-[1px_1px_0_#09090B] active:shadow-none",
        icon: "h-10 w-10 rounded-xl shadow-[2px_2px_0_#09090B] hover:shadow-[1px_1px_0_#09090B] active:shadow-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
