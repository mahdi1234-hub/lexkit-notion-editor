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
}

export const AnimatedDock = ({ className, items }: AnimatedDockProps) => {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={cn(
        "mx-auto flex h-16 items-end gap-3 rounded-2xl border border-primary/10 bg-secondary/70 px-4 pb-3 shadow-lg backdrop-blur",
        className
      )}
    >
      {items.map((item, index) => (
        <DockItem key={index} mouseX={mouseX} item={item} />
      ))}
    </motion.div>
  );
};

interface DockItemProps {
  mouseX: MotionValue<number>;
  item: DockItemData;
}

const DockItem = ({ mouseX, item }: DockItemProps) => {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 72, 40]);
  const width = useSpring(widthSync, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  const iconScale = useTransform(width, [40, 72], [1, 1.4]);
  const iconSpring = useSpring(iconScale, {
    mass: 0.1,
    stiffness: 150,
    damping: 12,
  });

  return (
    <motion.button
      ref={ref}
      style={{ width }}
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
