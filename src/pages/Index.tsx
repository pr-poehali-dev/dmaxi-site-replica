import { useState, useEffect } from "react";
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

const PAYMENT_MESSAGES: Record<string, { title: string; description: string }> = {
  topup:   { title: "Кошелёк пополнен!",         description: "Средства зачислены на ваш кошелёк." },
  shop:    { title: "Оплата прошла успешно!",     description: "Ваш заказ в магазине оформлен." },
  service: { title: "Оплата прошла успешно!",     description: "Услуга оплачена. Спасибо!" },
  goods:   { title: "Оплата прошла успешно!",     description: "Товар заказан. Менеджер свяжется с вами." },
  default: { title: "Оплата прошла успешно!",     description: "Платёж принят. Спасибо!" },
};

export default function Index() {
  const [currentPage, setCurrentPage] = useState("home");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    const type    = params.get("type") || "default";

    if (payment === "success") {
      const msg = PAYMENT_MESSAGES[type] || PAYMENT_MESSAGES.default;
      setTimeout(() => {
        toast.success(msg.title, {
          description: msg.description,
          duration: 6000,
        });
      }, 500);

      // Очищаем URL без перезагрузки
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);

      // Перенаправляем в нужный раздел
      if (type === "topup") setCurrentPage("account");
      if (type === "shop")  setCurrentPage("shop");
      if (type === "goods") setCurrentPage("autogoods");
      if (type === "service") setCurrentPage("servicepay");
    }

    if (payment === "cancel") {
      setTimeout(() => {
        toast.error("Оплата отменена", {
          description: "Платёж не был завершён. Попробуйте ещё раз.",
          duration: 5000,
        });
      }, 500);
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
    }
  }, []);

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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
      case "account":   return <AccountPage onNavigate={navigate} />;
      case "admin":     return <AdminPage onNavigate={navigate} />;
      default:          return <HomePage onNavigate={navigate} />;
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