import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";

const HEADER_H = 56; // высота шапки предпросмотра

const DEVICES = [
  {
    id: "mobile",
    label: "Телефон",
    icon: "Smartphone",
    frameW: 390,
    frameH: 844,
    shellW: 414, // frameW + боковые отступы рамки (12*2)
    shellH: 916, // frameH + top/bottom рамка + home-bar
    desc: "iPhone 14 Pro · 390×844",
  },
  {
    id: "tablet",
    label: "Планшет",
    icon: "Tablet",
    frameW: 768,
    frameH: 1024,
    shellW: 792,
    shellH: 1072,
    desc: "iPad · 768×1024",
  },
  {
    id: "desktop",
    label: "Компьютер",
    icon: "Monitor",
    frameW: 1280,
    frameH: 800,
    shellW: 1280,
    shellH: 844, // + browser chrome
    desc: "Desktop · 1280×800",
  },
];

interface Props {
  onNavigate: (p: string) => void;
}

export default function PreviewPage({ onNavigate }: Props) {
  const [active, setActive] = useState("mobile");
  const [key, setKey] = useState(0);
  const [scale, setScale] = useState(1);

  const device = DEVICES.find((d) => d.id === active)!;
  const siteUrl = window.location.origin + window.location.pathname;
  const isDesktop = active === "desktop";

  useEffect(() => {
    const calc = () => {
      const availW = window.innerWidth - 48;
      const availH = window.innerHeight - HEADER_H - 48; // 48 — py-6
      const scaleW = availW / device.shellW;
      const scaleH = availH / device.shellH;
      setScale(Math.min(scaleW, scaleH, 1));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [active, device]);

  return (
    <div className="h-screen bg-gray-950 flex flex-col overflow-hidden">
      {/* Шапка */}
      <div
        className="bg-gray-900 border-b border-gray-800 z-30 shrink-0"
        style={{ height: HEADER_H }}
      >
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center gap-4">
          <button
            onClick={() => onNavigate("admin")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Icon name="Eye" size={18} className="text-red-500" />
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              Предпросмотр
            </span>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActive(d.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    active === d.id
                      ? "bg-gray-900 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon name={d.icon as "Smartphone"} size={15} />
                  <span className="hidden sm:inline">{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-xs hidden md:block">{device.desc}</span>
            <button
              onClick={() => setKey((k) => k + 1)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
              title="Обновить"
            >
              <Icon name="RefreshCw" size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Область предпросмотра */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {/* Обёртка масштабирования */}
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "center center",
            transition: "transform 0.2s ease",
            // Занимаем ровно размер устройства чтоб scale не создавал скролл
            width: device.shellW,
            height: device.shellH,
            flexShrink: 0,
          }}
        >
          {isDesktop ? (
            /* Десктоп */
            <div style={{ width: device.frameW }}>
              <div className="bg-gray-800 rounded-t-2xl px-4 py-2.5 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-lg px-4 py-1 text-gray-400 text-xs font-mono truncate">
                  {siteUrl}
                </div>
              </div>
              <div
                className="bg-white overflow-hidden rounded-b-2xl shadow-2xl"
                style={{ height: device.frameH }}
              >
                <iframe
                  key={key}
                  src={siteUrl}
                  className="border-0 block"
                  style={{ width: device.frameW, height: device.frameH }}
                  title="Предпросмотр"
                />
              </div>
            </div>
          ) : (
            /* Мобильный / Планшет */
            <div
              className="relative bg-gray-800 rounded-[44px] shadow-2xl shadow-black/70 border-2 border-gray-700"
              style={{ width: device.shellW, height: device.shellH, padding: "12px" }}
            >
              {/* Вырез камеры (только телефон) */}
              {active === "mobile" && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-900 rounded-full z-10" />
              )}

              {/* Экран */}
              <div
                className="bg-black rounded-[34px] overflow-hidden"
                style={{ width: device.frameW, height: device.frameH }}
              >
                <iframe
                  key={key}
                  src={siteUrl}
                  className="border-0 block"
                  style={{ width: device.frameW, height: device.frameH }}
                  title="Предпросмотр"
                />
              </div>

              {/* Home-bar */}
              {active === "mobile" && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-1 bg-gray-500 rounded-full" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
