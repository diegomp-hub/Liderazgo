/* Panel de pedidos · Los Estudiahambres */
const cfg = window.EH_CONFIG;
const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);
const $ = s => document.querySelector(s);
const money = n => "$" + Number(n || 0).toLocaleString("es-MX");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const ESTADOS = [
  { id: "nuevo", label: "Nuevo" },
  { id: "pagado", label: "Pagado" },
  { id: "preparando", label: "Preparando" },
  { id: "en_camino", label: "En camino" },
  { id: "entregado", label: "Entregado" },
  { id: "cancelado", label: "Cancelado" },
];
let pedidos = [];
let filtro = "todos";
let busqueda = "";
let canal = null;
const frescos = new Set();

/* ---------- Sesión ---------- */
async function init() {
  const { data } = await sb.auth.getSession();
  data.session ? entrar() : mostrarLogin();
}
function mostrarLogin() { $("#login").hidden = false; $("#app").hidden = true; }
$("#login-form").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target);
  $("#login-error").textContent = "";
  const { error } = await sb.auth.signInWithPassword({ email: f.get("email"), password: f.get("password") });
  if (error) { $("#login-error").textContent = "Correo o contraseña incorrectos."; return; }
  entrar();
});
$("#logout").addEventListener("click", async () => { await sb.auth.signOut(); if (canal) sb.removeChannel(canal); mostrarLogin(); });

async function entrar() {
  $("#login").hidden = true; $("#app").hidden = false;
  await cargar();
  suscribir();
}

/* ---------- Datos ---------- */
function desde() {
  const r = $("#range").value, d = new Date(); d.setHours(0, 0, 0, 0);
  if (r === "hoy") return { from: d };
  if (r === "ayer") { const a = new Date(d); a.setDate(a.getDate() - 1); return { from: a, to: d }; }
  if (r === "7") { d.setDate(d.getDate() - 6); return { from: d }; }
  return {};
}
async function cargar() {
  const { from, to } = desde();
  let q = sb.from("pedidos").select("*").order("created_at", { ascending: false }).limit(500);
  if (from) q = q.gte("created_at", from.toISOString());
  if (to) q = q.lt("created_at", to.toISOString());
  const { data, error } = await q;
  if (error) { toast("No se pudieron cargar los pedidos"); console.error(error); return; }
  pedidos = data;
  render();
}
$("#range").addEventListener("change", cargar);

function suscribir() {
  if (canal) sb.removeChannel(canal);
  canal = sb.channel("pedidos-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "pedidos" }, payload => {
      if (payload.eventType === "INSERT") {
        const { from, to } = desde();
        const t = new Date(payload.new.created_at);
        if ((!from || t >= from) && (!to || t < to)) {
          pedidos.unshift(payload.new);
          frescos.add(payload.new.id);
          toast(`🔔 Nuevo pedido de ${payload.new.nombre} · ${money(payload.new.total)}`);
          ding();
        }
      } else if (payload.eventType === "UPDATE") {
        const i = pedidos.findIndex(p => p.id === payload.new.id);
        if (i >= 0) pedidos[i] = payload.new;
      }
      render();
    })
    .subscribe(status => $("#live").classList.toggle("off", status !== "SUBSCRIBED"));
}

async function cambiarEstado(id, estado) {
  const p = pedidos.find(x => x.id === id);
  const antes = p.estado;
  p.estado = estado; render();
  const { error } = await sb.from("pedidos").update({ estado }).eq("id", id);
  if (error) { p.estado = antes; render(); toast("No se pudo guardar el cambio"); }
}

/* ---------- Render ---------- */
function render() {
  renderKpis(); renderTabs(); renderLista(); renderCocina(); renderSplit(); renderAlertas();
}
const activos = () => pedidos.filter(p => p.estado !== "cancelado");

function renderKpis() {
  const a = activos();
  const ingresos = a.reduce((s, p) => s + p.total, 0);
  const porCobrar = a.filter(p => p.estado === "nuevo").reduce((s, p) => s + p.total, 0);
  const comidas = a.reduce((s, p) => s + p.comidas, 0);
  const pendientes = a.filter(p => p.estado !== "entregado").length;
  const ticket = a.length ? Math.round(ingresos / a.length) : 0;
  $("#kpis").innerHTML = `
    <div class="kpi accent"><span>Pedidos</span><b>${a.length}</b><small>${pendientes} por entregar</small></div>
    <div class="kpi"><span>Comidas</span><b>${comidas}</b><small>bowl + agua + postre</small></div>
    <div class="kpi"><span>Ventas</span><b>${money(ingresos)}</b><small>sin cancelados</small></div>
    <div class="kpi"><span>Por cobrar</span><b>${money(porCobrar)}</b><small>esperando comprobante</small></div>
    <div class="kpi"><span>Ticket promedio</span><b>${money(ticket)}</b><small>por pedido</small></div>`;
}
function renderTabs() {
  const count = id => id === "todos" ? pedidos.length : pedidos.filter(p => p.estado === id).length;
  $("#tabs").innerHTML = [{ id: "todos", label: "Todos" }, ...ESTADOS]
    .map(e => `<button class="tab" role="tab" data-f="${e.id}" aria-selected="${filtro === e.id}">${e.label} <em>${count(e.id)}</em></button>`).join("");
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest(".tab"); if (!b) return; filtro = b.dataset.f; render(); });
$("#search").addEventListener("input", e => { busqueda = e.target.value.toLowerCase().trim(); renderLista(); });

