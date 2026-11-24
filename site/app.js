/* Los Estudiahambres · lógica de la página */
const WA_NUMBER = "529841791457";
const PRICE_SUELTO = 85;
const ENVIO = 20;
const TUPPER = 5;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const money = n => "$" + n.toLocaleString("es-MX");

/* ---------- Menú ---------- */
const MENU = [
  { id: "chipotle", name: "Pollo Chipotle", tag: "El favorito", img: "img/bowl-chipotle.webp",
    ing: "Arroz blanco con cilantro, pollo al chipotle, frijol negro, elote asado, aguacate, pico de gallo, cebolla encurtida y crema chipotle." },
  { id: "cochinita", name: "Cochinita Bowl", tag: "100% yucateco", img: "img/bowl-cochinita.webp",
    ing: "Arroz blanco, cochinita pibil, cebolla morada con habanero (aparte), frijol colado, pepino, aguacate y limón." },
  { id: "asada", name: "Asada con Nopales", tag: "Más proteína", img: "img/bowl-asada.webp",
    ing: "Arroz integral, carne asada, frijoles charros, nopales asados, elote, salsa verde, queso fresco y aguacate." },
  { id: "tinga", name: "Tinga Bowl", tag: "Como en casa", img: "img/bowl-tinga.webp",
    ing: "Arroz blanco, tinga de pollo, frijoles refritos, lechuga, crema, queso fresco y aguacate." },
  { id: "veggie", name: "Veggie Panela", tag: "Vegetariano", img: "img/bowl-veggie.webp",
    ing: "Arroz rojo, frijol negro, panela asada, calabacitas con elote, pico de gallo, aguacate y totopos." },
];

function renderMenu() {
  const grid = $("#menu-grid");
  grid.innerHTML = MENU.map(d => `
    <article class="dish">
      <div class="dish-img"><img src="${d.img}" alt="${d.name}" loading="lazy" width="600" height="450"><span class="dish-tag">${d.tag}</span></div>
      <div class="dish-body">
        <h3>${d.name}</h3>
        <p class="dish-ing">${d.ing}</p>
        <div class="dish-foot">
          <div class="dish-price">${money(PRICE_SUELTO)}<small>bowl + agua + postre</small></div>
          <button class="add-btn" data-add="${d.id}">Agregar +</button>
        </div>
      </div>
    </article>`).join("") + `
    <a class="dish dish-custom" href="#arma">
      <h3>¿NINGUNO? ARMA EL TUYO.</h3>
      <p>Tú eliges base, proteína, toppings, salsa, agua y postre. Mismo precio.</p>
      <img src="img/pepe-cel.webp" alt="" width="150" height="150" loading="lazy">
    </a>`;
  grid.addEventListener("click", e => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const d = MENU.find(x => x.id === b.dataset.add);
    addToCart({ key: "dish-" + d.id, kind: "dish", name: d.name, desc: "Bowl + agua del día + postre", img: d.img, price: PRICE_SUELTO, meals: 1 });
  });
}

