// Line drawings built from what each station is about. Every stroke uses
// pathLength=1, so CSS can draw it from 0 to 1 with the station's --p
// (how centred it is on screen). Without JavaScript --p defaults to 1 and the
// drawings are simply complete.

type Props = { kind: "load" | "airline" | "camera" | "inspector"; className?: string };

function wobble(points: [number, number][]) {
  return points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
}

export default function Sketch({ kind, className = "" }: Props) {
  if (kind === "load") {
    // Requests climb and spike; p99 latency barely moves. The tagline, drawn.
    const req: [number, number][] = [];
    const lat: [number, number][] = [];
    for (let i = 0; i <= 40; i++) {
      const x = 20 + i * 11;
      const growth = 210 - i * 4.2;
      const spike = [9, 17, 26, 33].includes(i) ? -38 : i % 3 === 0 ? 10 : -6;
      req.push([x, Math.max(28, growth + spike)]);
      lat.push([x, 196 + Math.sin(i * 1.7) * 2.5]);
    }
    return (
      <svg className={`sketch sketch-load ${className}`} viewBox="0 0 480 260" role="img" aria-label="Chart: requests rise and spike while p99 latency stays flat">
        <path className="s-axis" pathLength={1} d="M20 20 V230 H470" />
        <path className="s-soft" pathLength={1} d={wobble(req)} />
        <path className="s-main" pathLength={1} d={wobble(lat)} />
        <text className="s-label" x="300" y="44">requests</text>
        <text className="s-label s-label-main" x="300" y="184">p99 latency</text>
      </svg>
    );
  }

  if (kind === "airline") {
    const states = [
      { x: 60, y: 200, t: "Scheduled" },
      { x: 180, y: 110, t: "Boarding" },
      { x: 320, y: 70, t: "Departed" },
      { x: 440, y: 150, t: "Arrived" },
    ];
    return (
      <svg className={`sketch ${className}`} viewBox="0 0 500 260" role="img" aria-label="Flight lifecycle: Scheduled, Boarding, Departed, Arrived">
        <path className="s-soft s-dash" pathLength={1} d="M60 200 C 110 120, 140 115, 180 110 S 270 60, 320 70 S 420 100, 440 150" />
        {states.map((s, i) => (
          <g key={s.t} className="s-node" style={{ "--k": i } as React.CSSProperties}>
            <circle cx={s.x} cy={s.y} r="9" />
            <text className="s-label" x={s.x} y={s.y + 32} textAnchor="middle">{s.t}</text>
          </g>
        ))}
        <path className="s-main" pathLength={1} d="M188 104 C 200 60, 150 60, 172 101" />
        <text className="s-label s-label-main" x="160" y="46" textAnchor="middle">boards once</text>
      </svg>
    );
  }

  if (kind === "camera") {
    // A simplified 21-point hand landmark skeleton inside a webcam frame.
    const wrist: [number, number] = [250, 220];
    const fingers: [number, number][][] = [
      [[205, 190], [180, 165], [165, 140], [155, 118]],
      [[222, 150], [214, 112], [209, 85], [206, 62]],
      [[250, 145], [250, 104], [250, 74], [250, 48]],
      [[276, 150], [284, 114], [289, 88], [292, 66]],
      [[296, 162], [314, 136], [326, 116], [336, 98]],
    ];
    return (
      <svg className={`sketch ${className}`} viewBox="0 0 500 260" role="img" aria-label="Hand landmarks tracked inside a webcam frame">
        <path className="s-axis" pathLength={1} d="M110 14 H390 V246 H110 Z" />
        <path className="s-soft" pathLength={1} d={wobble([wrist, fingers[0][0], fingers[1][0], fingers[2][0], fingers[3][0], fingers[4][0], wrist])} />
        {fingers.map((f, i) => (
          <path key={i} className="s-main" pathLength={1} d={wobble(f)} />
        ))}
        {[wrist, ...fingers.flat()].map(([x, y], i) => (
          <circle key={i} className="s-dot" cx={x} cy={y} r="3.2" style={{ "--k": i } as React.CSSProperties} />
        ))}
        <text className="s-label" x="400" y="40">peace?</text>
        <text className="s-label" x="400" y="60">pinch?</text>
        <text className="s-label s-label-main" x="400" y="80">open palm</text>
      </svg>
    );
  }

  const segments = ["SOI", "APP1  EXIF", "DQT", "SOF0", "DHT", "SOS", "EOI"];
  return (
    <svg className={`sketch ${className}`} viewBox="0 0 500 260" role="img" aria-label="A JPEG file walked segment by segment">
      {segments.map((s, i) => (
        <g key={s} className="s-node" style={{ "--k": i } as React.CSSProperties}>
          <path className={i === 1 ? "s-main" : "s-soft"} pathLength={1} d={`M60 ${22 + i * 32} H${i === 5 ? 330 : 250} V${46 + i * 32} H60 Z`} />
          <text className={i === 1 ? "s-label s-label-main" : "s-label"} x="74" y={39 + i * 32}>{s}</text>
        </g>
      ))}
      <circle className="s-main-fill-none" cx="380" cy="72" r="46" pathLength={1} />
      <path className="s-main" pathLength={1} d="M413 105 L460 152" />
      <text className="s-label" x="340" y="190">GPS 37.97, 23.72</text>
    </svg>
  );
}
