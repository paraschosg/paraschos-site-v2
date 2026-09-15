import { stack } from "@/lib/content";

// Each stack row is a strip that slides against the direction you travel,
// driven by the station's --d (its distance from centre). The first copy is the real text; the
// repeats only fill the strip and are hidden from assistive technology.
export default function StackStrips() {
  return (
    <dl className="strips">
      {Object.entries(stack).map(([group, items], i) => (
        <div key={group} className="strip" style={{ "--dir": i % 2 ? 1 : -1 } as React.CSSProperties}>
          <dt>{group}</dt>
          <dd>
            <span className="strip-run">
              <span>{items.join(" / ")}</span>
              <span aria-hidden="true">{items.join(" / ")}</span>
              <span aria-hidden="true">{items.join(" / ")}</span>
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
