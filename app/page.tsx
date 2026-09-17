import FlipBoard from "@/components/FlipBoard";
import Dock from "@/components/Dock";
import { site } from "@/lib/content";

const MESSAGE = `${site.name}\nBackends that stay\nhonest under load.`;

export default function Home() {
  return (
    <main id="main" className="landing">
      <h1 className="visually-hidden">{MESSAGE.replace(/\n/g, " ")}</h1>
      <FlipBoard text={MESSAGE} />
      <Dock />
    </main>
  );
}