function hora(ts) {
  const d = new Date(ts), hoy = new Date();
  const h = d.toLocaleTimeString("es-MX", { hour: "numeric", minute: "2-digit" });
  return d.toDateString() === hoy.toDateString() ? h : d.toLocaleDateString("es-MX", { day: "numeric", month: "short" }) + " · " + h;
}
function waLink(p) {
  let tel = String(p.telefono || "").replace(/\D/g, "");
  if (tel.length === 10) tel = "52" + tel;
  const msg = `¡Hola ${p.nombre}! 👋 Somos Los Estudiahambres. Recibimos tu pedido ${p.folio} por ${money(p.total)}. Para confirmarlo, transfiere a la cuenta que te compartimos y mándanos tu comprobante 🙌`;
  return `https://wa.me/${tel}?text=${encodeURIComponent(msg)}`;
}
function renderLista() {
  const lista = pedidos.filter(p =>
    (filtro === "todos" || p.estado === filtro) &&
    (!busqueda || [p.nombre, p.folio, p.telefono, p.direccion].join(" ").toLowerCase().includes(busqueda)));
  $("#empty").hidden = lista.length > 0;
  $("#order-list").innerHTML = lista.map(p => `
    <article class="order ${frescos.has(p.id) ? "fresh" : ""}">
      <div class="o-top">
        <div class="o-who">
          <b>${esc(p.nombre)}</b><span class="folio">${esc(p.folio)}</span>
          <div class="o-meta">
            <span>🕒 ${hora(p.created_at)}</span>
            <span class="badge ${p.modo === "domicilio" ? "b-dom" : "b-rec"}">${p.modo === "domicilio" ? "🛵 Domicilio" : "🎒 Recoge 2:00 pm"}</span>
            ${p.tiene_plan ? `<span class="badge b-plan">Plan semanal</span>` : ""}
            ${p.tupper ? `<span>♻️ Trae tupper</span>` : ""}
          </div>
          ${p.modo === "domicilio" && p.direccion ? `<div class="o-meta">📍 ${esc(p.direccion)}</div>` : ""}
        </div>
        <div class="o-total">${money(p.total)}<small>${p.comidas} ${p.comidas === 1 ? "comida" : "comidas"}${p.envio ? " · envío " + money(p.envio) : ""}</small></div>
      </div>
      <ul class="o-items">${(p.items || []).map(it => `<li><span class="q">${Number(it.cantidad) || 1}×</span><span>${esc(it.nombre)}<span class="d">${esc(it.detalle)}</span></span></li>`).join("")}</ul>
      ${p.notas ? `<div class="o-note">⚠️ ${esc(p.notas)}</div>` : ""}
      <div class="o-actions">
        <div class="states">${ESTADOS.map(s => `<button class="st" data-id="${p.id}" data-s="${s.id}" aria-pressed="${p.estado === s.id}">${s.label}</button>`).join("")}</div>
        ${p.telefono ? `<a class="wa" href="${waLink(p)}" target="_blank" rel="noopener">WhatsApp ${esc(p.telefono)}</a>` : ""}
      </div>
    </article>`).join("");
  setTimeout(() => frescos.clear(), 2500);
}
$("#order-list").addEventListener("click", e => {
  const b = e.target.closest(".st"); if (!b) return;
  cambiarEstado(Number(b.dataset.id), b.dataset.s);
});

function renderCocina() {
  const cuenta = {};
  activos().forEach(p => (p.items || []).forEach(it => {
    const nombre = it.tipo === "plan" ? "Bowl del día (planes)" : String(it.nombre || "").split(" · ")[0];
    const n = (Number(it.cantidad) || 1) * (it.tipo === "plan" ? (Number(it.comidas) || 1) : 1);
    cuenta[nombre] = (cuenta[nombre] || 0) + n;
  }));
  const filas = Object.entries(cuenta).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...filas.map(f => f[1]));
  const total = filas.reduce((s, f) => s + f[1], 0);
  $("#kitchen-total").textContent = total ? `${total} en total` : "";
  $("#kitchen").innerHTML = filas.length ? filas.map(([n, c]) =>
    `<li><span>${esc(n)}</span><b>${c}</b><span class="bar"><i style="width:${(c / max) * 100}%"></i></span></li>`).join("")
    : `<li class="muted">Sin comidas por preparar.</li>`;
}
function renderSplit() {
  const a = activos();
  const rec = a.filter(p => p.modo === "recoger").reduce((s, p) => s + p.comidas, 0);
  const dom = a.filter(p => p.modo === "domicilio").reduce((s, p) => s + p.comidas, 0);
  $("#split").innerHTML = `<div><span>🎒 Recogen</span><b>${rec}</b></div><div><span>🛵 Domicilio</span><b>${dom}</b></div>`;
}
function renderAlertas() {
  const con = activos().filter(p => p.notas);
  $("#alerts").innerHTML = con.length ? con.map(p => `<li><b>${esc(p.nombre)} · ${esc(p.folio)}</b>${esc(p.notas)}</li>`).join("")
    : `<li class="muted" style="background:none;padding:0">Nadie reportó alergias.</li>`;
}

/* ---------- Extras ---------- */
$("#export").addEventListener("click", () => {
  const cols = ["folio", "created_at", "nombre", "telefono", "modo", "direccion", "notas", "comidas", "subtotal", "envio", "descuento", "total", "estado"];
  const rows = pedidos.map(p => [...cols.map(c => p[c]), (p.items || []).map(i => `${i.cantidad}x ${i.nombre}`).join(" | ")]);
  const csv = [[...cols, "items"], ...rows].map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
  a.download = `pedidos-estudiahambres-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
});
let toastT;
function toast(m) { const t = $("#toast"); t.textContent = m; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 3500); }
function ding() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [880, 1320].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.3);
      o.start(ctx.currentTime + i * 0.15); o.stop(ctx.currentTime + i * 0.15 + 0.3);
    });
  } catch {}
}
init();
