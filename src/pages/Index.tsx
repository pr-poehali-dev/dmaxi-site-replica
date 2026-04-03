import { useState } from "react";
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

export default function Index() {
  const [currentPage, setCurrentPage] = useState("home");

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
      case "club":      return <DeliveryPage onNavigate={navigate} />;
      case "portfolio": return <BlogPage onNavigate={navigate} />;
      case "about":     return <AboutPage onNavigate={navigate} />;
      case "contacts":  return <ContactsPage onNavigate={navigate} />;
      case "login":     return <LoginPage onNavigate={navigate} />;
      case "account":   return <AccountPage onNavigate={navigate} />;
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
