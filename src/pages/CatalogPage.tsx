import { useState } from "react";
import Icon from "@/components/ui/icon";

const allProducts = [
  { id: 1, name: "Кресло руководителя Exec Pro", category: "Мебель", price: 28900, oldPrice: 34500, badge: "Хит", rating: 4.8, reviews: 124, inStock: true },
  { id: 2, name: "МФУ Laser Business 3500", category: "Оргтехника", price: 45600, oldPrice: null, badge: "Новинка", rating: 4.9, reviews: 87, inStock: true },
  { id: 3, name: "Стол переговоров Conference L", category: "Мебель", price: 67000, oldPrice: 78000, badge: null, rating: 4.7, reviews: 43, inStock: true },
  { id: 4, name: "Гарнитура Jabra BIZ 2300", category: "Связь", price: 12400, oldPrice: 14800, badge: "Скидка", rating: 4.6, reviews: 201, inStock: true },
  { id: 5, name: "Шредер документов SB-8 Pro", category: "Оргтехника", price: 8900, oldPrice: null, badge: null, rating: 4.5, reviews: 65, inStock: true },
  { id: 6, name: "Офисный стул Task Chair 200", category: "Мебель", price: 9800, oldPrice: 11500, badge: null, rating: 4.4, reviews: 312, inStock: false },
  { id: 7, name: "Принтер HP LaserJet Pro", category: "Оргтехника", price: 22300, oldPrice: null, badge: null, rating: 4.7, reviews: 189, inStock: true },
  { id: 8, name: "IP-телефон Cisco 7942G", category: "Связь", price: 5600, oldPrice: 6800, badge: null, rating: 4.3, reviews: 78, inStock: true },
  { id: 9, name: "Огнеупорный сейф BS-600", category: "Безопасность", price: 34500, oldPrice: null, badge: null, rating: 4.9, reviews: 31, inStock: true },
  { id: 10, name: "Кофемашина Franke A600", category: "Кухня", price: 89000, oldPrice: 105000, badge: "Хит", rating: 4.8, reviews: 56, inStock: true },
  { id: 11, name: "Доска-флипчарт мобильная", category: "Мебель", price: 4200, oldPrice: null, badge: null, rating: 4.2, reviews: 44, inStock: true },
  { id: 12, name: "Сканер Fujitsu fi-7160", category: "Оргтехника", price: 38700, oldPrice: 44000, badge: null, rating: 4.8, reviews: 67, inStock: false },
];

const categories = ["Все", "Мебель", "Оргтехника", "Связь", "Безопасность", "Кухня"];
const sortOptions = [
  { value: "default", label: "По умолчанию" },
  { value: "price_asc", label: "Цена ↑" },
  { value: "price_desc", label: "Цена ↓" },
  { value: "rating", label: "По рейтингу" },
];

interface CatalogPageProps {
  searchQuery: string;
  onAddToCart: () => void;
}

