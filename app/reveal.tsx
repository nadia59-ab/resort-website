"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

export default function Reveal({
  children,
  className = "",
  delay = 0,
  hover = false,
  animate = false,
}: Readonly<{ children: React.ReactNode; className?: string; delay?: number; hover?: boolean; animate?: boolean }>) {
  const reduceMotion = useReducedMotion();
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (animate) return;
    const element = elementRef.current;
    if (!element) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.dataset.visible = "true";
      return;
    }
    element.dataset.ready = "true";
    if (!("IntersectionObserver" in window)) {
      element.dataset.visible = "true";
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      element.dataset.visible = "true";
      observer.disconnect();
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [animate]);

  if (!animate) {
    return <div ref={elementRef} className={`reveal ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      className={`reveal reveal-motion ${className}`}
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: reduceMotion ? 0 : 0.8, delay: reduceMotion ? 0 : delay, ease: "easeOut" }}
      whileHover={hover && !reduceMotion ? {
        y: -6,
        boxShadow: "0 18px 38px rgba(24, 44, 42, 0.12)",
        transition: { duration: 0.3, ease: "easeOut" },
      } : undefined}
      style={hover ? { borderRadius: 2 } : undefined}
    >
      {children}
    </motion.div>
  );
}
