import { useState } from "react";
import Icon from "@/components/ui/icon";

const DEVICES = [
  {
    id: "mobile",
    label: "Телефон",
    icon: "Smartphone",
    width: 390,
    height: 844,
    desc: "iPhone 14 Pro · 390×844",
  },
  {
    id: "tablet",
    label: "Планшет",
    icon: "Tablet",
    width: 768,
    height: 1024,
    desc: "iPad · 768×1024",
  },
  {
    id: "desktop",
    label: "Компьютер",
    icon: "Monitor",
    width: 1280,
    height: 800,
    desc: "Desktop · 1280×800",
  },
];

interface Props {
  onNavigate: (p: string) => void;
}

export default function PreviewPage({ onNavigate }: Props) {
  const [active, setActive] = useState("mobile");
  const [key, setKey] = useState(0);

  const device = DEVICES.find((d) => d.id === active)!;
  const siteUrl = window.location.origin + window.location.pathname;

  const isDesktop = active === "desktop";

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
      <div className="flex-1 flex items-start justify-center overflow-auto py-8 px-4">
        {isDesktop ? (
          /* Десктоп — растягиваем на всю ширину */
          <div className="w-full max-w-6xl">
            {/* Рамка браузера */}
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
              style={{ height: `${device.height}px` }}
            >
              <iframe
                key={key}
                src={siteUrl}
                className="w-full h-full border-0"
                title="Предпросмотр"
              />
            </div>
          </div>
        ) : (
          /* Мобильный / планшет — фиксированная рамка устройства */
          <div
            style={{ width: `${device.width}px` }}
            className="shrink-0"
          >
            {/* Рамка устройства */}
            <div
              className={`relative bg-gray-800 rounded-[36px] p-3 shadow-2xl shadow-black/60 border border-gray-700`}
            >
              {/* Вырез */}
              {active === "mobile" && (
                <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-full z-10" />
              )}
              {/* Экран */}
              <div
                className="bg-white rounded-[28px] overflow-hidden"
                style={{ height: `${device.height}px` }}
              >
                <iframe
                  key={key}
                  src={siteUrl}
                  className="w-full h-full border-0"
                  style={{ width: `${device.width}px` }}
                  title="Предпросмотр"
                />
              </div>
              {/* Кнопка Home для мобильного */}
              {active === "mobile" && (
                <div className="mt-2 flex justify-center">
                  <div className="w-28 h-1 bg-gray-600 rounded-full" />
                </div>
              )}
            </div>

            {/* Подпись */}
            <p className="text-center text-gray-500 text-xs mt-4">{device.desc}</p>
          </div>
        )}
      </div>
    </div>
  );
}
