"use client";

import { useEffect, useRef, type ReactNode } from "react";
import {
  BAND_STEP,
  bandTuning,
  createBand,
  loopPoints,
  type Band,
} from "@/lib/elasticBand";
import styles from "./ElasticFrame.module.css";

/** Spacing (px) between the points that make up the band. */
const SPACING = 10;
/** Furthest (px) the band can be pulled from its frame; resistance rises towards it. */
const MAX_PULL = 240;
/** How far outside the frame (px) a press still grabs the border. */
const GRAB_OUTSIDE = { mouse: 10, touch: 20 };

/**
 * The page's blue frame. Press its border and pull: the edge stretches like a rubber
 * band and, on release, snaps back with a wobble. At rest the real CSS border is shown;
 * while it moves, an SVG stroke of the same colour, width and radius takes its place.
 */
export function ElasticFrame({ className, children }: { className?: string; children: ReactNode }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const frame = frameRef.current;
    const svg = svgRef.current;
    const path = pathRef.current;
    const page = frame?.parentElement;
    if (!frame || !svg || !path || !page) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    let band: Band | null = null;
    let anchor = { x: 0, y: 0 };
    let raf = 0;
    let last = 0;
    let acc = 0;
    let hovering = false;
    let drag: { pointerId: number; index: number; grabX: number; grabY: number } | null = null;

    const metrics = () => {
      const rect = frame.getBoundingClientRect();
      const style = getComputedStyle(frame);
      return {
        rect,
        // The page is zoomed, so client pixels and layout pixels differ by this factor.
        scale: rect.width / frame.offsetWidth || 1,
        border: parseFloat(style.borderTopWidth) || 0,
        radius: parseFloat(style.borderTopLeftRadius) || 0,
      };
    };

    /** Offset (layout px) of the frame from where it was when the band was built; non-zero if the page scrolled. */
    const shift = () => {
      const { rect, scale } = metrics();
      return { x: rect.left / scale - anchor.x, y: rect.top / scale - anchor.y };
    };

    const render = () => {
      if (!band) return;
      const { x, y } = shift();
      path.setAttribute("d", band.path(x, y));
    };

    const deactivate = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      band = null;
      svg.dataset.active = "false";
      frame.style.borderColor = "";
    };

    const activate = () => {
      if (band) return;
      const { rect, scale, border, radius } = metrics();
      const color = getComputedStyle(frame).borderTopColor;
      const half = border / 2;
      // Snap to whole device pixels, as the browser does for the real border, so the stroke
      // lines up with it exactly instead of being smeared across two pixel columns.
      const snap = (value: number) => Math.round(value * window.devicePixelRatio) / window.devicePixelRatio;
      const left = snap(rect.left) / scale;
      const top = snap(rect.top) / scale;
      const right = snap(rect.right) / scale;
      const bottom = snap(rect.bottom) / scale;
      anchor = { x: rect.left / scale, y: rect.top / scale };

      const { xs, ys } = loopPoints(
        left + half,
        top + half,
        right - left - border,
        bottom - top - border,
        radius - half,
        SPACING,
      );
      band = createBand(xs, ys, bandTuning(motion.matches));

      const width = window.innerWidth / scale;
      const height = window.innerHeight / scale;
      svg.setAttribute("width", String(width));
      svg.setAttribute("height", String(height));
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", String(border));
      frame.style.borderColor = "transparent";
      svg.dataset.active = "true";
      render();
    };

    const tick = (now: number) => {
      raf = 0;
      if (!band) return;
      acc += Math.min(now - last, 50) / 1000;
      last = now;
      while (acc >= BAND_STEP) {
        band.step(BAND_STEP);
        acc -= BAND_STEP;
      }
      render();
      if (band.settled()) {
        deactivate();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const startLoop = () => {
      if (raf || !band) return;
      last = performance.now();
      acc = 0;
      raf = requestAnimationFrame(tick);
    };

    /** Is this press/hover on the frame's border (or the sliver just outside it) rather than the page or its contents? */
    const onBorder = (x: number, y: number, target: EventTarget | null, touch: boolean) => {
      if (target !== frame && target !== page && target !== document.body) return false;
      const { rect, scale, border } = metrics();
      const outside = (touch ? GRAB_OUTSIDE.touch : GRAB_OUTSIDE.mouse) * scale;
      const inset = (border + 1) * scale;
      const nearEdge =
        x >= rect.left - outside &&
        x <= rect.right + outside &&
        y >= rect.top - outside &&
        y <= rect.bottom + outside;
      const inInterior =
        x > rect.left + inset && x < rect.right - inset && y > rect.top + inset && y < rect.bottom - inset;
      return nearEdge && !inInterior;
    };

    const setHover = (on: boolean) => {
      if (on === hovering) return;
      hovering = on;
      frame.style.cursor = on ? "grab" : "";
      page.style.cursor = on ? "grab" : "";
    };

    /** Pointer position in the band's own coordinates (layout px). */
    const toBand = (event: PointerEvent) => {
      const { scale } = metrics();
      const { x, y } = shift();
      return { x: event.clientX / scale - x, y: event.clientY / scale - y };
    };

    const onMove = (event: PointerEvent) => {
      if (!drag || !band || event.pointerId !== drag.pointerId) return;
      const point = toBand(event);
      const wantX = point.x - drag.grabX - band.restX[drag.index];
      const wantY = point.y - drag.grabY - band.restY[drag.index];
      const length = Math.hypot(wantX, wantY);
      // Rubber-band resistance: follows the pointer at first, then gets harder to stretch.
      const k = length > 0 ? (MAX_PULL * (1 - Math.exp(-length / MAX_PULL))) / length : 0;
      band.hold(drag.index, wantX * k, wantY * k);
      startLoop();
    };

    const endDrag = () => {
      if (!drag) return;
      drag = null;
      band?.release();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("blur", endDrag);
      document.removeEventListener("selectstart", noSelect);
      document.documentElement.style.cursor = "";
      startLoop();
    };

    const onUp = (event: PointerEvent) => {
      if (drag && event.pointerId === drag.pointerId) endDrag();
    };

    const noSelect = (event: Event) => event.preventDefault();

    const onDown = (event: PointerEvent) => {
      if (drag || (event.pointerType === "mouse" && event.button !== 0)) return;
      if (!onBorder(event.clientX, event.clientY, event.target, event.pointerType !== "mouse")) return;
      event.preventDefault();
      activate();
      if (!band) return;

      // Grab the point of the band nearest the pointer, remembering where on it we took hold.
      const point = toBand(event);
      let index = 0;
      let nearest = Infinity;
      for (let i = 0; i < band.count; i++) {
        const distance = Math.hypot(
          band.restX[i] + band.dx[i] - point.x,
          band.restY[i] + band.dy[i] - point.y,
        );
        if (distance < nearest) {
          nearest = distance;
          index = i;
        }
      }
      drag = {
        pointerId: event.pointerId,
        index,
        grabX: point.x - (band.restX[index] + band.dx[index]),
        grabY: point.y - (band.restY[index] + band.dy[index]),
      };
      band.hold(index, band.dx[index], band.dy[index]);
      setHover(false);
      document.documentElement.style.cursor = "grabbing";
      document.addEventListener("selectstart", noSelect);
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onUp);
      window.addEventListener("blur", endDrag);
      startLoop();
    };

    const onHover = (event: PointerEvent) => {
      if (drag || event.pointerType !== "mouse") return;
      setHover(onBorder(event.clientX, event.clientY, event.target, false));
    };

    /** Stops a touch on the border from scrolling the page instead of stretching the frame. */
    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (event.touches.length === 1 && onBorder(touch.clientX, touch.clientY, event.target, true)) {
        event.preventDefault();
      }
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onHover);
    window.addEventListener("touchstart", onTouchStart, { passive: false });

    return () => {
      endDrag();
      deactivate();
      setHover(false);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onHover);
      window.removeEventListener("touchstart", onTouchStart);
    };
  }, []);

  return (
    <>
      <div ref={frameRef} className={className}>
        {children}
      </div>
      <svg ref={svgRef} className={styles.overlay} aria-hidden="true" focusable="false">
        <path ref={pathRef} fill="none" strokeLinejoin="round" />
      </svg>
    </>
  );
}
