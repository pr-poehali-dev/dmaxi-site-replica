import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";      // Стоимость/Цены
import AboutPage from "@/pages/AboutPage";           // О компании
import ServicesPage from "@/pages/ServicesPage";     // Услуги
import BlogPage from "@/pages/BlogPage";              // Портфолио
import ContactsPage from "@/pages/ContactsPage";     // Контакты
import CartPage from "@/pages/CartPage";              // Запись на ремонт
import DeliveryPage from "@/pages/DeliveryPage";     // Клуб DD
import LoginPage from "@/pages/LoginPage";            // Вход / Регистрация
import AccountPage from "@/pages/AccountPage";       // Личный кабинет
import AdminPage from "@/pages/AdminPage";           // Панель администратора
import ShopPage from "@/pages/ShopPage";             // Магазин
import AutoGoodsPage from "@/pages/AutoGoodsPage";   // Автотовары
import ServicePayPage from "@/pages/ServicePayPage"; // Оплата услуг
import ReceiptsPage from "@/pages/ReceiptsPage";     // Хранилище чеков
import ClubCardPage from "@/pages/ClubCardPage";     // Публичная клубная карта
import SiteEditorPage from "@/pages/SiteEditorPage"; // Редактор сайта
import LegalPage from "@/pages/LegalPage";           // Политика / Соглашение
import PreviewPage from "@/pages/PreviewPage";       // Предпросмотр сайта

const WALLET_URL = "https://functions.poehali.dev/686b24a0-6c64-41f9-8ff3-a7a49d17304b";
const SHOP_URL   = "https://functions.poehali.dev/714bb75b-cfea-4178-a588-3dcaf54e74cc";

const PAYMENT_MESSAGES: Record<string, { title: string; description: string }> = {
  topup:   { title: "Кошелёк пополнен!",      description: "Средства зачислены на ваш кошелёк." },
  shop:    { title: "Оплата прошла успешно!",  description: "Ваш заказ в магазине оформлен." },
  service: { title: "Оплата прошла успешно!",  description: "Услуга оплачена. Спасибо!" },
  goods:   { title: "Оплата прошла успешно!",  description: "Товар заказан. Менеджер свяжется с вами." },
  default: { title: "Оплата прошла успешно!",  description: "Платёж принят. Спасибо!" },
};

const PAGE_BY_TYPE: Record<string, string> = {
  topup: "account", shop: "shop", goods: "autogoods", service: "servicepay",
};

export default function Index() {
  const [currentPage, setCurrentPage] = useState("home");
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const params  = new URLSearchParams(window.location.search);

    // Обработка QR-карты — НЕ чистим URL, страница сама его считает
    if (params.get("card")) {
      setCurrentPage("club_card");
      return;
    }

    const payment = params.get("payment");
    const type    = params.get("type") || "default";

    // Очищаем URL сразу
    window.history.replaceState({}, "", window.location.pathname);

    if (payment === "cancel") {
      toast.error("Оплата отменена", {
        description: "Платёж не был завершён. Попробуйте ещё раз.",
        duration: 5000,
      });
      return;
    }

    if (payment !== "success") return;

    // Переходим в нужный раздел
    const targetPage = PAGE_BY_TYPE[type];
    if (targetPage) setCurrentPage(targetPage);

    // Читаем сохранённый order_id и токен
    const orderId = localStorage.getItem("yk_pending_order_id");
    const token   = localStorage.getItem("ddmaxi_token") || "";

    if (!orderId || !token) {
      // Нет order_id — просто показываем тост
      setTimeout(() => {
        const msg = PAYMENT_MESSAGES[type] || PAYMENT_MESSAGES.default;
        toast.success(msg.title, { description: msg.description, duration: 6000 });
      }, 600);
      return;
    }

    // Есть order_id — проверяем статус у сервера с ретраями
    const checkUrl = type === "shop"
      ? `${SHOP_URL}?action=check_payment&order_id=${orderId}`
      : `${WALLET_URL}?action=check_payment&order_id=${orderId}`;

    const tryCheck = async (attempt: number) => {
      try {
        const r = await fetch(checkUrl, { headers: { "X-Auth-Token": token } });
        const d = await r.json();

        if (d.status === "succeeded" || d.status === "paid") {
          localStorage.removeItem("yk_pending_order_id");
          localStorage.removeItem("yk_pending_type");
          const msg = PAYMENT_MESSAGES[type] || PAYMENT_MESSAGES.default;
          toast.success(msg.title, { description: msg.description, duration: 7000 });
          return;
        }

        if (d.status === "canceled" || d.status === "cancelled") {
          localStorage.removeItem("yk_pending_order_id");
          localStorage.removeItem("yk_pending_type");
          toast.error("Оплата отменена", {
            description: "Платёж был отменён. Попробуйте ещё раз.",
            duration: 5000,
          });
          return;
        }

        // Статус ещё pending — повторяем (до 5 раз с паузой 2с)
        if (attempt < 5) {
          setTimeout(() => tryCheck(attempt + 1), 2000);
        } else {
          // Всё равно показываем тост — ЮКасса перенаправила, значит оплата скорее всего прошла
          const msg = PAYMENT_MESSAGES[type] || PAYMENT_MESSAGES.default;
          toast.success(msg.title, {
            description: msg.description + " Статус обновится в личном кабинете.",
            duration: 7000,
          });
        }
      } catch {
        if (attempt < 3) setTimeout(() => tryCheck(attempt + 1), 2000);
      }
    };

    setTimeout(() => tryCheck(1), 1000);
  }, []);

  const navigate = useCallback((page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handler = () => navigate("login");
    window.addEventListener("navigate-to-login", handler);
    return () => window.removeEventListener("navigate-to-login", handler);
  }, [navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case "home":      return <HomePage onNavigate={navigate} />;
      case "services":  return <ServicesPage onNavigate={navigate} />;
      case "prices":    return <CatalogPage onNavigate={navigate} />;
      case "booking":   return <CartPage onNavigate={navigate} />;
      case "shop":        return <ShopPage onNavigate={navigate} />;
      case "autogoods":   return <AutoGoodsPage onNavigate={navigate} />;
      case "servicepay":  return <ServicePayPage onNavigate={navigate} />;
      case "club":      return <DeliveryPage onNavigate={navigate} />;
      case "portfolio": return <BlogPage onNavigate={navigate} />;
      case "about":     return <AboutPage onNavigate={navigate} />;
      case "contacts":  return <ContactsPage onNavigate={navigate} />;
      case "login":     return <LoginPage onNavigate={navigate} />;
      case "account":         return <AccountPage onNavigate={navigate} />;
      case "admin":           return <AdminPage onNavigate={navigate} />;
      case "receipts":        return <ReceiptsPage onNavigate={navigate} />;
      case "receipts_admin":  return <ReceiptsPage onNavigate={navigate} isAdmin />;
      case "club_card":       return <ClubCardPage token={localStorage.getItem("ddmaxi_token") || ""} onNavigate={navigate} />;
      case "site_editor":     return <SiteEditorPage onNavigate={navigate} />;
      case "preview":         return <PreviewPage onNavigate={navigate} />;
      case "privacy":         return <LegalPage type="privacy" onNavigate={navigate} />;
      case "terms":           return <LegalPage type="terms"   onNavigate={navigate} />;
      default:                return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header currentPage={currentPage} onNavigate={navigate} />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}