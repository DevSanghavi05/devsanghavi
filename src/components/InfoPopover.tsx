"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react";
import styles from "./InfoPopover.module.css";

type InfoPopoverProps = {
  /** Underlined inline text that reveals the panel. */
  label: string;
  /** Accessible name for the revealed panel. */
  panelLabel: string;
  /** Panel width in CSS px. */
  width: number;
  children: ReactNode;
};

type Placement = "above" | "below";

const EDGE_INSET = 14;
const CLOSE_DELAY_MS = 120;

/** Visible region for the panel: the viewport intersected with every clipping ancestor. */
function clipBounds(el: HTMLElement) {
  let { top, bottom, left, right } = {
    top: 0,
    left: 0,
    bottom: window.innerHeight,
    right: window.innerWidth,
  };
  for (let node = el.parentElement; node; node = node.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(node);
    if (overflowX === "visible" && overflowY === "visible") continue;
    const rect = node.getBoundingClientRect();
    top = Math.max(top, rect.top);
    left = Math.max(left, rect.left);
    bottom = Math.min(bottom, rect.bottom);
    right = Math.min(right, rect.right);
  }
  return { top, bottom, left, right };
}

/**
 * Inline underlined text that reveals a floating panel on hover, keyboard focus
 * or tap. The panel flips above/below and slides sideways so it never gets
 * clipped by the scrolling frame it lives in.
 */
export function InfoPopover({ label, panelLabel, width, children }: InfoPopoverProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLSpanElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLSpanElement>(null);
  const pointerType = useRef<string>("mouse");
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<Placement>("above");
  const [shift, setShift] = useState(0);
  const [maxWidth, setMaxWidth] = useState<number | null>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current;
    const panel = panelRef.current;
    if (!trigger || !panel) return;

    const t = trigger.getBoundingClientRect();
    const p = panel.getBoundingClientRect();
    const bounds = clipBounds(trigger);

    // The page is CSS-zoomed, so rects are visual px while the transform below
    // is in layout px. The ratio converts one to the other.
    const scale = panel.offsetWidth ? p.width / panel.offsetWidth : 1;

    // Narrow screens: shrink the panel so it always fits inside the frame.
    const fitWidth = Math.min(width * scale, Math.max(0, bounds.right - bounds.left - 2 * EDGE_INSET));
    setMaxWidth(fitWidth / scale);
    const panelWidth = fitWidth;
    const panelHeight = p.width ? p.height * (fitWidth / p.width) : p.height;

    // Horizontal: centre on the trigger, then nudge back inside the frame.
    const centredLeft = t.left + t.width / 2 - panelWidth / 2;
    const minLeft = bounds.left + EDGE_INSET;
    const maxLeft = bounds.right - EDGE_INSET - panelWidth;
    const clampedLeft = Math.min(Math.max(centredLeft, minLeft), Math.max(minLeft, maxLeft));
    setShift((clampedLeft - centredLeft) / scale);

    // Vertical: prefer above, then below, else whichever side has more room.
    const spaceAbove = t.top - bounds.top;
    const spaceBelow = bounds.bottom - t.bottom;
    setPlacement(
      spaceAbove >= panelHeight
        ? "above"
        : spaceBelow >= panelHeight
          ? "below"
          : spaceAbove > spaceBelow
            ? "above"
            : "below",
    );
  }, [width]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: globalThis.PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const handlePointerEnter = (event: PointerEvent) => {
    pointerType.current = event.pointerType;
    if (event.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handlePointerLeave = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <span
      ref={rootRef}
      className={styles.root}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onPointerDown={(event) => {
        pointerType.current = event.pointerType;
      }}
      onBlur={(event) => {
        if (!rootRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={(event) => {
          // A mouse click lands after hover already opened the panel; keep it open.
          // Touch taps and keyboard activation (detail 0) toggle.
          if (event.detail !== 0 && pointerType.current === "mouse") return;
          setOpen((value) => !value);
        }}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible")) setOpen(true);
        }}
      >
        {label}
      </button>
      <span
        ref={panelRef}
        id={panelId}
        role="group"
        aria-label={panelLabel}
        className={styles.panel}
        data-open={open}
        data-placement={placement}
        style={
          {
            "--panel-w": `${width}px`,
            "--max-w": maxWidth === null ? "none" : `${maxWidth}px`,
            "--shift": `${shift}px`,
          } as CSSProperties
        }
      >
        <span className={styles.card}>{children}</span>
      </span>
    </span>
  );
}
