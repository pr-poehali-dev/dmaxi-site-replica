import { useState, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/context/AuthContext";

const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";

interface Receipt {
  id: number;
  type: string;
  type_label: string;
  amount: number;
  description: string;
  ref_id: string | null;
  receipt_number: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
  user_name?: string;
  user_phone?: string;
}

const TYPE_ICON: Record<string, string> = {
  topup:          "ArrowDownCircle",
  spend:          "ArrowUpCircle",
  shop_wallet:    "ShoppingBag",
  shop_card:      "CreditCard",
  service_card:   "Wrench",
  service_wallet: "Wrench",
  goods_card:     "Package",
  goods_wallet:   "Package",
  admin_adjust:   "Settings",
};

const TYPE_COLOR: Record<string, string> = {
  topup:          "text-green-600",
  spend:          "text-red-500",
  shop_wallet:    "text-blue-600",
  shop_card:      "text-blue-600",
  service_card:   "text-orange-500",
  service_wallet: "text-orange-500",
  goods_card:     "text-purple-600",
  goods_wallet:   "text-purple-600",
  admin_adjust:   "text-gray-500",
};

function formatDate(s: string) {
  const d = new Date(s);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const handlePrint = () => {
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <title>Чек ${receipt.receipt_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #111; background: #fff; padding: 32px 24px; max-width: 420px; margin: 0 auto; }
    .title { text-align: center; font-size: 22px; font-weight: 900; margin-bottom: 2px; }
    .subtitle { text-align: center; font-size: 11px; color: #888; margin-bottom: 12px; }
    .dashed { border-top: 1px dashed #bbb; margin: 12px 0; }
    .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
    .row .label { color: #666; }
    .row .value { font-weight: 600; text-align: right; max-width: 60%; }
    .mono { font-family: monospace; font-size: 11px; }
    .total-row { display: flex; justify-content: space-between; align-items: center; margin: 4px 0; }
    .total-label { font-size: 15px; font-weight: 700; }
    .total-amount { font-size: 22px; font-weight: 900; }
    .paid { text-align: center; color: #16a34a; font-weight: 700; font-size: 12px; margin-top: 4px; }
    .footer { text-align: center; color: #aaa; font-size: 11px; margin-top: 12px; }
    h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
  </style>
</head>
<body>
  <h2>Чек об оплате</h2>
  <div class="dashed"></div>
  <div class="title">DD MAXI</div>
  <div class="subtitle">Автосервис</div>
  <div class="dashed"></div>
  <div class="row"><span class="label">Номер чека</span><span class="value mono">${receipt.receipt_number}</span></div>
  <div class="row"><span class="label">Дата</span><span class="value">${formatDate(receipt.created_at)}</span></div>
  ${receipt.user_name ? `<div class="row"><span class="label">Клиент</span><span class="value">${receipt.user_name}</span></div>` : ""}
  <div class="row"><span class="label">Операция</span><span class="value">${receipt.type_label}</span></div>
  <div class="row"><span class="label">Описание</span><span class="value">${receipt.description}</span></div>
  ${receipt.ref_id ? `<div class="row"><span class="label">Ref ID</span><span class="value mono" style="font-size:10px">${receipt.ref_id}</span></div>` : ""}
  <div class="dashed"></div>
  <div class="total-row"><span class="total-label">ИТОГО</span><span class="total-amount">${receipt.amount.toLocaleString("ru-RU")} ₽</span></div>
  <div class="paid">✓ ОПЛАЧЕНО</div>
  <div class="dashed"></div>
  <div class="footer">Спасибо за использование сервисов DD MAXI</div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }</script>
</body>
</html>`;
    const w = window.open("", "_blank", "width=500,height=700");
    if (w) { w.document.write(html); w.document.close(); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 print:shadow-none"
        onClick={e => e.stopPropagation()}
        id="receipt-print-area"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Чек об оплате</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="border-t border-dashed border-gray-300 my-3" />

        <div className="text-center mb-4">
          <div className="text-2xl font-black text-gray-900">DD MAXI</div>
          <div className="text-xs text-gray-500">Автосервис</div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Номер чека</span>
            <span className="font-mono font-semibold text-gray-900">{receipt.receipt_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Дата</span>
            <span className="text-gray-900">{formatDate(receipt.created_at)}</span>
          </div>
          {receipt.user_name && (
            <div className="flex justify-between">
              <span className="text-gray-500">Клиент</span>
              <span className="text-gray-900">{receipt.user_name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500">Операция</span>
            <span className="text-gray-900">{receipt.type_label}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Описание</span>
            <span className="text-gray-900 text-right max-w-[60%]">{receipt.description}</span>
          </div>
          {receipt.ref_id && (
            <div className="flex justify-between">
              <span className="text-gray-500">Ref ID</span>
              <span className="font-mono text-xs text-gray-700">{receipt.ref_id}</span>
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        <div className="flex justify-between items-center">
          <span className="text-gray-700 font-semibold text-base">ИТОГО</span>
          <span className="text-2xl font-black text-gray-900">{receipt.amount.toLocaleString("ru-RU")} ₽</span>
        </div>
        <div className="text-center mt-1">
          <span className="text-xs text-green-600 font-semibold">✓ ОПЛАЧЕНО</span>
        </div>

        <div className="border-t border-dashed border-gray-300 my-4" />

        <div className="text-center text-xs text-gray-400">
          Спасибо за использование сервисов DD MAXI
        </div>

        <div className="flex gap-3 mt-5 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            <Icon name="Printer" size={16} /> Распечатать
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

interface Props {
  onNavigate: (page: string) => void;
  isAdmin?: boolean;
}

export default function ReceiptsPage({ onNavigate, isAdmin }: Props) {
  const { token, user } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Receipt | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(0);
  const [exporting, setExporting] = useState(false);
  const LIMIT = 20;

  const fetchReceipts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const action = isAdmin ? "admin_receipts" : "receipts";
      let url = `${WALLET_URL}?action=${action}&limit=${LIMIT}&offset=${page * LIMIT}`;
      if (isAdmin && typeFilter) url += `&type=${typeFilter}`;
      if (isAdmin && search) url += `&search=${encodeURIComponent(search)}`;
      const r = await fetch(url, { headers: { "X-Auth-Token": token } });
      const d = await r.json();
      setReceipts(d.receipts || []);
      setTotal(d.total || 0);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, typeFilter, search, page]);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);

  const handleExport = async () => {
    if (!token) return;
    setExporting(true);
    try {
      let url = `${WALLET_URL}?action=receipts_export`;
      if (isAdmin) url += "&all=1";
      if (dateFrom) url += `&date_from=${dateFrom}`;
      if (dateTo) url += `&date_to=${dateTo}`;
      const r = await fetch(url, { headers: { "X-Auth-Token": token } });
      const blob = await r.blob();
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `receipts_${new Date().toISOString().slice(0,10)}.csv`;
      link.click();
    } finally {
      setExporting(false);
    }
  };

  const filteredReceipts = isAdmin
    ? receipts
    : receipts.filter(r => {
        const q = search.toLowerCase();
        return !q || r.receipt_number.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.type_label.toLowerCase().includes(q);
      }).filter(r => !typeFilter || r.type === typeFilter);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Заголовок */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => onNavigate(isAdmin ? "admin" : "account")}
            className="p-2 rounded-xl hover:bg-gray-200 text-gray-600 transition-colors"
          >
            <Icon name="ArrowLeft" size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Хранилище чеков</h1>
            <p className="text-sm text-gray-500">
              {isAdmin ? "Все чеки пользователей" : "Ваши чеки и подтверждения оплаты"}
            </p>
          </div>
          <div className="ml-auto">
            <span className="bg-gray-900 text-white text-sm font-bold px-3 py-1 rounded-full">{total}</span>
          </div>
        </div>

        {/* Фильтры и экспорт */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder={isAdmin ? "Поиск по клиенту, номеру чека..." : "Поиск по описанию, номеру..."}
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="flex-1 min-w-40 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
            <select
              value={typeFilter}
              onChange={e => { setTypeFilter(e.target.value); setPage(0); }}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
            >
              <option value="">Все типы</option>
              <option value="topup">Пополнение кошелька</option>
              <option value="spend">Оплата с кошелька</option>
              <option value="shop_wallet">Магазин (кошелёк)</option>
              <option value="shop_card">Магазин (карта)</option>
              <option value="service_card">Услуга (карта)</option>
              <option value="service_wallet">Услуга (кошелёк)</option>
              <option value="goods_card">Автотовар (карта)</option>
              <option value="goods_wallet">Автотовар (кошелёк)</option>
            </select>
          </div>

          {/* Экспорт в Excel */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 items-end">
            <div>
              <label className="text-xs text-gray-500 block mb-1">С даты</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">По дату</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 bg-green-600 text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Icon name="Download" size={16} />
              {exporting ? "Выгружаю..." : "Выгрузить в Excel (CSV)"}
            </button>
          </div>
        </div>

        {/* Список чеков */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <Icon name="Loader" size={32} className="mx-auto mb-3 animate-spin" />
            <p>Загружаю чеки...</p>
          </div>
        ) : filteredReceipts.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Icon name="Receipt" size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-semibold">Чеков пока нет</p>
            <p className="text-sm mt-1">Они появятся после первой оплаты</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReceipts.map(r => (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-4 text-left hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl bg-gray-50 ${TYPE_COLOR[r.type] || "text-gray-500"}`}>
                    <Icon name={TYPE_ICON[r.type] || "Receipt"} size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-gray-900 text-sm truncate">{r.type_label}</span>
                      <span className={`font-black text-base whitespace-nowrap ${r.type === "topup" ? "text-green-600" : "text-gray-900"}`}>
                        {r.type === "topup" ? "+" : "−"}{r.amount.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{r.description}</p>
                    {isAdmin && r.user_name && (
                      <p className="text-xs text-blue-600 mt-0.5">{r.user_name} · {r.user_phone}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-mono text-xs text-gray-400">{r.receipt_number}</span>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                  </div>
                  <Icon name="ChevronRight" size={16} className="text-gray-300 mt-1 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <Icon name="ChevronLeft" size={16} />
            </button>
            <span className="text-sm text-gray-600">
              Страница {page + 1} из {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold disabled:opacity-40 hover:bg-gray-50 transition-colors"
            >
              <Icon name="ChevronRight" size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Модалка с чеком */}
      {selected && (
        <ReceiptModal receipt={selected} onClose={() => setSelected(null)} />
      )}

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#receipt-print-area) { display: none !important; }
          #receipt-print-area { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}