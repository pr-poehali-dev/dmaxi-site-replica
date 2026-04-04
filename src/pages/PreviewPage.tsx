import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const DEVICES = [
  {
    id: "mobile",
    label: "Телефон",
    icon: "Smartphone",
    frameW: 390,
    frameH: 844,
    siteW: 390,
    desc: "iPhone 14 Pro · 390×844",
  },
  {
    id: "tablet",
    label: "Планшет",
    icon: "Tablet",
    frameW: 768,
    frameH: 1024,
    siteW: 768,
    desc: "iPad · 768×1024",
  },
  {
    id: "desktop",
    label: "Компьютер",
    icon: "Monitor",
    frameW: 1280,
    frameH: 800,
    siteW: 1280,
    desc: "Desktop · 1280×800",
  },
];

interface Props {
  onNavigate: (p: string) => void;
}

export default function PreviewPage({ onNavigate }: Props) {
  const [active, setActive] = useState("mobile");
  const [key, setKey] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const device = DEVICES.find((d) => d.id === active)!;
  const siteUrl = window.location.origin + window.location.pathname;
  const isDesktop = active === "desktop";

  // Вычисляем масштаб: вписываем устройство в доступное пространство
  useEffect(() => {
    const calc = () => {
      if (!wrapRef.current) return;
      const availW = wrapRef.current.clientWidth - 48; // отступы
      const availH = wrapRef.current.clientHeight - 80;
      const totalW = device.frameW + (isDesktop ? 0 : 24); // + рамка
      const totalH = device.frameH + (isDesktop ? 44 : 60);
      const scaleW = availW / totalW;
      const scaleH = availH / totalH;
      setScale(Math.min(scaleW, scaleH, 1));
    };
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, [active, device, isDesktop]);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Шапка */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => onNavigate("admin")}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Icon name="Eye" size={18} className="text-red-500" />
            <span className="text-white font-bold text-sm uppercase tracking-wide">
              Предпросмотр сайта
            </span>
          </div>

          {/* Переключатели устройств */}
          <div className="flex-1 flex justify-center">
            <div className="flex bg-gray-800 rounded-xl p-1 gap-1">
              {DEVICES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setActive(d.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active === d.id
                      ? "bg-gray-900 text-white shadow"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  <Icon name={d.icon as "Smartphone"} size={15} />
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Описание и обновить */}
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
      <div
        ref={wrapRef}
        className="flex-1 flex items-center justify-center overflow-hidden py-6 px-4"
        style={{ minHeight: 0 }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            transition: "transform 0.2s ease",
          }}
        >
          {isDesktop ? (
            /* Десктоп */
            <div style={{ width: device.frameW }}>
              <div className="bg-gray-800 rounded-t-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex-1 bg-gray-700 rounded-lg px-4 py-1.5 text-gray-400 text-xs font-mono truncate">
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
                  className="border-0"
                  style={{ width: device.siteW, height: device.frameH, display: "block" }}
                  title="Предпросмотр"
                />
              </div>
            </div>
          ) : (
            /* Мобильный / Планшет */
            <div style={{ width: device.frameW + 24 }}>
              <div className="relative bg-gray-800 rounded-[36px] p-3 shadow-2xl shadow-black/60 border border-gray-700">
                {/* Вырез камеры */}
                {active === "mobile" && (
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full z-10" />
                )}
                {/* Экран */}
                <div
                  className="bg-white rounded-[28px] overflow-hidden"
                  style={{ width: device.frameW, height: device.frameH }}
                >
                  <iframe
                    key={key}
                    src={siteUrl}
                    className="border-0"
                    style={{
                      width: device.siteW,
                      height: device.frameH,
                      display: "block",
                    }}
                    title="Предпросмотр"
                  />
                </div>
                {/* Полоска Home */}
                {active === "mobile" && (
                  <div className="mt-2 flex justify-center">
                    <div className="w-28 h-1 bg-gray-600 rounded-full" />
                  </div>
                )}
              </div>
              <p className="text-center text-gray-500 text-xs mt-4">{device.desc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
