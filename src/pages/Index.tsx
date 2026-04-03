import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomePage from "@/pages/HomePage";
import CatalogPage from "@/pages/CatalogPage";
import AboutPage from "@/pages/AboutPage";
import ServicesPage from "@/pages/ServicesPage";
import BlogPage from "@/pages/BlogPage";
import ContactsPage from "@/pages/ContactsPage";
import CartPage from "@/pages/CartPage";
import DeliveryPage from "@/pages/DeliveryPage";
import LoginPage from "@/pages/LoginPage";
import AccountPage from "@/pages/AccountPage";

export default function Index() {
  const [currentPage, setCurrentPage] = useState("home");
  const [cartCount, setCartCount] = useState(2);
  const [notifCount] = useState(2);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = (page: string) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const addToCart = () => {
    setCartCount((c) => c + 1);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <HomePage onNavigate={navigate} onAddToCart={addToCart} />;
      case "catalog":
        return <CatalogPage searchQuery={searchQuery} onAddToCart={addToCart} />;
      case "about":
        return <AboutPage />;
      case "services":
        return <ServicesPage onNavigate={navigate} />;
      case "blog":
        return <BlogPage />;
      case "contacts":
        return <ContactsPage />;
      case "cart":
        return <CartPage onNavigate={navigate} />;
      case "delivery":
        return <DeliveryPage />;
      case "login":
        return <LoginPage onNavigate={navigate} />;
      case "account":
        return <AccountPage onNavigate={navigate} />;
      default:
        return <HomePage onNavigate={navigate} onAddToCart={addToCart} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        currentPage={currentPage}
        onNavigate={navigate}
        cartCount={cartCount}
        notifCount={notifCount}
        searchQuery={searchQuery}
        onSearchChange={(v) => {
          setSearchQuery(v);
          if (v) navigate("catalog");
        }}
      />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer onNavigate={navigate} />
    </div>
  );
}
