import LandingBoard from "@/components/LandingBoard";
import SwitchPanel from "@/components/SwitchPanel";
import { site } from "@/lib/content";

export default function Home() {
  return (
    <main id="main" className="landing">
      <h1 className="visually-hidden">{site.name}. Backends that stay honest under load.</h1>
      <LandingBoard />
      <SwitchPanel />
    </main>
  );
}
