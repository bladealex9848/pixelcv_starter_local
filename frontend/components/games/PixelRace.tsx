"use client";

import { useState, useCallback, useEffect, useRef } from 'react';

interface PixelRaceProps {
  isAuthenticated: boolean;
  onGameEnd: (score: number, won: boolean, moves: number, timeSeconds: number, gameData: any) => void;
}

// ============================================================================
// ASSETS (reemplazados con CSS/colors ya que no tenemos imágenes PNG)
// ============================================================================

const ASSETS = {
  COLOR: {
    TAR: ["#959298", "#9c9a9d"],
    RUMBLE: ["#959298", "#f5f2f6"],
    GRASS: ["#eedccd", "#e6d4c5"],
  },
  IMAGE: {
    TREE: { src: "", width: 132, height: 192 }, // Se dibujará con CSS
    HERO: { src: "", width: 110, height: 56 },
    CAR: { src: "", width: 50, height: 36 },
    FINISH: { src: "", width: 339, height: 180, offset: -0.5 },
    SKY: { src: "" },
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const timestamp = () => new Date().getTime();
const accelerate = (v: number, accel: number, dt: number) => v + accel * dt;
const isCollide = (x1: number, w1: number, x2: number, w2: number) => (x1 - x2) ** 2 <= (w2 + w1) ** 2;

function getRand(min: number, max: number) {
  return (Math.random() * (max - min) + min) | 0;
}

function randomProperty(obj: any) {
  let keys = Object.keys(obj);
  return obj[keys[(keys.length * Math.random()) << 0]];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max));
}

function pad(value: number, numZeros: number, char: number | string = 0): string {
  let n = Math.abs(value);
  let zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
  let zeroString = Math.pow(10, zeros)
    .toString()
    .substr(1)
    .replace("0", char.toString());
  return zeroString + n;
}

// ============================================================================
// CLASSES
// ============================================================================

class Line {
  x = 0;
  y = 0;
  z = 0;
  X = 0;
  Y = 0;
  W = 0;
  curve = 0;
  scale = 0;
  elements: HTMLElement[] = [];
  special: any = null;

  project(camX: number, camY: number, camZ: number, halfWidth: number, height: number, roadW: number) {
    this.scale = 0.2 / (this.z - camZ);
    this.X = (1 + this.scale * (this.x - camX)) * halfWidth;
    this.Y = Math.ceil(((1 - this.scale * (this.y - camY)) * height) / 2);
    this.W = this.scale * roadW * halfWidth;
  }

  clearSprites() {
    for (let e of this.elements) {
      if (e) e.style.background = "transparent";
    }
  }

  drawSprite(depth: number, layer: number | HTMLElement, sprite: any, offset: number, containerWidth: number) {
    let destX = this.X + this.scale * (containerWidth / 2) * offset;
    let destY = this.Y + 4;
    let destW = (sprite.width * this.W) / 265;
    let destH = (sprite.height * this.W) / 265;

    destX += destW * offset;
    destY += destH * -1;

    let obj = layer instanceof HTMLElement ? layer : this.elements[(layer as number) + 6];
    if (!obj) return;

    // Si es un coche enemigo, dibujar con CSS
    if (sprite === ASSETS.IMAGE.CAR) {
      obj.style.background = '#ef4444';
      obj.style.width = destW + 'px';
      obj.style.height = destH + 'px';
      obj.style.left = destX + 'px';
      obj.style.top = destY + 'px';
      obj.style.zIndex = depth.toString();
      return;
    }

    // Si es un árbol, dibujar con CSS
    if (sprite === ASSETS.IMAGE.TREE) {
      obj.style.background = '#1a5c3a';
      obj.style.borderRadius = '50%';
      obj.style.width = destW + 'px';
      obj.style.height = destH + 'px';
      obj.style.left = destX + 'px';
      obj.style.top = destY + 'px';
      obj.style.zIndex = depth.toString();
      return;
    }

    // Meta de llegada
    if (sprite === ASSETS.IMAGE.FINISH) {
      obj.style.background = '#fbbf24';
      obj.style.width = destW + 'px';
      obj.style.height = destH + 'px';
      obj.style.left = destX + 'px';
      obj.style.top = destY + 'px';
      obj.style.zIndex = depth.toString();
      return;
    }
  }
}

