"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import type Matter from "matter-js";

type Options = {
  /** Positioned container the letters live in; its edges are the walls and floor. */
  arena: RefObject<HTMLElement | null>;
  /** Element holding the `[data-letter]` spans. */
  word: RefObject<HTMLElement | null>;
  /** Elements the letters collide with (portrait, links). */
  blocks: RefObject<HTMLElement | null>[];
};

type Glyph = {
  /** Centre of the glyph's ink box in arena coordinates. */
  cx: number;
  cy: number;
  width: number;
  height: number;
};

const STEP = 1000 / 60;
const CALM_STEPS = 30;
/** Longest the drag spring may stretch (px); stops a fast flick from tunnelling through walls. */
const MAX_PULL = 90;
const FLOOR_INSET = 24;
/** Movement (px) past which a press counts as a drag, not a click on a link. */
const DRAG_THRESHOLD = 5;

/**
 * Turns each letter of a heading into a rigid body. Letters hang exactly where the
 * text puts them until one is grabbed; then they obey gravity, pile up on the floor
 * and bounce off the portrait and links. The loop only runs while something moves.
 */
export function useLetterPhysics({ arena, word, blocks }: Options) {
  const [touched, setTouched] = useState(false);
  const resetRef = useRef<() => void>(() => {});
  const reset = useCallback(() => resetRef.current(), []);

  useEffect(() => {
    const arenaEl = arena.current;
    const wordEl = word.current;
    if (!arenaEl || !wordEl) return;

    let cancelled = false;
    let teardown = () => {};

    (async () => {
      const [matter] = await Promise.all([import("matter-js"), document.fonts.ready]);
      if (cancelled) return;
      teardown = start(
        matter.default,
        arenaEl,
        wordEl,
        blocks.map((ref) => ref.current),
        () => setTouched(true),
        (fn) => {
          resetRef.current = fn;
        },
      );
    })();

    return () => {
      cancelled = true;
      teardown();
    };
  }, [arena, word, blocks]);

  return { touched, reset };
}

