"use client";
import Lottie from "lottie-react";
import { cn } from "@/lib/utils";

interface LottieIconProps {
  path: string;
  size?: number;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
  speed?: number;
}

export function LottieIcon({ path, size = 32, loop = true, autoplay = true, className }: LottieIconProps) {
  return (
    <Lottie
      path={path}
      loop={loop}
      autoplay={autoplay}
      style={{ width: size, height: size, display: "block" }}
      className={cn("flex-shrink-0", className)}
      rendererSettings={{ preserveAspectRatio: "xMidYMid slice" }}
    />
  );
}
