"use client";

import * as React from "react";
import { useRef } from "react";
import {
  MotionValue,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";

export interface DockItemData {
  Icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  active?: boolean;
}

export interface AnimatedDockProps {
  className?: string;
  items: DockItemData[];
  orientation?: "horizontal" | "vertical";
}

export const AnimatedDock = ({
  className,
  items,
  orientation = "horizontal",
}: AnimatedDockProps) => {
  const mouseCoord = useMotionValue(Infinity);
  const vertical = orientation === "vertical";

  return (
    <motion.div
      onMouseMove={(e) =>
        mouseCoord.set(vertical ? e.pageY : e.pageX)
      }
      onMouseLeave={() => mouseCoord.set(Infinity)}
      className={cn(
        "rounded-2xl border border-primary/10 bg-secondary/70 shadow-lg backdrop-blur",
        vertical
          ? "mx-auto flex w-16 flex-col items-end gap-3 px-3 py-4"
          : "mx-auto flex h-16 items-end gap-3 px-4 pb-3",
        className
      )}
    >
      {items.map((item, index) => (
        <DockItem
          key={index}
          mouseCoord={mouseCoord}
          item={item}
          vertical={vertical}
        />
      ))}
    </motion.div>
  );
};

interface DockItemProps {
  mouseCoord: MotionValue<number>;
  item: DockItemData;
  vertical: boolean;
}

const DockItem = ({ mouseCoord, item, vertical }: DockItemProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseCoord, (val) => {
    const bounds = ref.current?.getBoundingClientRect();
    if (!bounds) return 0;
    return vertical
      ? val - bounds.y - bounds.height / 2
      : val - bounds.x - bounds.width / 2;
  });

  const sizeSync = useTransform(distance, [-150, 0, 150], [40, 72, 40]);
  const size = useSpring(sizeSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(size, [40, 72], [1, 1.4]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.button
      ref={ref}
      style={vertical ? { height: size } : { width: size }}
      onClick={item.onClick}
      title={item.label}
      aria-label={item.label}
      className={cn(
        "flex aspect-square items-center justify-center rounded-xl transition-colors",
        item.active
          ? "bg-primary text-primary-foreground"
          : "bg-background/80 text-foreground/80 hover:bg-background hover:text-foreground"
      )}
    >
      <motion.span style={{ scale: iconSpring }} className="flex">
        {item.Icon}
      </motion.span>
    </motion.button>
  );
};
