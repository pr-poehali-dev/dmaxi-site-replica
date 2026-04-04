import Icon from "@/components/ui/icon";
import { useSiteSettings } from "@/context/SiteSettingsContext";

interface LegalPageProps {
  type: "privacy" | "terms";
  onNavigate: (p: string) => void;
}

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      elements.push(
        <h2 key={key++} className="font-display font-bold text-xl uppercase tracking-wide mt-8 mb-3 text-foreground">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      elements.push(
        <li key={key++} className="flex items-start gap-2 text-sm text-muted-foreground">
          <span className="text-primary mt-1.5 shrink-0 w-1 h-1 bg-primary inline-block rounded-full" />
          {line.replace("- ", "")}
        </li>
      );
    } else if (line.trim() === "") {
      elements.push(<div key={key++} className="h-2" />);
    } else {
      elements.push(
        <p key={key++} className="text-sm text-muted-foreground leading-relaxed">
          {line}
        </p>
      );
    }
  }

  const result: React.ReactNode[] = [];
  let listItems: React.ReactNode[] = [];
  let listKey = 0;

  for (const el of elements) {
    if ((el as React.ReactElement).type === "li") {
      listItems.push(el);
    } else {
      if (listItems.length > 0) {
        result.push(<ul key={`ul-${listKey++}`} className="space-y-1.5 pl-2 mb-2">{listItems}</ul>);
        listItems = [];
      }
      result.push(el);
    }
  }
  if (listItems.length > 0) {
    result.push(<ul key={`ul-${listKey++}`} className="space-y-1.5 pl-2 mb-2">{listItems}</ul>);
  }

  return result;
}

export default function LegalPage({ type, onNavigate }: LegalPageProps) {
  const { s } = useSiteSettings();

  const title   = s(type, "title",   type === "privacy" ? "Политика конфиденциальности" : "Пользовательское соглашение");
  const updated = s(type, "updated", "01 января 2024 г.");
  const content = s(type, "content", "");

  const breadcrumb = type === "privacy" ? "Политика конфиденциальности" : "Пользовательское соглашение";

  return (
    <div className="animate-fade-in">
      <div className="border-b border-border">
        <div className="container mx-auto py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <button onClick={() => onNavigate("home")} className="hover:text-foreground transition-colors font-display uppercase tracking-wide">Главная</button>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground font-display uppercase tracking-wide">{breadcrumb}</span>
        </div>
      </div>

      <div className="bg-card border-b border-border py-12">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="red-line" />
            <span className="label-tag">Правовая информация</span>
          </div>
          <h1 className="font-display font-bold text-3xl lg:text-4xl uppercase mb-3">{title}</h1>
          <p className="text-muted-foreground text-sm">Последнее обновление: {updated}</p>
        </div>
      </div>

      <div className="container mx-auto section-py">
        <div className="max-w-3xl">
          <div className="card-dark p-8 space-y-1">
            {content ? renderMarkdown(content) : (
              <p className="text-sm text-muted-foreground">Документ находится в разработке.</p>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <button onClick={() => onNavigate("home")} className="btn-ghost text-sm py-2.5 px-6">
              ← На главную
            </button>
            <button onClick={() => onNavigate("contacts")} className="btn-ghost text-sm py-2.5 px-6">
              <Icon name="Mail" size={14} />
              Связаться с нами
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