/* ---------- Arma tu bowl ---------- */
const STEPS = [
  { id: "base", title: "1. Base", hint: "elige 1", max: 1, opts: [
    { n: "Arroz blanco", c: "#F4EFE3" }, { n: "Arroz rojo", c: "#E58B4E" }, { n: "Arroz integral", c: "#B98B5A" }, { n: "Mitad arroz, mitad lechuga", c: "#9BCB6A" } ] },
  { id: "prot", title: "2. Proteína", hint: "elige 1", max: 1, opts: [
    { n: "Pollo chipotle", c: "#D9773B" }, { n: "Cochinita pibil", c: "#C4562A" }, { n: "Tinga de pollo", c: "#C9452F" },
    { n: "Carne asada", c: "#6B3A26", p: 10 }, { n: "Panela asada", c: "#F3E3B5" }, { n: "Huevo a la mexicana", c: "#F2C94C" } ] },
  { id: "top", title: "3. Toppings", hint: "elige 3 incluidos", max: 3, opts: [
    { n: "Frijol negro", c: "#2B2126" }, { n: "Elote asado", c: "#F6CF45" }, { n: "Pico de gallo", c: "#E2483D" }, { n: "Nopales", c: "#5C9A3E" },
    { n: "Pepino", c: "#9FD37E" }, { n: "Calabacitas", c: "#A8C95A" }, { n: "Cebolla encurtida", c: "#D35D9A" }, { n: "Queso fresco", c: "#FBF7EE" }, { n: "Totopos", c: "#E9B04F" } ] },
  { id: "salsa", title: "4. Salsa", hint: "elige 1", max: 1, opts: [
    { n: "Crema chipotle", c: "#F0A46B" }, { n: "Salsa verde", c: "#6BAA3A" }, { n: "Roja tatemada", c: "#B3321F" }, { n: "Habanero (pica)", c: "#FF8A00" }, { n: "Sin salsa", c: null } ] },
  { id: "agua", title: "5. Agua del día (500 ml)", hint: "elige 1", max: 1, opts: [
    { n: "Horchata" }, { n: "Jamaica" }, { n: "Limón con chía" } ] },
  { id: "postre", title: "6. Postre", hint: "elige 1", max: 1, opts: [
    { n: "Fruta con chile" }, { n: "Gelatina" }, { n: "Arroz con leche" } ] },
  { id: "extra", title: "7. Extras", hint: "opcional", max: 9, opts: [
    { n: "Aguacate extra", p: 10, c: "#7DB24A" }, { n: "Doble proteína", p: 20 }, { n: "Porción grande de arroz", p: 8 } ] },
];
const sel = Object.fromEntries(STEPS.map(s => [s.id, []]));
const SAYS = {
  start: "Empieza eligiendo tu base 👇",
  base: ["Buena base, crack.", "Así se empieza.", "Arroz: el combustible del estudiante."],
  prot: ["Uff, eso es proteína de verdad 💪", "Con eso pasas el parcial.", "Buenísima elección."],
  top: ["Se ve colorido, me gusta.", "Toppings de chef.", "Eso ya se ve de Instagram 📸"],
  salsa: ["La salsa es la que manda.", "¡Pica pero rico! 🔥", "Ahora sí, sabor."],
  agua: ["Hidratado y feliz.", "Buena elección de agua."],
  postre: ["Y para el antojo… ✨", "El postre nunca falla."],
  done: "¡Quedó increíble! Ya agrégalo, yo te espero 🤤",
  full: "Solo 3 toppings incluidos. Quita uno para cambiarlo.",
};
const pick = a => Array.isArray(a) ? a[Math.floor(Math.random() * a.length)] : a;

function renderBuilder() {
  $("#builder-steps").innerHTML = STEPS.map(s => `
    <div class="step" data-step="${s.id}">
      <div class="step-head"><h3>${s.title}</h3><span>${s.hint}</span></div>
      <div class="opts">${s.opts.map((o, i) => `<button type="button" class="opt" data-s="${s.id}" data-i="${i}" aria-pressed="false">${o.n}${o.p ? `<small>+$${o.p}</small>` : ""}</button>`).join("")}</div>
    </div>`).join("");
  $("#builder-steps").addEventListener("click", e => {
    const b = e.target.closest(".opt");
    if (!b) return;
    const step = STEPS.find(s => s.id === b.dataset.s);
    const i = +b.dataset.i;
    const arr = sel[step.id];
    const has = arr.includes(i);
    let msg;
    if (step.max === 1) { sel[step.id] = has ? [] : [i]; }
    else if (has) { arr.splice(arr.indexOf(i), 1); }
    else if (arr.length >= step.max) { msg = SAYS.full; }
    else arr.push(i);
    $$(`.opt[data-s="${step.id}"]`).forEach(o => o.setAttribute("aria-pressed", sel[step.id].includes(+o.dataset.i)));
    if (!msg && !has && SAYS[step.id]) msg = pick(SAYS[step.id]);
    updateBuilder(msg);
  });
  $("#builder-add").addEventListener("click", () => {
    const parts = STEPS.filter(s => sel[s.id].length).map(s => sel[s.id].map(i => s.opts[i].n).join(", "));
    const protName = STEPS[1].opts[sel.prot[0]].n;
    addToCart({ key: "custom-" + Date.now(), kind: "custom", name: "Bowl a tu gusto · " + protName, desc: parts.join(" · "), img: "img/pepe-bowl.webp", price: builderPrice(), meals: 1 });
    STEPS.forEach(s => sel[s.id] = []);
    $$(".opt").forEach(o => o.setAttribute("aria-pressed", "false"));
    updateBuilder("¡Listo! Ya está en tu pedido. ¿Armamos otro?");
  });
  updateBuilder();
}
function builderPrice() {
  let p = PRICE_SUELTO;
  STEPS.forEach(s => sel[s.id].forEach(i => p += s.opts[i].p || 0));
  return p;
}
function builderComplete() {
  return ["base", "prot", "salsa", "agua", "postre"].every(k => sel[k].length) && sel.top.length === 3;
}
function updateBuilder(msg) {
  // Visual del bowl
  const viz = $("#bowl-viz");
  const layers = [];
  sel.base.forEach(i => layers.push({ c: STEPS[0].opts[i].c, big: true }));
  ["prot", "top", "salsa", "extra"].forEach(id => {
    const st = STEPS.find(s => s.id === id);
    sel[id].forEach(i => st.opts[i].c && layers.push({ c: st.opts[i].c }));
  });
  viz.innerHTML = layers.map((l, k) => {
    if (l.big) return `<i style="background:${l.c};width:240px;height:120px;left:-20px;top:-40px"></i>`;
    const x = 18 + ((k * 47) % 140), y = -8 + ((k * 23) % 24), s = 34 + ((k * 13) % 18);
    return `<i style="background:${l.c};width:${s}px;height:${s}px;left:${x}px;top:${y}px"></i>`;
  }).join("");
  // Lista
  $("#builder-list").innerHTML = STEPS.filter(s => sel[s.id].length)
    .map(s => `<li><b>${s.title.replace(/^\d\.\s/, "")}:</b> ${sel[s.id].map(i => s.opts[i].n).join(", ")}</li>`).join("");
  $("#builder-total").textContent = money(builderPrice());
  const done = builderComplete();
  $("#builder-add").disabled = !done;
  const pepe = $("#pepe-builder");
  pepe.src = done ? "img/pepe-bowl.webp" : "img/pepe-cel.webp";
  $("#builder-say").textContent = done && !msg?.startsWith("¡Listo") ? SAYS.done : (msg || (layers.length ? $("#builder-say").textContent : SAYS.start));
  pepe.classList.remove("pop"); void pepe.offsetWidth; if (msg) pepe.classList.add("pop");
}