export default function CatalogPage({ searchQuery, onAddToCart }: CatalogPageProps) {
  const [selectedCategory, setSelectedCategory] = useState("Все");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState("default");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = allProducts
    .filter((p) => selectedCategory === "Все" || p.category === selectedCategory)
    .filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter((p) => !onlyInStock || p.inStock)
    .filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.category.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "rating") return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="animate-fade-in">
      {/* Breadcrumb */}
      <div className="border-b border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground font-mono">
          <span className="hover:text-foreground cursor-pointer transition-colors">Главная</span>
          <Icon name="ChevronRight" size={12} />
          <span className="text-foreground">Каталог</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-end justify-between mb-6">
          <div>
            <div className="section-label mb-1">Ассортимент</div>
            <h1 className="text-2xl font-black tracking-tight">Каталог товаров</h1>
          </div>
          <span className="text-sm text-muted-foreground font-mono">{filtered.length} товаров</span>
        </div>

        <div className="flex gap-6">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Categories */}
              <div>
                <div className="section-label mb-3">Категория</div>
                <div className="space-y-1">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedCategory === cat
                          ? "bg-[hsl(var(--primary))] text-white font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <div className="section-label mb-3">Цена, ₽</div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                    className="w-full border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-foreground/40"
                    placeholder="от"
                  />
                  <span className="text-muted-foreground text-xs">—</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                    className="w-full border border-border px-2 py-1.5 text-xs focus:outline-none focus:border-foreground/40"
                    placeholder="до"
                  />
                </div>
              </div>

              {/* Stock */}
              <div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <div
                    onClick={() => setOnlyInStock(!onlyInStock)}
                    className={`w-4 h-4 border flex items-center justify-center transition-colors ${onlyInStock ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]" : "border-border"}`}
                  >
                    {onlyInStock && <Icon name="Check" size={10} className="text-white" />}
                  </div>
                  <span className="text-sm text-foreground">Только в наличии</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-border">
              {/* Mobile Filters */}
              <button
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="lg:hidden flex items-center gap-2 text-sm font-medium border border-border px-3 py-2 hover:bg-secondary transition-colors"
              >
                <Icon name="SlidersHorizontal" size={14} />
                Фильтры
              </button>

              {/* Category Pills - Mobile */}
              <div className="hidden sm:flex lg:hidden gap-2 overflow-x-auto flex-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`shrink-0 px-3 py-1.5 text-xs font-medium border transition-colors ${
                      selectedCategory === cat
                        ? "bg-[hsl(var(--primary))] text-white border-[hsl(var(--primary))]"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="ml-auto border border-border px-3 py-2 text-sm bg-background focus:outline-none text-foreground"
              >
                {sortOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Mobile Filters Drawer */}
            {filtersOpen && (
              <div className="lg:hidden mb-5 p-4 border border-border bg-secondary/20 animate-slide-down">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="section-label mb-2">Категория</div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full border border-border px-2 py-2 text-sm bg-background"
                    >
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <div className="section-label mb-2">В наличии</div>
                    <label className="flex items-center gap-2 mt-2 cursor-pointer">
                      <div
                        onClick={() => setOnlyInStock(!onlyInStock)}
                        className={`w-4 h-4 border flex items-center justify-center ${onlyInStock ? "bg-[hsl(var(--primary))] border-[hsl(var(--primary))]" : "border-border"}`}
                      >
                        {onlyInStock && <Icon name="Check" size={10} className="text-white" />}
                      </div>
                      <span className="text-sm">Только в наличии</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Product Grid */}
            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <Icon name="PackageSearch" size={48} className="mx-auto text-muted-foreground/30 mb-4" />
                <div className="text-muted-foreground">Товары не найдены</div>
                <button onClick={() => { setSelectedCategory("Все"); setPriceRange([0, 100000]); }} className="mt-4 text-sm underline text-foreground">
                  Сбросить фильтры
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((p) => (
                  <div key={p.id} className="product-card group">
                    <div className="relative aspect-square bg-gradient-to-br from-secondary to-background flex items-center justify-center overflow-hidden">
                      <Icon name="Package" size={48} className="text-muted-foreground/25 group-hover:scale-110 transition-transform duration-300" />
                      {p.badge && (
                        <div className={`absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold tracking-wide ${
                          p.badge === "Хит" ? "bg-[hsl(var(--primary))] text-white" :
                          p.badge === "Новинка" ? "bg-blue-700 text-white" :
                          "bg-[hsl(var(--corp-gold))] text-white"
                        }`}>
                          {p.badge}
                        </div>
                      )}
                      {!p.inStock && (
                        <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                          <span className="section-label bg-background px-3 py-1 border border-border">Нет в наличии</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="section-label mb-1">{p.category}</div>
                      <div className="text-sm font-semibold leading-tight mb-3 line-clamp-2">{p.name}</div>
                      <div className="flex items-center gap-1 mb-3">
                        {[1,2,3,4,5].map((s) => (
                          <Icon key={s} name="Star" size={10} className={s <= Math.round(p.rating) ? "text-[hsl(var(--corp-gold))] fill-[hsl(var(--corp-gold))]" : "text-muted-foreground"} />
                        ))}
                        <span className="text-xs text-muted-foreground ml-1">({p.reviews})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-lg font-black">{p.price.toLocaleString("ru-RU")} ₽</div>
                          {p.oldPrice && <div className="text-xs text-muted-foreground line-through">{p.oldPrice.toLocaleString("ru-RU")} ₽</div>}
                        </div>
                        <button
                          disabled={!p.inStock}
                          className="p-2 bg-[hsl(var(--primary))] text-white hover:opacity-80 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                          onClick={onAddToCart}
                        >
                          <Icon name="ShoppingCart" size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
