(() => {
  const $ = (id) => document.getElementById(id);

  /**
   * @typedef {Object} Producto
   * @property {string} id
   * @property {string} nombre
   * @property {string} marca
   * @property {string[]} etiquetas
   * @property {string} [imagenUrl]
   * @property {number} precio
   */

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
    drawerPanel: $("drawerPanel"),
    drawerBody: $("drawerBody"),
    closeDrawer: $("closeDrawer"),
    cartDropdown: $("cartDropdown"),
    cartItems: $("cartItems"),
    cartTotalValue: $("cartTotalValue"),
    toast: $("toast"),
    toastText: $("toastText"),
  };

  /** @type {Producto[]} */
  let products = [];

  const cart = new Map(); // productId -> qty
  let currentCategory = "all";
  let currentSearchQuery = "";
  let productsLoaded = false;
  let toastTimer = null;

  async function loadProducts() {
    try {
      const res = await fetch("./products.json", { cache: "no-store" });
      if (!res.ok) {
        products = [];
        productsLoaded = false;
        console.warn(`[products] No se pudo cargar products.json (HTTP ${res.status}).`);
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data?.productos) ? data.productos : [];
      products = list.map(toProduct).filter(Boolean);
      productsLoaded = true;
    } catch {
      products = [];
      productsLoaded = false;
      console.warn(
        "[products] No se pudo cargar products.json. Abre la página con un servidor (ej: Live Server) para permitir fetch()."
      );
    }
  }

  /**
   * @param {any} raw
   * @returns {Producto|null}
   */
  function toProduct(raw) {
    if (!raw || typeof raw !== "object") return null;
    if (!raw.id || !raw.nombre) return null;

    const precio = Number(raw.precio);
    if (!Number.isFinite(precio)) return null;

    const etiquetas = Array.isArray(raw.etiquetas)
      ? raw.etiquetas.filter((t) => typeof t === "string")
      : [];
    const imagenUrl =
      typeof raw.imagenUrl === "string" && raw.imagenUrl.trim() ? raw.imagenUrl.trim() : undefined;

    return {
      id: String(raw.id),
      nombre: String(raw.nombre),
      marca: raw.marca ? String(raw.marca) : "",
      etiquetas,
      imagenUrl,
      precio,
    };
  }

  function normalize(s) {
    return String(s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .trim();
  }

  function formatPrice(n) {
    try {
      return new Intl.NumberFormat("es-ES", { style: "currency", currency: "USD" }).format(n);
    } catch {
      return `${n.toFixed(2)} USD`;
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

  function showToast(message) {
    if (!els.toast || !els.toastText) return;
    els.toastText.textContent = String(message || "");
    els.toast.classList.remove("hidden");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      els.toast.classList.add("hidden");
    }, 1600);
  }

  function addToCart(productId) {
    cart.set(productId, (cart.get(productId) || 0) + 1);
    setCartCount();
    if (els.cartDropdown && !els.cartDropdown.classList.contains("hidden")) {
      renderCartDropdown();
    }
    const producto = products.find((p) => p.id === productId);
    showToast(producto ? `Añadido: ${producto.nombre}` : "Añadido al carrito");
  }

  function removeFromCart(productId) {
    cart.delete(productId);
    setCartCount();
    renderCartDropdown();
    const producto = products.find((p) => p.id === productId);
    showToast(producto ? `Eliminado: ${producto.nombre}` : "Producto eliminado");
  }

  function renderProducts(list) {
    if (!els.grid) return;
    els.grid.innerHTML = "";

    if (!productsLoaded) {
      els.grid.innerHTML = `
        <div class="col-span-full rounded-3xl border border-slate-900/10 bg-white/70 p-5 shadow-sm backdrop-blur">
          <div class="text-sm font-semibold tracking-tight">No se pudo cargar el catálogo</div>
          <div class="mt-2 text-sm leading-relaxed text-slate-600">
            Este proyecto carga <code class="rounded bg-slate-900/5 px-1.5 py-0.5">products.json</code> con <code class="rounded bg-slate-900/5 px-1.5 py-0.5">fetch()</code>.
            Si abriste <code class="rounded bg-slate-900/5 px-1.5 py-0.5">index.html</code> con doble click (modo <code class="rounded bg-slate-900/5 px-1.5 py-0.5">file://</code>), el navegador suele bloquearlo.
            Ábrelo con un servidor (Live Server en tu editor).
          </div>
        </div>
      `;
      if (els.productCount) els.productCount.textContent = "0";
      return;
    }

    const frag = document.createDocumentFragment();
    for (const p of list) {
      const card = document.createElement("article");
      card.className =
        "group cursor-pointer rounded-3xl border border-slate-900/10 bg-white/70 p-4 shadow-sm backdrop-blur transition hover:bg-white";

      const imageSrc = p.imagenUrl ? String(p.imagenUrl) : "";
      const imageAlt = p.nombre ? `Foto de ${p.nombre}` : "Foto del producto";

      card.innerHTML = `
        <div class="flex items-center gap-3">
          <img class="h-16 w-16 flex-none rounded-2xl border border-slate-900/10 bg-white/60 object-cover shadow-sm transition group-hover:scale-[1.03]" src="${escapeHtml(
            imageSrc
          )}" alt="${escapeHtml(
            imageAlt
          )}" loading="lazy" decoding="async" referrerpolicy="no-referrer" />
          <div class="min-w-0">
            <div class="truncate font-semibold tracking-tight">${escapeHtml(p.nombre)}</div>
            <div class="mt-1 text-xs font-medium text-slate-500">${escapeHtml(p.marca)}</div>
          </div>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          ${p.etiquetas
            .slice(0, 3)
            .map(
              (t) =>
                `<span class="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">${escapeHtml(
                  t
                )}</span>`
            )
            .join("")}
        </div>
        <div class="mt-3 flex items-center justify-between gap-3">
          <div class="font-extrabold tracking-tight">${formatPrice(p.precio)}</div>
          <button class="inline-flex h-10 items-center gap-2 rounded-2xl bg-slate-900 px-3 text-sm font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20" type="button" data-add="${
            p.id
          }">
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
      if (currentCategory !== "all" && !p.etiquetas.includes(currentCategory)) {
        return false;
      }
      // Search filter
      if (q) {
        const haystack = normalize([p.nombre, p.marca, ...(p.etiquetas || [])].join(" "));
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
      const card = e.target?.closest?.("article");
      if (card && e.target.tagName !== "BUTTON" && !e.target.closest("button")) {
        const productId = card.querySelector("button[data-add]")?.getAttribute("data-add");
        const product = products.find((p) => p.id === productId);

        if (product && els.productDrawer && els.drawerBody) {
          const imageSrc = product.imagenUrl ? String(product.imagenUrl) : "";
          const imageAlt = product.nombre ? `Foto de ${product.nombre}` : "Foto del producto";

          els.drawerBody.innerHTML = `
            <div class="border-b border-slate-900/10 bg-slate-900/[0.03] px-5 py-10 flex justify-center">
              <img class="h-52 w-52 object-contain" src="${escapeHtml(
                imageSrc
              )}" alt="${escapeHtml(
                imageAlt
              )}" referrerpolicy="no-referrer" />
            </div>
            <div class="flex flex-1 flex-col gap-4 p-6">
              <div>
                <div class="text-xs font-semibold uppercase tracking-wider text-slate-500">${escapeHtml(
                  product.marca
                )}</div>
                <h2 class="mt-1 text-2xl font-extrabold tracking-tight leading-snug">${escapeHtml(
                  product.nombre
                )}</h2>
              </div>
              <div class="text-3xl font-extrabold tracking-tight">${formatPrice(product.precio)}</div>
              <p class="text-[15px] leading-relaxed text-slate-600 m-0">Un cubo excelente con una rotación suave y tecnología avanzada. Perfecto para mejorar tus tiempos y disfrutar del speedcubing. Incluye ajuste magnético y un diseño de alto rendimiento.</p>

              <div class="flex flex-wrap gap-2">
                ${product.etiquetas
                  .map(
                    (t) =>
                      `<span class="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold text-slate-700">${escapeHtml(
                        t
                      )}</span>`
                  )
                  .join("")}
              </div>

              <div class="mt-auto flex gap-3 pt-6">
                <div class="flex items-center overflow-hidden rounded-2xl border border-slate-900/10 bg-white">
                  <button type="button" class="minus grid h-12 w-10 place-items-center text-lg text-slate-900 hover:bg-slate-900/5">&minus;</button>
                  <input type="number" class="h-12 w-12 border-0 text-center text-base font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" id="drawerQty" value="1" min="1" max="99" />
                  <button type="button" class="plus grid h-12 w-10 place-items-center text-lg text-slate-900 hover:bg-slate-900/5">&plus;</button>
                </div>
                <button type="button" class="flex-1 inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-3 text-base font-semibold text-white hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-blue-500/20" data-drawer-add="${
                  product.id
                }">
                  Añadir al carrito
                </button>
              </div>
            </div>
          `;

          els.productDrawer.classList.remove("hidden");
          // next frame to allow transitions
          requestAnimationFrame(() => {
            if (els.drawerPanel) els.drawerPanel.classList.remove("translate-x-full");
          });
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
        // Update active Tailwind styles
        els.categoryFilters.querySelectorAll("button").forEach((b) => {
          b.classList.remove("bg-slate-900", "text-white");
          b.classList.add("bg-white/70", "text-slate-500", "backdrop-blur");
        });
        e.target.classList.add("bg-slate-900", "text-white");
        e.target.classList.remove("bg-white/70", "text-slate-500", "backdrop-blur");

        // Apply filter
        currentCategory = e.target.getAttribute("data-filter");
        applyFilters();
      }
    });
  }

  function wireDrawer() {
    if (!els.productDrawer) return;

    const closeDrawer = () => {
      if (els.drawerPanel) els.drawerPanel.classList.add("translate-x-full");
      els.productDrawer.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      // wait for transition, then hide overlay
      window.setTimeout(() => {
        if (els.productDrawer) els.productDrawer.classList.add("hidden");
      }, 300);
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
        if (els.cartDropdown && !els.cartDropdown.classList.contains("hidden")) {
          renderCartDropdown();
        }
        const producto = products.find((p) => p.id === productId);
        showToast(producto ? `Añadido: ${producto.nombre} (x${qty})` : `Añadido al carrito (x${qty})`);
        closeDrawer();
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !els.productDrawer.classList.contains("hidden")) {
        closeDrawer();
      }
    });
  }

  function renderCartDropdown() {
    if (!els.cartItems || !els.cartTotalValue) return;

    els.cartItems.innerHTML = "";
    let totalValue = 0;

    if (cart.size === 0) {
      els.cartItems.innerHTML = '<div class="py-5 text-center text-sm text-slate-500">Tu carrito está vacío.</div>';
      els.cartTotalValue.textContent = formatPrice(0);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const [productId, qty] of cart.entries()) {
      const product = products.find((p) => p.id === productId);
      if (!product) continue;

      totalValue += product.precio * qty;
      const imageSrc = product.imagenUrl ? String(product.imagenUrl) : "";

      const item = document.createElement("div");
      item.className = "flex items-center gap-3 border-b border-slate-900/10 pb-3 last:border-b-0 last:pb-0";
      item.innerHTML = `
        <img class="h-12 w-12 flex-none rounded-xl border border-slate-900/10 bg-white object-cover" src="${escapeHtml(
          imageSrc
        )}" alt="" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='https://via.placeholder.com/256x256.png?text=Sin+imagen';">
        <div class="min-w-0 flex-1">
            <div class="text-sm font-semibold leading-tight">${escapeHtml(product.nombre)}</div>
            <div class="mt-1 text-xs font-medium text-slate-500">${formatPrice(product.precio)}</div>
        </div>
        <div class="rounded-lg bg-slate-900/5 px-2 py-1 text-xs font-semibold text-slate-700">x${qty}</div>
        <button type="button" class="ml-1 inline-flex h-9 w-9 flex-none items-center justify-center rounded-xl border border-slate-900/10 bg-white text-slate-700 hover:bg-slate-900/5"
          aria-label="Eliminar" title="Eliminar" data-remove="${escapeHtml(productId)}">&times;</button>
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

      const isOpen = !els.cartDropdown.classList.contains("hidden");
      if (!isOpen) {
        renderCartDropdown();
        els.cartDropdown.classList.remove("hidden");
        els.cartDropdown.setAttribute("aria-hidden", "false");
      } else {
        els.cartDropdown.classList.add("hidden");
        els.cartDropdown.setAttribute("aria-hidden", "true");
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener("click", (e) => {
      if (els.cartDropdown && !els.cartDropdown.classList.contains("hidden")) {
        const target = e.target;
        if (!els.cartDropdown.contains(target) && !els.cartBtn?.contains(target)) {
          els.cartDropdown.classList.add("hidden");
          els.cartDropdown.setAttribute("aria-hidden", "true");
        }
      }
    });

    // Remove item from cart
    els.cartItems?.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("button[data-remove]");
      if (!btn) return;
      const productId = btn.getAttribute("data-remove");
      if (!productId) return;
      removeFromCart(productId);
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

    loadProducts().finally(() => {
      // Initialize with all filters
      applyFilters();
      if (!productsLoaded && els.productCount) {
        // Si no cargó, al menos dejamos el contador consistente
        els.productCount.textContent = "0";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
