"use client";

import { useEffect, useState } from "react";

export function ViewportDebug() {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    let events = 0;
    const read = (source: string) => {
      events += 1;
      const vv = window.visualViewport;
      const dock = document.querySelector<HTMLElement>('[data-testid="chat-dock"]');
      const dockRect = dock?.getBoundingClientRect();
      const active = document.activeElement as HTMLElement | null;
      const activeRect = active?.getBoundingClientRect();
      setLines([
        `#${events} ${source}`,
        `vv h=${vv?.height.toFixed(0)} top=${vv?.offsetTop.toFixed(0)} pageTop=${vv?.pageTop.toFixed(0)}`,
        `innerH=${window.innerHeight} clientH=${document.documentElement.clientHeight} scrollY=${window.scrollY.toFixed(0)}`,
        `dock top=${dockRect?.top.toFixed(0)} h=${dockRect?.height.toFixed(0)} var=${dock?.style.getPropertyValue("--chat-dock-height")} bottom=${dock?.style.getPropertyValue("--chat-dock-bottom")}`,
        `active=${active?.tagName} bottom=${activeRect?.bottom.toFixed(0)}`,
      ]);
    };
    const onVv = () => read("vv");
    const onScroll = () => read("scroll");
    const onFocus = () => read("focus");
    window.visualViewport?.addEventListener("resize", onVv);
    window.visualViewport?.addEventListener("scroll", onVv);
    window.addEventListener("scroll", onScroll);
    document.addEventListener("focusin", onFocus);
    const timer = window.setInterval(() => read("tick"), 500);
    return () => {
      window.visualViewport?.removeEventListener("resize", onVv);
      window.visualViewport?.removeEventListener("scroll", onVv);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocus);
      window.clearInterval(timer);
    };
  }, []);
  return (
    <pre className="pointer-events-none fixed top-0 left-0 z-[100] m-0 bg-black/80 p-1 font-mono text-[10px] leading-tight text-white">
      {lines.join("\n")}
    </pre>
  );
}
