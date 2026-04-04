import Icon from "@/components/ui/icon";

type PayMethod = "wallet" | "card";

interface PayMethodSelectorProps {
  value: PayMethod;
  onChange: (v: PayMethod) => void;
  balance: number | null;
  amount: number;
}

export default function PayMethodSelector({ value, onChange, balance, amount }: PayMethodSelectorProps) {
  const hasEnough = balance !== null && balance >= amount;
  const shortage  = balance !== null ? Math.max(0, amount - balance) : 0;

  return (
    <div>
      <div className="label-tag mb-3">Способ оплаты</div>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("wallet")}
          className={`p-4 border-2 text-left transition-all ${value === "wallet" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="Wallet" size={18} className={value === "wallet" ? "text-primary" : "text-muted-foreground"} />
            <span className="font-display font-bold text-sm uppercase tracking-wide">Кошелёк</span>
          </div>
          {balance !== null ? (
            <div className={`text-xs font-bold ${hasEnough ? "text-green-400" : "text-destructive"}`}>
              {hasEnough
                ? `Доступно ${balance.toLocaleString("ru-RU")} ₽`
                : `Не хватает ${shortage.toLocaleString("ru-RU")} ₽`}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">Мгновенно</div>
          )}
        </button>

        <button
          type="button"
          onClick={() => onChange("card")}
          className={`p-4 border-2 text-left transition-all ${value === "card" ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <Icon name="CreditCard" size={18} className={value === "card" ? "text-primary" : "text-muted-foreground"} />
            <span className="font-display font-bold text-sm uppercase tracking-wide">Карта</span>
          </div>
          <div className="text-xs text-muted-foreground">Visa, МИР, МастерКард</div>
        </button>
      </div>
    </div>
  );
}
