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
    categoryFilters: $("categoryFilters"),
    productDrawer: $("productDrawer"),
    drawerBody: $("drawerBody"),
    closeDrawer: $("closeDrawer"),
    cartDropdown: $("cartDropdown"),
    cartItems: $("cartItems"),
    cartTotalValue: $("cartTotalValue"),
  };

  const products = [
    {
      id: "gan-14-pro",
      name: "GAN 14 Pro 3×3 (MagLev)",
      brand: "GAN",
      tags: ["3x3", "imantado", "premium", "profesional"],
      imageFile: "gan-14-pro.png",
      price: 64.99,
    },
    {
      id: "moyu-wr-m-2021",
      name: "MoYu WRM 2021 3×3",
      brand: "MoYu",
      tags: ["3x3", "control", "liso"],
      imageFile: "MoYu WRM 2021 3×3.png",
      price: 34.9,
    },
    {
      id: "rs3m-v5-ballcore",
      name: "MoYu RS3M V5 (Ball-Core)",
      brand: "MoYu",
      tags: ["3x3", "económico", "ball-core", "magnetico"],
      imageFile: "moyu-rs3m-v5-ball-core.png",
      price: 24.9,
    },
    {
      id: "qiyi-tornado-v3-pioneer",
      name: "QiYi Tornado V3 (Pioneer)",
      brand: "QiYi",
      tags: ["3x3", "silencioso", "pionero", "veloz"],
      imageFile: "qiyi-tornado-v3-pioneer.png",
      price: 44.0,
    },
    {
      id: "gan-562-5x5",
      name: "GAN 562 5×5",
      brand: "GAN",
      tags: ["5x5", "magnetico", "compacto"],
      imageFile: "gan-562-5x5.png",
      price: 26.5,
    },
    {
      id: "moyu-weipo-wr-s-2x2",
      name: "MoYu WeiPo WR S 2x2",
      brand: "MoYu",
      tags: ["2x2", "estable", "magnetico"],
      imageFile: "moyu-weipo-wr-s-2x2.png",
      price: 39.99,
    },
  ];

  const IMAGE_DIR = "./img/";

  const cart = new Map(); // productId -> qty
  let currentCategory = "all";
  let currentSearchQuery = "";

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
    if (els.cartDropdown && els.cartDropdown.classList.contains("show")) {
      renderCartDropdown();
    }
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

  function applyFilters() {
    const q = normalize(currentSearchQuery);
    const filtered = products.filter((p) => {
      // Category filter
      if (currentCategory !== "all" && !p.tags.includes(currentCategory)) {
        return false;
      }
      // Search filter
      if (q) {
        const haystack = normalize([p.name, p.brand, ...(p.tags || [])].join(" "));
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (els.productCount) els.productCount.textContent = String(filtered.length);
    renderProducts(filtered);
  }

  function wireSearch() {
    const onInput = (e) => {
      const value = e.target.value || "";
      if (els.searchDesktop && e.target !== els.searchDesktop) els.searchDesktop.value = value;
      if (els.searchMobile && e.target !== els.searchMobile) els.searchMobile.value = value;
      currentSearchQuery = value;
      applyFilters();
    };

    els.searchDesktop?.addEventListener("input", onInput);
    els.searchMobile?.addEventListener("input", onInput);
  }

  function wireGridClicks() {
    els.grid?.addEventListener("click", (e) => {
      // Handle cart add
      const btn = e.target?.closest?.("button[data-add]");
      if (btn) {
        addToCart(btn.getAttribute("data-add"));
        return;
      }

      // Handle product click to open drawer
      const card = e.target?.closest?.("article.card");
      if (card && e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
        const productId = card.querySelector("button[data-add]")?.getAttribute("data-add");
        const product = products.find(p => p.id === productId);

        if (product && els.productDrawer && els.drawerBody) {
          const imageSrc = product.imageFile ? `${IMAGE_DIR}${product.imageFile}` : "";
          const imageAlt = product.name ? `Foto de ${product.name}` : "Foto del producto";

          els.drawerBody.innerHTML = `
            <div class="drawer-hero">
                <img src="${imageSrc}" alt="${escapeHtml(imageAlt)}" />
            </div>
            <div class="drawer-details">
                <div>
                    <div class="drawer-brand">${escapeHtml(product.brand)}</div>
                    <h2 class="drawer-title">${escapeHtml(product.name)}</h2>
                </div>
                <div class="drawer-price">${formatPrice(product.price)}</div>
                <p class="drawer-desc">Un cubo excelente con una rotación suave y tecnología avanzada. Perfecto para mejorar tus tiempos y disfrutar del speedcubing. Incluye ajuste magnético y un diseño de alto rendimiento.</p>
                
                <div class="chips">
                    ${product.tags.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("")}
                </div>

                <div class="drawer-actions">
                    <div class="qty-control">
                        <button type="button" class="qty-btn minus">&minus;</button>
                        <input type="number" class="qty-input" id="drawerQty" value="1" min="1" max="99" />
                        <button type="button" class="qty-btn plus">&plus;</button>
                    </div>
                    <button type="button" class="drawer-add-btn" data-drawer-add="${product.id}">
                        Añadir al carrito
                    </button>
                </div>
            </div>
          `;

          els.productDrawer.classList.add("show");
          els.productDrawer.setAttribute("aria-hidden", "false");
          document.body.style.overflow = 'hidden'; // Prevent scrolling
        }
      }
    });
  }

  function wireFilters() {
    if (!els.categoryFilters) return;
    els.categoryFilters.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        // Update active class
        els.categoryFilters.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");

        // Apply filter
        currentCategory = e.target.getAttribute("data-filter");
        applyFilters();
      }
    });
  }

  function wireDrawer() {
    if (!els.productDrawer) return;

    const closeDrawer = () => {
      els.productDrawer.classList.remove("show");
      els.productDrawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = '';
    };

    els.closeDrawer?.addEventListener("click", closeDrawer);

    // Close on background click
    els.productDrawer.addEventListener("click", (e) => {
      if (e.target === els.productDrawer) closeDrawer();
    });

    // Handle actions inside drawer (add to cart, qty)
    els.drawerBody?.addEventListener("click", (e) => {
      // Qty minus
      if (e.target.closest(".minus")) {
        const input = $("drawerQty");
        if (input && input.value > 1) input.value = parseInt(input.value) - 1;
      }
      // Qty plus
      if (e.target.closest(".plus")) {
        const input = $("drawerQty");
        if (input && input.value < 99) input.value = parseInt(input.value) + 1;
      }
      // Add to cart
      const addBtn = e.target.closest("[data-drawer-add]");
      if (addBtn) {
        const productId = addBtn.getAttribute("data-drawer-add");
        const qty = parseInt($("drawerQty")?.value || "1", 10);
        cart.set(productId, (cart.get(productId) || 0) + qty);
        setCartCount();
        if (els.cartDropdown && els.cartDropdown.classList.contains("show")) {
          renderCartDropdown();
        }
        closeDrawer();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && els.productDrawer.classList.contains("show")) {
        closeDrawer();
      }
    });
  }

  function renderCartDropdown() {
    if (!els.cartItems || !els.cartTotalValue) return;

    els.cartItems.innerHTML = "";
    let totalValue = 0;

    if (cart.size === 0) {
      els.cartItems.innerHTML = '<div class="empty-cart">Tu carrito está vacío.</div>';
      els.cartTotalValue.textContent = formatPrice(0);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const [productId, qty] of cart.entries()) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      totalValue += product.price * qty;
      const imageSrc = product.imageFile ? `${IMAGE_DIR}${product.imageFile}` : "";

      const item = document.createElement("div");
      item.className = "cart-item";
      item.innerHTML = `
        <img class="cart-item-img" src="${imageSrc}" alt="">
        <div class="cart-item-details">
            <div class="cart-item-title">${escapeHtml(product.name)}</div>
            <div class="cart-item-meta">${formatPrice(product.price)}</div>
        </div>
        <div class="cart-item-qty">x${qty}</div>
      `;
      frag.appendChild(item);
    }
    els.cartItems.appendChild(frag);
    els.cartTotalValue.textContent = formatPrice(totalValue);
  }

  function wireCartBtn() {
    els.cartBtn?.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!els.cartDropdown) return;

      const isShowing = els.cartDropdown.classList.contains("show");
      if (!isShowing) {
        renderCartDropdown();
        els.cartDropdown.classList.add("show");
        els.cartDropdown.setAttribute("aria-hidden", "false");
      } else {
        els.cartDropdown.classList.remove("show");
        els.cartDropdown.setAttribute("aria-hidden", "true");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (els.cartDropdown && els.cartDropdown.classList.contains("show")) {
        if (!e.target.closest(".cart-dropdown") && !e.target.closest("#cartBtn")) {
          els.cartDropdown.classList.remove("show");
          els.cartDropdown.setAttribute("aria-hidden", "true");
        }
      }
    });
  }

  function init() {
    if (els.year) els.year.textContent = String(new Date().getFullYear());
    setCartCount();
    wireSearch();
    wireFilters();
    wireDrawer();
    wireGridClicks();
    wireCartBtn();

    applyFilters(); // Initialize with all filters
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