/* ---------- Planes ---------- */
const PLANS = [
  { n: 1, name: "Oyente", price: 82 },
  { n: 2, name: "Medio Turno", price: 79 },
  { n: 3, name: "Regular", price: 76, badge: "MÁS POPULAR" },
  { n: 4, name: "Cuadro de Honor", price: 73, freeShip: true },
  { n: 5, name: "Beca Completa", price: 70, freeShip: true, badge: "MEJOR PRECIO" },
];
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie"];
let plan = null, planDays = [];
function renderPlans() {
  $("#plans").innerHTML = PLANS.map((p, i) => {
    const week = p.n * p.price, save = (PRICE_SUELTO - p.price) * p.n * 4;
    return `<button type="button" class="plan" data-plan="${i}" aria-pressed="false">
      ${p.badge ? `<span class="plan-badge">${p.badge}</span>` : ""}
      <span class="plan-n">${p.n}<small>${p.n === 1 ? "comida" : "comidas"}/sem</small></span>
      <span class="plan-name">${p.name}</span>
      <span class="plan-price">${money(p.price)}<small> c/u</small></span>
      <span class="plan-week">${money(week)} a la semana</span>
      <span class="plan-save">Ahorras ${money(save)} al mes${p.freeShip ? " · envío gratis" : ""}</span>
    </button>`;
  }).join("");
  $("#days").innerHTML = DAYS.map((d, i) => `<button type="button" class="day" data-day="${i}" aria-pressed="false">${d}</button>`).join("");
  $("#plans").addEventListener("click", e => {
    const b = e.target.closest(".plan"); if (!b) return;
    plan = PLANS[+b.dataset.plan];
    $$(".plan").forEach(x => x.setAttribute("aria-pressed", x === b));
    planDays = plan.n === 5 ? [0, 1, 2, 3, 4] : planDays.slice(0, plan.n);
    $("#plan-config").hidden = false;
    $("#plan-config-title").textContent = `Plan ${plan.name}: elige ${plan.n === 1 ? "tu día" : `tus ${plan.n} días`}`;
    syncDays();
    $("#plan-config").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
  $("#days").addEventListener("click", e => {
    const b = e.target.closest(".day"); if (!b || !plan) return;
    const d = +b.dataset.day;
    if (planDays.includes(d)) planDays = planDays.filter(x => x !== d);
    else if (planDays.length < plan.n) planDays.push(d);
    else { planDays.shift(); planDays.push(d); }
    syncDays();
  });
  $("#plan-add").addEventListener("click", () => {
    const days = planDays.slice().sort().map(i => DAYS[i]).join(", ");
    const surprise = $("#plan-surprise").checked;
    addToCart({ key: "plan", kind: "plan", name: `Plan ${plan.name} · ${plan.n}/sem`, desc: `${days} · ${surprise ? "bowl del día" : "eliges tu bowl cada día por WhatsApp"} · ${money(plan.price)} c/u`, img: "img/pepe-icono.webp", price: plan.n * plan.price, meals: plan.n, planN: plan.n, freeShip: !!plan.freeShip, unit: "semana" }, true);
  });
}
function syncDays() {
  $$(".day").forEach(b => b.setAttribute("aria-pressed", planDays.includes(+b.dataset.day)));
  const left = plan.n - planDays.length;
  $("#plan-hint").textContent = left > 0 ? `Te falta${left > 1 ? "n" : ""} ${left} día${left > 1 ? "s" : ""}.` : `¡Listo! Te toca comida rica ${planDays.slice().sort().map(i => DAYS[i]).join(", ")}.`;
  $("#plan-add").disabled = left > 0;
}

/* ---------- Carrito ---------- */
let cart = [];
try { cart = JSON.parse(localStorage.getItem("eh-cart") || "[]"); } catch { cart = []; }
const save = () => { try { localStorage.setItem("eh-cart", JSON.stringify(cart)); } catch {} };

function addToCart(item, replacePlan) {
  if (replacePlan) cart = cart.filter(x => x.kind !== "plan");
  const ex = cart.find(x => x.key === item.key);
  if (ex) ex.qty++; else cart.push({ ...item, qty: 1 });
  save(); renderCart();
  const btn = $("#open-cart"); btn.classList.remove("bump"); void btn.offsetWidth; btn.classList.add("bump");
  toast(`✓ ${item.name} agregado`);
}
function totals() {
  const mode = $('input[name="mode"]:checked').value;
  const tupper = $('input[name="tupper"]').checked && mode === "recoger";
  let sub = 0, dishMeals = 0, env = 0, desc = 0;
  cart.forEach(it => {
    sub += it.price * it.qty;
    if (it.kind === "plan") {
      if (mode === "domicilio" && !it.freeShip) env += ENVIO * it.planN * it.qty;
    } else dishMeals += it.qty;
    if (tupper) desc += TUPPER * it.meals * it.qty;
  });
  if (mode === "domicilio" && dishMeals > 0 && dishMeals < 3) env += ENVIO;
  return { mode, sub, env, desc, total: sub + env - desc };
}
function renderCart() {
  const count = cart.reduce((a, x) => a + x.qty, 0);
  $("#cart-count").textContent = count;
  $("#cart-empty").hidden = cart.length > 0;
  $("#cart-list").innerHTML = cart.map((it, i) => `
    <li class="cart-item">
      <img src="${it.img}" alt="">
      <div><h4>${it.name}</h4><p>${it.desc}</p></div>
      <div class="cart-right"><b>${money(it.price * it.qty)}${it.unit ? `<small style="font-size:11px">/${it.unit}</small>` : ""}</b>
        <span class="qty"><button type="button" data-q="${i}" data-d="-1" aria-label="Quitar uno">−</button>${it.qty}<button type="button" data-q="${i}" data-d="1" aria-label="Agregar uno">+</button></span>
      </div>
    </li>`).join("");
  const t = totals();
  $("#t-sub").textContent = money(t.sub);
  $("#t-env").textContent = t.mode === "domicilio" ? (t.env ? money(t.env) : "¡Gratis!") : "$0";
  $("#t-desc").textContent = t.desc ? "−" + money(t.desc) : "$0";
  $("#t-total").textContent = money(t.total);
  $("#send-order").disabled = !cart.length;
  $("#addr-field").hidden = t.mode !== "domicilio";
  $('#addr-field input').required = t.mode === "domicilio";
}
$("#cart-list").addEventListener("click", e => {
  const b = e.target.closest("[data-q]"); if (!b) return;
  const it = cart[+b.dataset.q];
  it.qty += +b.dataset.d;
  if (it.qty <= 0) cart.splice(+b.dataset.q, 1);
  save(); renderCart();
});
$("#order-form").addEventListener("change", renderCart);

const drawer = $("#drawer"), backdrop = $("#backdrop");
function openCart() { drawer.classList.add("open"); drawer.setAttribute("aria-hidden", "false"); backdrop.hidden = false; }
function closeCart() { drawer.classList.remove("open"); drawer.setAttribute("aria-hidden", "true"); backdrop.hidden = true; }
$("#open-cart").addEventListener("click", openCart);
$("#close-cart").addEventListener("click", closeCart);
backdrop.addEventListener("click", closeCart);
document.addEventListener("keydown", e => { if (e.key === "Escape") { closeCart(); $("#modal").hidden = true; } });

$("#order-form").addEventListener("submit", e => {
  e.preventDefault();
  const f = new FormData(e.target);
  const t = totals();
  const lines = [
    "🍽️ *NUEVO PEDIDO · Los Estudiahambres*",
    "",
    ...cart.map(it => `• ${it.qty}× *${it.name}* — ${money(it.price * it.qty)}${it.unit ? "/" + it.unit : ""}\n   ${it.desc}`),
    "",
    `📍 ${t.mode === "domicilio" ? "A domicilio: " + (f.get("direccion") || "") : "Recojo en campus · 2:00 pm"}`,
    `👤 ${f.get("nombre")}`,
    f.get("notas") ? `⚠️ ${f.get("notas")}` : null,
    f.get("tupper") && t.mode === "recoger" ? "♻️ Llevo mi tupper" : null,
    "",
    `Subtotal: ${money(t.sub)}`,
    t.mode === "domicilio" ? `Envío: ${t.env ? money(t.env) : "gratis"}` : null,
    t.desc ? `Descuento tupper: −${money(t.desc)}` : null,
    `*TOTAL: ${money(t.total)}*`,
    "",
    "¿Me pasan los datos para la transferencia? 🙌",
  ].filter(x => x !== null).join("\n");
  window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(lines)}`, "_blank", "noopener");
  closeCart();
  $("#modal").hidden = false;
  cart = []; save(); renderCart();
});
$("#modal-close").addEventListener("click", () => $("#modal").hidden = true);

/* ---------- Cuenta regresiva ---------- */
function tick() {
  const now = new Date();
  const close = new Date(now); close.setHours(10, 30, 0, 0);
  let label = "PEDIDOS DE HOY CIERRAN 10:30 AM · ENTREGA 2:00 PM";
  const isWeekday = d => d.getDay() >= 1 && d.getDay() <= 5;
  if (!isWeekday(now) || now >= close) {
    do { close.setDate(close.getDate() + 1); } while (!isWeekday(close));
    const dn = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"][close.getDay()];
    label = `PEDIDOS PARA EL ${dn.toUpperCase()} CIERRAN 10:30 AM · ENTREGA 2:00 PM`;
  }
  let s = Math.max(0, Math.floor((close - now) / 1000));
  const d = Math.floor(s / 86400); s %= 86400;
  const h = String(Math.floor(s / 3600)).padStart(2, "0"), m = String(Math.floor(s % 3600 / 60)).padStart(2, "0"), ss = String(s % 60).padStart(2, "0");
  $("#topbar-text").textContent = label;
  $("#countdown").textContent = (d ? d + "d " : "") + `${h}:${m}:${ss}`;
}

/* ---------- Pepe interactivo ---------- */
const HERO_LINES = ["¡Qué onda! Soy Pepe 👋 ¿Ya comiste?", "Bowl + agua + postre por $85. Hazme caso.", "Con plan sale desde $70, eh 👀", "Yo también estudio aquí, sé lo que es el hambre.", "¡Deja de picarme y pide tu bowl! 😂", "Pide antes de las 10:30 y a las 2 ya comes."];
let heroIdx = 0;
$("#pepe-hero").addEventListener("click", e => {
  const p = e.currentTarget;
  heroIdx = (heroIdx + 1) % HERO_LINES.length;
  $("#bubble-hero").textContent = HERO_LINES[heroIdx];
  p.classList.remove("wiggle"); void p.offsetWidth; p.classList.add("wiggle");
});
const PEEK_LINES = ["psst… ¿ya pediste? 👀", "El Cochinita Bowl está buenísimo hoy.", "Arma tu bowl, yo te ayudo 🙌", "Plan Regular: el que más piden.", "¿Traes tupper? Te ahorras $5."];
let peekIdx = 0;
const peek = $("#pepe-peek");
let talkT;
function talk() { peek.classList.add("talk"); clearTimeout(talkT); talkT = setTimeout(() => peek.classList.remove("talk"), 2800); }
peek.addEventListener("click", () => {
  talk();
  peekIdx = (peekIdx + 1) % PEEK_LINES.length;
  $("#bubble-peek").textContent = PEEK_LINES[peekIdx];
  peek.classList.remove("wiggle"); void peek.offsetWidth; peek.classList.add("wiggle");
});
let lastShow = 0;
window.addEventListener("scroll", () => {
  const y = window.scrollY, h = document.body.scrollHeight - innerHeight;
  const show = y > 900 && y < h - 500;
  if (show !== !!lastShow) { peek.classList.toggle("show", show); lastShow = show ? 1 : 0; if (show) talk(); }
}, { passive: true });

let toastT;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 1800);
}

renderMenu(); renderBuilder(); renderPlans(); renderCart(); tick(); setInterval(tick, 1000);