class Car {
  pos: number;
  type: any;
  lane: number;
  element: HTMLElement;

  constructor(pos: number, type: any, lane: number, road: HTMLElement) {
    this.pos = pos;
    this.type = type;
    this.lane = lane;

    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.background = "#ef4444";
    road.appendChild(element);
    this.element = element;
  }
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function PixelRace({ isAuthenticated, onGameEnd }: PixelRaceProps) {
  // Container refs
  const gameRef = useRef<HTMLDivElement>(null);
  const roadRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const hudRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const highscoreRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const lapRef = useRef<HTMLSpanElement>(null);
  const tachoRef = useRef<HTMLSpanElement>(null);

  // Game state refs
  const linesRef = useRef<Line[]>([]);
  const carsRef = useRef<Car[]>([]);
  const inGameRef = useRef(false);
  const startRef = useRef(0);
  const playerXRef = useRef(0);
  const speedRef = useRef(0);
  const scoreValRef = useRef(0);
  const posRef = useRef(0);
  const cloudOffsetRef = useRef(0);
  const sectionProgRef = useRef(0);
  const mapIndexRef = useRef(0);
  const countDownRef = useRef(0);
  const highscoresRef = useRef<string[]>([]);

  const thenRef = useRef(timestamp());

  // Constants
  const width = 800;
  const halfWidth = width / 2;
  const height = 500;
  const roadW = 4000;
  const segL = 200;
  const H = 1500;
  const N = 70;

  const maxSpeed = 200;
  const accel = 38;
  const breaking = -80;
  const decel = -40;
  const maxOffSpeed = 40;
  const offDecel = -70;
  const enemy_speed = 8;
  const hitSpeed = 20;

  const LANE = { A: -2.3, B: -0.5, C: 1.2 };
  const mapLength = 15000;
  const targetFrameRate = 1000 / 25;

  // UI State
  const [gameStarted, setGameStarted] = useState(false);

  // ============================================================================
  // MAP GENERATION
  // ============================================================================

  const genMap = useCallback(() => {
    let map: any[] = [];
    let i = 0;

    for (; i < mapLength; i += getRand(0, 50)) {
      let section = {
        from: i,
        to: (i = i + getRand(300, 600)),
      };

      let randHeight = getRand(-5, 5);
      let randCurve = getRand(5, 30) * (Math.random() >= 0.5 ? 1 : -1);
      let randInterval = getRand(20, 40);

      if (Math.random() > 0.9)
        Object.assign(section, {
          curve: () => randCurve,
          height: () => randHeight,
        });
      else if (Math.random() > 0.8)
        Object.assign(section, {
          curve: () => 0,
          height: (i: number) => Math.sin(i / randInterval) * 1000,
        });
      else if (Math.random() > 0.8)
        Object.assign(section, {
          curve: () => 0,
          height: () => randHeight,
        });
      else
        Object.assign(section, {
          curve: () => randCurve,
          height: () => 0,
        });

      map.push(section);
    }

    map.push({
      from: i,
      to: i + N,
      curve: () => 0,
      height: () => 0,
      special: ASSETS.IMAGE.FINISH,
    });
    map.push({ from: Infinity });
    return map;
  }, []);

  const mapRef = useRef<any[]>([]);

  // ============================================================================
  // DRAW FUNCTIONS
  // ============================================================================

  const drawQuad = useCallback((
    element: HTMLElement,
    layer: number,
    color: string,
    x1: number,
    y1: number,
    w1: number,
    x2: number,
    y2: number,
    w2: number
  ) => {
    element.style.zIndex = layer.toString();
    element.style.background = color;
    element.style.position = "absolute";
    element.style.top = y2 + "px";
    element.style.left = (x1 - w1 / 2 - w1) + "px";
    element.style.width = (w1 * 3) + "px";
    element.style.height = (y1 - y2) + "px";

    let leftOffset = w1 + x2 - x1 + Math.abs(w2 / 2 - w1 / 2);
    element.style.clipPath = `polygon(${leftOffset}px 0, ${leftOffset + w2}px 0, 66.66% 100%, 33.33% 100%)`;
  }, []);

  // ============================================================================
  // GAME LOOP
  // ============================================================================

  const update = useCallback((step: number) => {
    if (!roadRef.current || !heroRef.current || !cloudRef.current || !textRef.current ||
        !timeRef.current || !scoreRef.current || !lapRef.current || !tachoRef.current ||
        !homeRef.current || !hudRef.current || !highscoreRef.current) return;

    const hero = heroRef.current;
    const cloud = cloudRef.current;
    const text = textRef.current;
    const time = timeRef.current;
    const score = scoreRef.current;
    const lap = lapRef.current;
    const tacho = tachoRef.current;
    const home = homeRef.current;
    const hud = hudRef.current;
    const highscore = highscoreRef.current;

    const lines = linesRef.current;
    const cars = carsRef.current;
    const map = mapRef.current;

    // Prepare this iteration
    posRef.current += speedRef.current;
    while (posRef.current >= N * segL) posRef.current -= N * segL;
    while (posRef.current < 0) posRef.current += N * segL;

    var startPos = (posRef.current / segL) | 0;
    let endPos = (startPos + N - 1) % N;

    scoreValRef.current += speedRef.current * step;
    countDownRef.current -= step;

    // Left / right position
    playerXRef.current -= (lines[startPos].curve / 5000) * step * speedRef.current;

    const keys = (window as any).KEYS || {};

    if (keys.ArrowRight) {
      hero.style.backgroundPosition = "-220px 0";
      playerXRef.current += 0.007 * step * speedRef.current;
    } else if (keys.ArrowLeft) {
      hero.style.backgroundPosition = "0 0";
      playerXRef.current -= 0.007 * step * speedRef.current;
    } else {
      hero.style.backgroundPosition = "-110px 0";
    }

    playerXRef.current = clamp(playerXRef.current, -3, 3);

    // Speed
    if (inGameRef.current && keys.ArrowUp)
      speedRef.current = accelerate(speedRef.current, accel, step);
    else if (keys.ArrowDown)
      speedRef.current = accelerate(speedRef.current, breaking, step);
    else
      speedRef.current = accelerate(speedRef.current, decel, step);

    if (Math.abs(playerXRef.current) > 0.55 && speedRef.current >= maxOffSpeed) {
      speedRef.current = accelerate(speedRef.current, offDecel, step);
    }

    speedRef.current = clamp(speedRef.current, 0, maxSpeed);

    // Update map
    let current = map[mapIndexRef.current];
    let use = current.from < scoreValRef.current && current.to > scoreValRef.current;
    if (use) sectionProgRef.current += speedRef.current * step;
    lines[endPos].curve = use ? current.curve(sectionProgRef.current) : 0;
    lines[endPos].y = use ? current.height(sectionProgRef.current) : 0;
    lines[endPos].special = null;

    if (current.to <= scoreValRef.current) {
      mapIndexRef.current++;
      sectionProgRef.current = 0;
      lines[endPos].special = map[mapIndexRef.current].special;
    }

    // Win / lose + UI
    if (!inGameRef.current) {
      speedRef.current = accelerate(speedRef.current, breaking, step);
      speedRef.current = clamp(speedRef.current, 0, maxSpeed);
    } else if (countDownRef.current <= 0 || lines[startPos].special) {
      tacho.style.display = "none";

      home.style.display = "block";
      roadRef.current.style.opacity = "0.4";
      text.innerText = "INSERT COIN";

      highscoresRef.current.push(lap.innerText);
      highscoresRef.current.sort();
      updateHighscore();

      inGameRef.current = false;

      // Call game end callback
      onGameEnd(
        Math.floor(scoreValRef.current / 100),
        countDownRef.current > 0,
        0,
        Math.floor((timestamp() - startRef.current) / 1000),
        {
          distance: Math.floor(scoreValRef.current),
          time: lap.innerText,
          highscores: highscoresRef.current
        }
      );
    } else {
      time.innerText = pad(countDownRef.current | 0, 3);
      score.innerText = pad(scoreValRef.current | 0, 8);
      tacho.innerText = (speedRef.current | 0).toString();

      let cT = new Date(timestamp() - startRef.current);
      lap.innerText = `${cT.getMinutes()}'${pad(cT.getSeconds(), 2)}"${pad(cT.getMilliseconds(), 3)}`;
    }

    // Draw cloud
    cloud.style.backgroundPosition = `${(cloudOffsetRef.current -= lines[startPos].curve * step * speedRef.current * 0.13) | 0}px 0`;

    // Other cars
    for (let car of cars) {
      car.pos = (car.pos + enemy_speed * step) % N;

      // Respawn
      if ((car.pos | 0) === endPos) {
        if (speedRef.current < 30) car.pos = startPos;
        else car.pos = endPos - 2;
        car.lane = randomProperty(LANE);
      }

      // Collision
      const offsetRatio = 5;
      if (
        (car.pos | 0) === startPos &&
        isCollide(playerXRef.current * offsetRatio + LANE.B, 0.5, car.lane, 0.5)
      ) {
        speedRef.current = Math.min(hitSpeed, speedRef.current);
      }
    }

    // Draw road
    let maxy = height;
    let camH = H + lines[startPos].y;
    let x = 0;
    let dx = 0;

    for (let n = startPos; n < startPos + N; n++) {
      let l = lines[n % N];
      let level = N * 2 - n;

      // Update view
      l.project(
        playerXRef.current * roadW - x,
        camH,
        startPos * segL - (n >= N ? N * segL : 0),
        halfWidth,
        height,
        roadW
      );
      x += dx;
      dx += l.curve;

      // Clear assets
      l.clearSprites();

      // First draw section assets
      if (n % 10 === 0) l.drawSprite(level, 0, ASSETS.IMAGE.TREE, -2, width);
      if ((n + 5) % 10 === 0) l.drawSprite(level, 0, ASSETS.IMAGE.TREE, 1.3, width);

      if (l.special) l.drawSprite(level, 0, l.special, l.special.offset || 0, width);

      for (let car of cars)
        if ((car.pos | 0) === n % N)
          l.drawSprite(level, car.element, car.type, car.lane, width);

      // Update road
      if (l.Y >= maxy) continue;
      maxy = l.Y;

      let even = ((n / 2) | 0) % 2;
      let grass = ASSETS.COLOR.GRASS[even * 1];
      let rumble = ASSETS.COLOR.RUMBLE[even * 1];
      let tar = ASSETS.COLOR.TAR[even * 1];

      let p = lines[(n - 1) % N];

      for (let i = 0; i < 6; i++) {
        if (l.elements[i]) {
          if (i === 0) {
            drawQuad(l.elements[i], level, grass, width / 4, p.Y, halfWidth + 2, width / 4, l.Y, halfWidth);
          } else if (i === 1) {
            drawQuad(l.elements[i], level, grass, (width / 4) * 3, p.Y, halfWidth + 2, (width / 4) * 3, l.Y, halfWidth);
          } else if (i === 2) {
            drawQuad(l.elements[i], level, rumble, p.X, p.Y, p.W * 1.15, l.X, l.Y, l.W * 1.15);
          } else if (i === 3) {
            drawQuad(l.elements[i], level, tar, p.X, p.Y, p.W, l.X, l.Y, l.W);
          } else if (i === 4 && !even) {
            drawQuad(l.elements[i], level, ASSETS.COLOR.RUMBLE[1], p.X, p.Y, p.W * 0.4, l.X, l.Y, l.W * 0.4);
          } else if (i === 5 && !even) {
            drawQuad(l.elements[i], level, tar, p.X, p.Y, p.W * 0.35, l.X, l.Y, l.W * 0.35);
          }
        }
      }
    }
  }, [drawQuad, onGameEnd]);

  const updateHighscore = useCallback(() => {
    if (!highscoreRef.current) return;
    const highscore = highscoreRef.current;
    const highscores = highscoresRef.current;

    let hN = Math.min(12, highscores.length);
    for (let i = 0; i < hN; i++) {
      if (highscore.children[i]) {
        highscore.children[i].innerHTML = `${pad(i + 1, 2, "&nbsp;")}. ${highscores[i]}`;
      }
    }
  }, []);

  // ============================================================================
  // RESET
  // ============================================================================

  const reset = useCallback(() => {
    inGameRef.current = false;

    startRef.current = timestamp();
    countDownRef.current = mapRef.current[mapRef.current.length - 2].to / 130 + 10;

    playerXRef.current = 0;
    speedRef.current = 0;
    scoreValRef.current = 0;

    posRef.current = 0;
    cloudOffsetRef.current = 0;
    sectionProgRef.current = 0;
    mapIndexRef.current = 0;

    const lines = linesRef.current;
    for (let line of lines) line.curve = line.y = 0;

    if (textRef.current) {
      textRef.current.innerText = "INSERT COIN";
      textRef.current.classList.add("blink");
    }

    if (roadRef.current) roadRef.current.style.opacity = "0.4";
    if (hudRef.current) hudRef.current.style.display = "none";
    if (homeRef.current) homeRef.current.style.display = "block";
    if (tachoRef.current) tachoRef.current.style.display = "block";
  }, []);

  // ============================================================================
  // INIT
  // ============================================================================

  useEffect(() => {
    if (!gameRef.current || !roadRef.current || !heroRef.current || !cloudRef.current ||
        !hudRef.current || !homeRef.current || !textRef.current || !highscoreRef.current ||
        !timeRef.current || !scoreRef.current || !lapRef.current || !tachoRef.current) return;

    const game = gameRef.current;
    const road = roadRef.current;
    const hero = heroRef.current;
    const cloud = cloudRef.current;
    const hud = hudRef.current;
    const home = homeRef.current;
    const text = textRef.current;
    const highscore = highscoreRef.current;
    const time = timeRef.current;
    const score = scoreRef.current;
    const lap = lapRef.current;
    const tacho = tachoRef.current;

    game.style.width = width + "px";
    game.style.height = height + "px";

    hero.style.position = "absolute";
    hero.style.top = height - 80 + "px";
    hero.style.left = (halfWidth - ASSETS.IMAGE.HERO.width / 2) + "px";
    hero.style.background = "#f97316";
    hero.style.width = ASSETS.IMAGE.HERO.width + "px";
    hero.style.height = ASSETS.IMAGE.HERO.height + "px";
    hero.style.clipPath = "polygon(10% 0, 90% 0, 100% 40%, 100% 100%, 0 100%, 0 40%)";

    cloud.style.position = "absolute";
    cloud.style.left = "0";
    cloud.style.top = "0";
    cloud.style.width = "100%";
    cloud.style.height = "50%";
    cloud.style.background = "linear-gradient(#e6d4c5, #eedccd)";
    cloud.style.backgroundSize = "200px 100%";
    cloud.style.opacity = "0.3";

    road.style.position = "relative";
    road.style.width = "100%";
    road.style.height = "100%";
    road.style.overflow = "hidden";

    // Generate map
    mapRef.current = genMap();

    // Create cars
    carsRef.current.push(new Car(0, ASSETS.IMAGE.CAR, LANE.C, road));
    carsRef.current.push(new Car(10, ASSETS.IMAGE.CAR, LANE.B, road));
    carsRef.current.push(new Car(20, ASSETS.IMAGE.CAR, LANE.C, road));
    carsRef.current.push(new Car(35, ASSETS.IMAGE.CAR, LANE.C, road));
    carsRef.current.push(new Car(50, ASSETS.IMAGE.CAR, LANE.A, road));
    carsRef.current.push(new Car(60, ASSETS.IMAGE.CAR, LANE.B, road));
    carsRef.current.push(new Car(70, ASSETS.IMAGE.CAR, LANE.A, road));

    // Create lines
    for (let i = 0; i < N; i++) {
      var line = new Line();
      line.z = i * segL + 270;

      for (let j = 0; j < 6 + 2; j++) {
        var element = document.createElement("div");
        element.style.position = "absolute";
        road.appendChild(element);
        line.elements.push(element);
      }

      linesRef.current.push(line);
    }

    // Create highscore elements
    for (let i = 0; i < 12; i++) {
      var element = document.createElement("p");
      element.style.color = "#f97316";
      element.style.fontSize = "12px";
      element.style.fontFamily = "monospace";
      element.style.margin = "2px";
      highscore.appendChild(element);
    }
    updateHighscore();

    reset();

    setGameStarted(true);

    // Key handlers
    const keyUpdate = (e: KeyboardEvent) => {
      if (!(window as any).KEYS) (window as any).KEYS = {};
      (window as any).KEYS[e.code] = e.type === "keydown";

      // Start game with C
      if (e.type === "keyup" && e.code === "KeyC" && !inGameRef.current) {
        e.preventDefault();

        // Countdown sequence
        const startCountdown = async () => {
          if (textRef.current) {
            textRef.current.classList.remove("blink");
            textRef.current.innerText = "3";
          }

          await new Promise(resolve => setTimeout(resolve, 1000));

          if (textRef.current) textRef.current.innerText = "2";

          await new Promise(resolve => setTimeout(resolve, 1000));

          if (textRef.current) textRef.current.innerText = "1";

          await new Promise(resolve => setTimeout(resolve, 1000));

          reset();

          if (homeRef.current) homeRef.current.style.display = "none";
          if (roadRef.current) roadRef.current.style.opacity = "1";
          if (heroRef.current) heroRef.current.style.display = "block";
          if (hudRef.current) hudRef.current.style.display = "block";

          inGameRef.current = true;
          startRef.current = timestamp();
        };

        startCountdown();

        return;
      }

      // Reset with Escape
      if (e.type === "keyup" && e.code === "Escape") {
        e.preventDefault();
        reset();
        return;
      }

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", keyUpdate);
    window.addEventListener("keyup", keyUpdate);

    // START GAME LOOP
    const loop = () => {
      requestAnimationFrame(loop);

      let now = timestamp();
      let delta = now - thenRef.current;

      if (delta > targetFrameRate) {
        thenRef.current = now - (delta % targetFrameRate);
        update(delta / 1000);
      }
    };

    loop();

    return () => {
      window.removeEventListener("keydown", keyUpdate);
      window.removeEventListener("keyup", keyUpdate);
    };
  }, [genMap, update, updateHighscore, reset]);

  // ============================================================================
  // STYLES
  // ============================================================================

  return (
    <div className="flex flex-col items-center gap-4">
      <style jsx>{`
        .blink {
          animation: blink 1s infinite;
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>

      <div ref={gameRef} className="relative bg-[#1a1a2e] rounded-lg overflow-hidden">
        <div ref={roadRef}>
          <div ref={cloudRef}></div>
          <div ref={heroRef}></div>
        </div>

        <div ref={hudRef} className="absolute top-4 left-4 right-4 flex justify-between text-white font-mono text-sm">
          <span ref={timeRef} className="topUI">0</span>
          <span ref={scoreRef} className="topUI">0</span>
          <span ref={lapRef} className="topUI">0'00"000</span>
          <span ref={tachoRef} className="absolute bottom-4 right-4 text-xl text-orange-400">0</span>
        </div>

        <div ref={homeRef} className="absolute inset-0 flex flex-col items-center justify-center text-white">
          <h1 className="text-6xl font-black italic text-orange-400 mb-4">DASH</h1>
          <p ref={textRef} className="blink text-2xl mb-4">INSERT COIN</p>
          <div ref={highscoreRef}></div>
        </div>
      </div>

      {/* Controls info */}
      <div className="text-center text-gray-400 text-xs space-y-1">
        <p><strong className="text-orange-400">C</strong> - Start</p>
        <p><strong className="text-orange-400">↑↓</strong> - Accelerate/Brake</p>
        <p><strong className="text-orange-400">←→</strong> - Steer</p>
        <p><strong className="text-orange-400">ESC</strong> - Reset</p>
      </div>
    </div>
  );
}
