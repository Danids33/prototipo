(() => {
  const $ = (id) => document.getElementById(id);

  const els = {
    grid: $("productGrid"),
    productCount: $("productCount"),
    cartCount: $("cartCount"),
    year: $("year"),
    cartBtn: $("cartBtn"),
    searchDesktop: $("searchInputDesktop"),
    searchMobile: $("searchInputMobile"),
  };

  const products = [
    {
      id: "gan-14-pro",
      name: "GAN 14 Pro 3×3 (MagLev)",
      brand: "GAN",
      tags: ["3x3", "maglev", "premium", "speedcube"],
      imageFile: "gan-14-pro.png",
      price: 64.99,
    },
    {
      id: "moyu-wr-m-2021",
      name: "MoYu WRM 2021 3×3",
      brand: "MoYu",
      tags: ["3x3", "control", "smooth"],
      imageFile: "MoYu WRM 2021 3×3.png",
      price: 34.9,
    },
    {
      id: "rs3m-v5-ballcore",
      name: "MoYu RS3M V5 (Ball-Core)",
      brand: "MoYu",
      tags: ["3x3", "value", "ball-core", "magnetic"],
      imageFile: "moyu-rs3m-v5-ball-core.png",
      price: 24.9,
    },
    {
      id: "qiyi-tornado-v3-pioneer",
      name: "QiYi Tornado V3 (Pioneer)",
      brand: "QiYi",
      tags: ["3x3", "quiet", "pioneer", "fast"],
      imageFile: "qiyi-tornado-v3-pioneer.png",
      price: 44.0,
    },
    {
      id: "gan-562-5x5",
      name: "GAN 562 5×5",
      brand: "GAN",
      tags: ["5x5", "magnetic", "compact"],
      imageFile: "gan-562-5x5.png",
      price: 26.5,
    },
    {
      id: "moyu-weipo-wr-s-2x2",
      name: "MoYu WeiPo WR S 2x2",
      brand: "MoYu",
      tags: ["5x5", "stability", "magnetic"],
      imageFile: "moyu-weipo-wr-s-2x2.png",
      price: 39.99,
    },
  ];

  const IMAGE_DIR = "./img/";

  const cart = new Map(); // productId -> qty

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();
  }

  function formatPrice(n) {
    try {
      return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(n);
    } catch {
      return `${n.toFixed(2)} €`;
    }
  }

  function cartTotalCount() {
    let total = 0;
    for (const qty of cart.values()) total += qty;
    return total;
  }

  function setCartCount() {
    if (els.cartCount) els.cartCount.textContent = String(cartTotalCount());
  }

  function addToCart(productId) {
    cart.set(productId, (cart.get(productId) || 0) + 1);
    setCartCount();
  }

  function renderProducts(list) {
    if (!els.grid) return;
    els.grid.innerHTML = "";

    const frag = document.createDocumentFragment();
    for (const p of list) {
      const card = document.createElement("article");
      card.className = "card";

      const imageSrc = p.imageFile ? `${IMAGE_DIR}${p.imageFile}` : "";
      const imageAlt = p.name ? `Foto de ${p.name}` : "Foto del producto";

      card.innerHTML = `
        <div class="card-top">
          <img class="product-photo" src="${imageSrc}" alt="${escapeHtml(imageAlt)}" loading="lazy" decoding="async" />
          <div class="card-meta">
            <div class="card-title">${escapeHtml(p.name)}</div>
            <div class="card-sub">${escapeHtml(p.brand)}</div>
          </div>
        </div>
        <div class="chips">
          ${p.tags.slice(0, 3).map((t) => `<span class="chip">${escapeHtml(t)}</span>`).join("")}
        </div>
        <div class="card-bottom">
          <div class="price">${formatPrice(p.price)}</div>
          <button class="btn" type="button" data-add="${p.id}">
            <span>Añadir</span>
          </button>
        </div>
      `;

      frag.appendChild(card);
    }

    els.grid.appendChild(frag);

  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applyFilter(query) {
    const q = normalize(query);
    const filtered = !q
      ? products
      : products.filter((p) => {
          const haystack = normalize([p.name, p.brand, ...(p.tags || [])].join(" "));
          return haystack.includes(q);
        });

    if (els.productCount) els.productCount.textContent = String(filtered.length);
    renderProducts(filtered);
  }

  function wireSearch() {
    const onInput = (e) => {
      const value = e.target.value || "";
      if (els.searchDesktop && e.target !== els.searchDesktop) els.searchDesktop.value = value;
      if (els.searchMobile && e.target !== els.searchMobile) els.searchMobile.value = value;
      applyFilter(value);
    };

    els.searchDesktop?.addEventListener("input", onInput);
    els.searchMobile?.addEventListener("input", onInput);
  }

  function wireGridClicks() {
    els.grid?.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-add]");
      if (!btn) return;
      addToCart(btn.getAttribute("data-add"));
    });
  }

  function wireCartBtn() {
    els.cartBtn?.addEventListener("click", () => {
      const count = cartTotalCount();
      const msg =
        count === 0
          ? "Tu carrito está vacío."
          : `Tienes ${count} artículo${count === 1 ? "" : "s"} en el carrito.`;
      alert(msg);
    });
  }

  function init() {
    if (els.year) els.year.textContent = String(new Date().getFullYear());
    setCartCount();
    wireSearch();
    wireGridClicks();
    wireCartBtn();

    if (els.productCount) els.productCount.textContent = String(products.length);
    renderProducts(products);

  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
