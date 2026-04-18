"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface ShiningTextProps {
  text: string;
  className?: string;
}

export function ShiningText({ text, className }: ShiningTextProps) {
  return (
    <motion.span
      className={cn(
        "inline-block bg-[linear-gradient(110deg,#6b7280_45%,#f8fafc_55%,#6b7280_65%)] bg-[length:200%_100%] bg-clip-text text-transparent font-medium",
        className
      )}
      animate={{ backgroundPosition: ["200% 0%", "-200% 0%"] }}
      transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
    >
      {text}
    </motion.span>
  );
}