function start(
  M: typeof Matter,
  arenaEl: HTMLElement,
  wordEl: HTMLElement,
  blockEls: (HTMLElement | null)[],
  onTouch: () => void,
  registerReset: (fn: () => void) => void,
) {
  const { Engine, Bodies, Body, Composite, Constraint, Sleeping, Vector } = M;
  const letters = Array.from(wordEl.querySelectorAll<HTMLElement>("[data-letter]"));

  const engine = Engine.create({ enableSleeping: true, gravity: { x: 0, y: 1.5 } });
  engine.positionIterations = 10;
  engine.velocityIterations = 8;

  let glyphs: Glyph[] = [];
  let bodies: Matter.Body[] = [];
  let blockBodies: Matter.Body[] = [];
  let raf = 0;
  let last = 0;
  let acc = 0;
  let calm = 0;
  let disposed = false;
  let touchedOnce = false;
  let moved = false;
  let drag: {
    index: number;
    constraint: Matter.Constraint;
    pointerId: number;
    startX: number;
    startY: number;
  } | null = null;

  const arenaBox = () => {
    const rect = arenaEl.getBoundingClientRect();
    const scale = rect.width / arenaEl.offsetWidth || 1;
    return { rect, scale, width: arenaEl.offsetWidth, height: arenaEl.offsetHeight };
  };

  const rectInArena = (el: HTMLElement) => {
    const { rect, scale } = arenaBox();
    const r = el.getBoundingClientRect();
    return {
      x: (r.left - rect.left) / scale,
      y: (r.top - rect.top) / scale,
      w: r.width / scale,
      h: r.height / scale,
    };
  };

  /** Measure each letter's real ink box so bodies hug the glyphs, not the line box. */
  const measure = () => {
    for (const letter of letters) letter.style.transform = "";
    const context = document.createElement("canvas").getContext("2d");
    glyphs = letters.map((letter) => {
      const box = rectInArena(letter);
      const style = getComputedStyle(letter);
      let inkLeft = 0;
      let inkRight = box.w;
      let ascent = box.h * 0.7;
      let descent = 0;
      let baseline = box.h * 0.8;
      if (context) {
        context.font = `${style.fontStyle} ${style.fontWeight} ${parseFloat(style.fontSize)}px ${style.fontFamily}`;
        const m = context.measureText(letter.textContent ?? "");
        inkLeft = -m.actualBoundingBoxLeft;
        inkRight = m.actualBoundingBoxRight;
        ascent = m.actualBoundingBoxAscent;
        descent = m.actualBoundingBoxDescent;
        const fontAscent = m.fontBoundingBoxAscent || box.h * 0.8;
        const fontDescent = m.fontBoundingBoxDescent || box.h * 0.2;
        baseline = (box.h - (fontAscent + fontDescent)) / 2 + fontAscent;
      }
      const originX = (inkLeft + inkRight) / 2;
      const originY = baseline - (ascent - descent) / 2;
      letter.style.transformOrigin = `${originX}px ${originY}px`;
      return {
        cx: box.x + originX,
        cy: box.y + originY,
        width: Math.max(4, inkRight - inkLeft),
        height: Math.max(4, ascent + descent),
      };
    });
  };

  const buildBlocks = () => {
    if (blockBodies.length) Composite.remove(engine.world, blockBodies);
    blockBodies = [];
    for (const el of blockEls) {
      if (!el) continue;
      const r = rectInArena(el);
      if (r.w < 1 || r.h < 1) continue;
      const cornerRadius = getComputedStyle(el).borderTopLeftRadius;
      const radius = parseFloat(cornerRadius);
      const round = cornerRadius.endsWith("%") ? radius >= 50 : radius >= Math.min(r.w, r.h) / 2 - 1;
      const options = { isStatic: true, friction: 0.6 };
      blockBodies.push(
        round
          ? Bodies.circle(r.x + r.w / 2, r.y + r.h / 2, Math.min(r.w, r.h) / 2, options, 40)
          : Bodies.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h, options),
      );
    }
    Composite.add(engine.world, blockBodies);
  };

  const render = () => {
    for (let i = 0; i < letters.length; i++) {
      const body = bodies[i];
      const g = glyphs[i];
      if (!body || !g) continue;
      letters[i].style.transform = `translate3d(${body.position.x - g.cx}px, ${
        body.position.y - g.cy
      }px, 0) rotate(${body.angle}rad)`;
    }
  };

  const willChange = (on: boolean) => {
    for (const letter of letters) letter.style.willChange = on ? "transform" : "";
  };

  const sleepAll = () => {
    for (const body of bodies) {
      Body.setVelocity(body, { x: 0, y: 0 });
      Body.setAngularVelocity(body, 0);
      Sleeping.set(body, true);
    }
  };

  const stopLoop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
    willChange(false);
  };

  const stepSim = () => {
    if (drag) Sleeping.set(bodies[drag.index], false);
    Engine.update(engine, STEP);
    const moving = bodies.some(
      (body) => !body.isSleeping && (body.speed > 0.12 || Math.abs(body.angularSpeed) > 0.004),
    );
    calm = moving || drag ? 0 : calm + 1;
  };

  const tick = (now: number) => {
    raf = 0;
    if (disposed) return;
    acc += Math.min(now - last, 50);
    last = now;
    while (acc >= STEP) {
      stepSim();
      acc -= STEP;
    }
    render();
    if (calm >= CALM_STEPS) {
      sleepAll();
      render();
      stopLoop();
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  const startLoop = () => {
    if (raf || disposed) return;
    calm = 0;
    last = performance.now();
    acc = 0;
    willChange(true);
    raf = requestAnimationFrame(tick);
  };

  /** Put every letter back exactly where the text lays it out, asleep. */
  const build = () => {
    stopLoop();
    if (drag) {
      Composite.remove(engine.world, drag.constraint);
      drag = null;
    }
    Composite.clear(engine.world, false);
    measure();

    const { width, height } = arenaBox();
    const thick = 600;
    const floorTop = height - FLOOR_INSET;
    Composite.add(engine.world, [
      Bodies.rectangle(width / 2, floorTop + thick / 2, width * 4, thick, {
        isStatic: true,
        friction: 0.8,
      }),
      Bodies.rectangle(-thick / 2, height / 2 - height, thick, height * 4, { isStatic: true }),
      Bodies.rectangle(width + thick / 2, height / 2 - height, thick, height * 4, {
        isStatic: true,
      }),
    ]);

    bodies = glyphs.map((g) =>
      Bodies.rectangle(g.cx, g.cy, g.width * 0.86, g.height * 0.92, {
        chamfer: { radius: Math.min(3, g.width / 4, g.height / 4) },
        restitution: 0.18,
        friction: 0.55,
        frictionStatic: 0.9,
        frictionAir: 0.02,
        density: 0.002,
        sleepThreshold: 40,
      }),
    );
    Composite.add(engine.world, bodies);
    buildBlocks();
    sleepAll();
    render();
  };

  // --- Dragging -------------------------------------------------------------
  const toArena = (event: PointerEvent) => {
    const { rect, scale, width, height } = arenaBox();
    return {
      x: Math.min(Math.max((event.clientX - rect.left) / scale, 0), width),
      y: Math.min(Math.max((event.clientY - rect.top) / scale, 0), height),
    };
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const letter = event.currentTarget as HTMLElement;
    const index = letters.indexOf(letter);
    const body = bodies[index];
    if (!body || drag) return;
    event.preventDefault();
    letter.setPointerCapture(event.pointerId);
    letter.dataset.dragging = "true";
    moved = false;

    const point = toArena(event);
    const local = Vector.rotate(
      { x: point.x - body.position.x, y: point.y - body.position.y },
      -body.angle,
    );
    const constraint = Constraint.create({
      pointA: point,
      bodyB: body,
      pointB: local,
      stiffness: 0.14,
      damping: 0.12,
      length: 0,
    });
    Composite.add(engine.world, constraint);
    Sleeping.set(body, false);
    drag = {
      index,
      constraint,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };

    if (!touchedOnce) {
      touchedOnce = true;
      onTouch();
    }
    startLoop();
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > DRAG_THRESHOLD) {
      moved = true;
    }
    const target = toArena(event);
    const body = bodies[drag.index];
    const grab = Vector.add(
      body.position,
      Vector.rotate(drag.constraint.pointB ?? { x: 0, y: 0 }, body.angle),
    );
    const pull = Vector.sub(target, grab);
    const length = Vector.magnitude(pull);
    drag.constraint.pointA =
      length > MAX_PULL ? Vector.add(grab, Vector.mult(pull, MAX_PULL / length)) : target;
    startLoop();
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    delete letters[drag.index].dataset.dragging;
    Composite.remove(engine.world, drag.constraint);
    drag = null;
    startLoop();
  };

  /** A real drag must not also follow the link the letter belongs to. */
  const onClick = (event: MouseEvent) => {
    if (!moved) return;
    event.preventDefault();
    event.stopPropagation();
    moved = false;
  };

  for (const letter of letters) {
    letter.addEventListener("pointerdown", onPointerDown);
    letter.addEventListener("pointermove", onPointerMove);
    letter.addEventListener("pointerup", onPointerUp);
    letter.addEventListener("pointercancel", onPointerUp);
    letter.addEventListener("click", onClick);
  }

  // --- Layout changes -------------------------------------------------------
  // Anything that moves the text (resize, opening the GitHub chart) resets the letters
  // to the new layout so they never drift away from where the text sits.
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const sizeOf = () =>
    `${arenaEl.offsetWidth}x${arenaEl.offsetHeight}:${wordEl.offsetWidth}x${wordEl.offsetHeight}`;
  let lastSize = sizeOf();
  const layoutObserver = new ResizeObserver(() => {
    const size = sizeOf();
    if (size === lastSize) return;
    lastSize = size;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(build, 150);
  });
  layoutObserver.observe(arenaEl);
  layoutObserver.observe(wordEl);
  if (wordEl.parentElement) layoutObserver.observe(wordEl.parentElement);

  registerReset(build);
  build();

  return () => {
    disposed = true;
    stopLoop();
    clearTimeout(resizeTimer);
    layoutObserver.disconnect();
    for (const letter of letters) {
      letter.removeEventListener("pointerdown", onPointerDown);
      letter.removeEventListener("pointermove", onPointerMove);
      letter.removeEventListener("pointerup", onPointerUp);
      letter.removeEventListener("pointercancel", onPointerUp);
      letter.removeEventListener("click", onClick);
      letter.style.transform = "";
      letter.style.willChange = "";
    }
    Composite.clear(engine.world, false);
    Engine.clear(engine);
  };
}
