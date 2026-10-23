import { useEffect, useMemo, useState } from "react";
import { supabase, supabaseConfigured } from "./supabase";

const PRODUCTS = [
  { id: 1, name: "Pametna ura Active", price: 59.90, oldPrice: 79.90, emoji: "⌚", category: "Elektronika", tag: "-25 %", rating: 4.8, description: "Spremljanje aktivnosti, obvestila in baterija za več dni." },
  { id: 2, name: "Brezžične slušalke", price: 39.90, oldPrice: 49.90, emoji: "🎧", category: "Elektronika", tag: "Uspešnica", rating: 4.7, description: "Udobne slušalke za glasbo, delo in potovanja." },
  { id: 3, name: "Športni copati Urban", price: 74.90, emoji: "👟", category: "Šport", rating: 4.6, description: "Lahki vsakodnevni copati z mehkim podplatom." },
  { id: 4, name: "Nahrbtnik Explorer", price: 34.90, emoji: "🎒", category: "Moda", rating: 4.5, description: "Praktičen nahrbtnik za mesto, šolo ali izlet." },
  { id: 5, name: "Namizna svetilka", price: 24.90, emoji: "💡", category: "Dom", rating: 4.8, description: "Topla svetloba in minimalističen videz za delovno mizo." },
  { id: 6, name: "Kavni aparat Mini", price: 89.90, oldPrice: 109.90, emoji: "☕", category: "Dom", tag: "-18 %", rating: 4.9, description: "Pripravi svojo najljubšo kavo s pritiskom na gumb." },
  { id: 7, name: "Prenosni zvočnik", price: 44.90, emoji: "🔊", category: "Elektronika", rating: 4.5, description: "Kompakten zvočnik za glasbo doma in na poti." },
  { id: 8, name: "Steklenica za vodo", price: 16.90, emoji: "🧴", category: "Šport", rating: 4.4, description: "Večkrat uporabna steklenica za vsakodnevno hidracijo." },
  { id: 9, name: "Sončna očala", price: 29.90, emoji: "🕶️", category: "Moda", rating: 4.3, description: "Brezčasen dodatek za sončne dni." },
  { id: 10, name: "Mehka odeja", price: 27.90, emoji: "🧣", category: "Dom", rating: 4.7, description: "Mehka in prijetna odeja za večere na kavču." },
  { id: 11, name: "Tipkovnica Compact", price: 54.90, emoji: "⌨️", category: "Elektronika", rating: 4.6, description: "Kompaktna tipkovnica za urejeno delovno mizo." },
  { id: 12, name: "Podloga za vadbo", price: 22.90, emoji: "🧘", category: "Šport", rating: 4.5, description: "Udobna nedrseča podloga za raztezanje in vadbo." }
];
const money = (value) => new Intl.NumberFormat("sl-SI", { style: "currency", currency: "EUR" }).format(value);
const readCart = () => { try { return JSON.parse(localStorage.getItem("be-cart") || "[]"); } catch { return []; } };
const readFavorites = () => { try { return JSON.parse(localStorage.getItem("be-favorites") || "[]"); } catch { return []; } };

export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMode, setAuthMode] = useState("register");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState("info");
  const [busy, setBusy] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [filter, setFilter] = useState("Vsi izdelki");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("featured");
  const [favorites, setFavorites] = useState(readFavorites);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [cart, setCart] = useState(readCart);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customer, setCustomer] = useState({ name: "", phone: "", address: "", city: "", postal: "", note: "" });
  const [checkoutNotice, setCheckoutNotice] = useState("");
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setAuthLoading(false); return; }
    let alive = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!alive) return;
      if (error) showNotice(error.message, "error");
      setSession(data?.session ?? null);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => { setSession(newSession); setAuthLoading(false); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);
  useEffect(() => { localStorage.setItem("be-cart", JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem("be-favorites", JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => { if (session?.user) setCustomer(c => ({ ...c, name: c.name || session.user.user_metadata?.full_name || "" })); }, [session]);

  function showNotice(message, type = "info") { setNotice(message); setNoticeType(type); }
  async function handleAuth(event) {
    event.preventDefault();
    if (!supabaseConfigured) { showNotice("Prijava še ni povezana. Nastavi VITE_SUPABASE_URL in VITE_SUPABASE_ANON_KEY v datoteki .env.local.", "error"); return; }
    setBusy(true); setNotice("");
    try {
      const normalizedEmail = email.trim().toLowerCase();
      if (authMode === "register") {
        const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { emailRedirectTo: `${window.location.origin}/`, data: { full_name: fullName.trim() } } });
        if (error) throw error;
        if (data.session) showNotice("Račun je ustvarjen. Dobrodošel/-la v BuyEverything!", "success");
        else { setPendingEmail(normalizedEmail); showNotice("Poslali smo potrditveno povezavo. Preveri e-pošto in mapo z vsiljeno pošto. Po potrditvi se vrneš v trgovino.", "success"); }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
        if (error) { const msg = String(error.message || "").toLowerCase(); if (msg.includes("email not confirmed") || msg.includes("not confirmed")) { setPendingEmail(normalizedEmail); showNotice("E-pošta še ni potrjena. Potrdi jo prek povezave ali zahtevaj novo.", "error"); } else throw error; }
        else if (data.session) showNotice("Uspešno si prijavljen/-a.", "success");
      }
    } catch (error) { showNotice(error.message || "Prišlo je do napake. Poskusi znova.", "error"); }
    finally { setBusy(false); }
  }
  async function resetPassword() {
    if (!supabaseConfigured) { showNotice("Najprej poveži Supabase.", "error"); return; }
    if (!email.trim()) { showNotice("Najprej vpiši svoj e-poštni naslov.", "error"); return; }
    setBusy(true);
    try { const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/` }); if (error) throw error; showNotice("Če račun obstaja, smo poslali navodila za ponastavitev gesla.", "success"); }
    catch (error) { showNotice(error.message || "Ponastavitev trenutno ni uspela.", "error"); }
    finally { setBusy(false); }
  }
  async function resendConfirmation() {
    if (!supabaseConfigured || !pendingEmail) return;
    setBusy(true);
    try { const { error } = await supabase.auth.resend({ type: "signup", email: pendingEmail, options: { emailRedirectTo: `${window.location.origin}/` } }); if (error) throw error; showNotice("Če je naslov upravičen do potrditve, smo poslali novo sporočilo. Preveri tudi vsiljeno pošto.", "success"); }
    catch (error) { showNotice(error.message || "Potrditvenega sporočila trenutno ni mogoče poslati.", "error"); }
    finally { setBusy(false); }
  }
  async function signOut() { const { error } = await supabase.auth.signOut(); if (error) showNotice(error.message, "error"); else showNotice("Odjavljen/-a si.", "success"); }

  const categories = ["Vsi izdelki", "Elektronika", "Moda", "Dom", "Šport"];
  const shownProducts = useMemo(() => {
    const list = PRODUCTS.filter(p => (filter === "Vsi izdelki" || p.category === filter) && p.name.toLowerCase().includes(search.toLowerCase().trim()) && (!onlyFavorites || favorites.includes(p.id)));
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [filter, search, sort, onlyFavorites, favorites]);
  const count = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.qty * item.price, 0);
  const shipping = subtotal === 0 || subtotal >= 60 ? 0 : 3.90;
  const total = subtotal + shipping;
  function addToCart(product) { setCart(current => current.some(item => item.id === product.id) ? current.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item) : [...current, { ...product, qty: 1 }]); }
  function changeQty(id, delta) { setCart(current => current.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0)); }
  function toggleFavorite(id) { setFavorites(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]); }
  function submitCheckout(event) { event.preventDefault(); setCheckoutNotice("Podatki so izpolnjeni, vendar naročilo še ni poslano. Za pravo oddajo naročila je treba povezati strežniško bazo in dostavo/plačila. Tvojih podatkov nismo poslali nikamor."); }

  if (authLoading) return <main className="center-screen"><div className="spinner" /><p>Preverjam prijavo …</p></main>;
  if (!session) return <main className="auth-page"><section className="auth-card"><div className="brand-mark">🛍️</div><p className="eyebrow center">DOBRODOŠEL V TRGOVINI</p><h1>BuyEverything</h1><p className="muted center">Vse, kar potrebuješ. Na enem mestu.</p><div className="tabs"><button className={authMode === "register" ? "tab active" : "tab"} onClick={() => { setAuthMode("register"); showNotice(""); }}>Ustvari račun</button><button className={authMode === "login" ? "tab active" : "tab"} onClick={() => { setAuthMode("login"); showNotice(""); }}>Prijava</button></div><form onSubmit={handleAuth}>{authMode === "register" && <label>Ime in priimek<input value={fullName} onChange={e => setFullName(e.target.value)} required autoComplete="name" placeholder="Janez Novak" /></label>}<label>E-poštni naslov<input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="ime@gmail.com" /></label><label>Geslo<input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoComplete={authMode === "register" ? "new-password" : "current-password"} placeholder="Vsaj 8 znakov" /></label><button className="primary full" disabled={busy}>{busy ? "Prosim počakaj …" : authMode === "register" ? "Ustvari račun →" : "Prijavi se →"}</button></form>{authMode === "login" && <button className="link-button reset" disabled={busy} onClick={resetPassword}>Pozabljeno geslo?</button>}{notice && <div className={`notice ${noticeType}`} role="status">{notice}</div>}{pendingEmail && <button className="secondary full resend" disabled={busy} onClick={resendConfirmation}>Znova pošlji potrditveno e-pošto</button>}{!supabaseConfigured && <div className="notice warning">Za pravo prijavo mora biti povezan Supabase. Nastavitev je opisana v datoteki README.md.</div>}<p className="tiny center">Z registracijo se strinjaš s pogoji uporabe in pravilnikom zasebnosti, ki ju mora lastnik trgovine dokončno objaviti.</p></section></main>;

  return <div className="app-shell"><div className="announcement">✨ Dobrodošel v BuyEverything <span>•</span> Brezplačna dostava nad 60 €</div><header className="topbar"><a className="brand brand-link" href="#top" aria-label="BuyEverything domov"><span className="brand-mark small">🛍️</span><span><strong>BuyEverything</strong><small>Vse na enem mestu.</small></span></a><div className="header-search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Kaj iščeš danes?" aria-label="Išči izdelke" /></div><div className="account"><button className="favorites-shortcut" onClick={() => { setOnlyFavorites(v => !v); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }} title="Priljubljeni izdelki">♡ <span>{favorites.length}</span></button><span className="user-dot">{(session.user.user_metadata?.full_name || session.user.email || "U").slice(0,1).toUpperCase()}</span><span className="account-email">{session.user.user_metadata?.full_name || session.user.email}</span><button className="secondary compact" onClick={signOut}>Odjava</button></div></header>
  <main id="top"><section className="hero"><div className="hero-copy"><span className="hero-label">TVOJ NOVI NAJLJUBŠI NAKUP</span><h1>Najdi nekaj<br/><em>odličnega.</em></h1><p>Premišljeni izdelki za vsak dan. Preprosto nakupovanje, brez kompliciranja.</p><button className="primary hero-button" onClick={() => document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" })}>Razišči izdelke <span>↓</span></button><div className="hero-perks"><span>✓ Varno nakupovanje</span><span>✓ Enostavna košarica</span></div></div><div className="hero-art"><div className="hero-orbit orbit-one"/><div className="hero-orbit orbit-two"/><div className="hero-product hero-product-one">🎧</div><div className="hero-product hero-product-two">⌚</div><div className="hero-product hero-product-three">🎒</div><div className="hero-sticker">DOBRE<br/>STVARI<br/><b>ZA VSAK DAN</b></div></div></section>
  <section className="trust-strip"><div><span>🚚</span><p><b>Preprosta dostava</b><small>Pregledni stroški pred nakupom</small></p></div><div><span>🔒</span><p><b>Račun je zaščiten</b><small>Prijava prek Supabase Auth</small></p></div><div><span>💚</span><p><b>Izberi po svoje</b><small>Priljubljeni izdelki in filtri</small></p></div></section>
  <div className="store-layout"><section className="catalog" id="catalog"><div className="catalog-heading"><div><p className="eyebrow">NAŠA PONUDBA</p><h2>Izdelki za vsak dan<span className="heading-dot">.</span></h2><p className="muted">Poišči svoj naslednji najljubši izdelek.</p></div><span className="count-pill">{PRODUCTS.length} izdelkov</span></div><div className="catalog-tools"><div className="search-box"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Išči izdelke …" aria-label="Išči izdelke" /></div><select value={sort} onChange={e => setSort(e.target.value)} aria-label="Razvrsti izdelke"><option value="featured">Priporočeno</option><option value="price-low">Cena: od najnižje</option><option value="price-high">Cena: od najvišje</option><option value="rating">Najbolje ocenjeni</option></select></div><div className="catalog-bottom-tools"><div className="filters">{categories.map(category => <button key={category} onClick={() => setFilter(category)} className={filter === category ? "filter active" : "filter"}>{category}</button>)}</div><button className={onlyFavorites ? "link-button selected" : "link-button"} onClick={() => setOnlyFavorites(v => !v)}>{onlyFavorites ? "♥ Priljubljeni" : "♡ Prikaži priljubljene"}</button></div><div className="product-grid">{shownProducts.map(product => <article className="product-card" key={product.id}><div className={`product-art art-${product.category.toLowerCase()}`}><span className="product-emoji">{product.emoji}</span>{product.tag && <span className="product-tag">{product.tag}</span>}<button className={favorites.includes(product.id) ? "heart active" : "heart"} onClick={() => toggleFavorite(product.id)} aria-label={favorites.includes(product.id) ? "Odstrani iz priljubljenih" : "Dodaj med priljubljene"}>{favorites.includes(product.id) ? "♥" : "♡"}</button></div><div className="product-meta"><span>{product.category}</span><span className="rating">★ {product.rating.toFixed(1).replace(".", ",")}</span></div><h3>{product.name}</h3><p className="product-description">{product.description}</p><div className="product-bottom"><div className="price-block"><strong>{money(product.price)}</strong>{product.oldPrice && <del>{money(product.oldPrice)}</del>}</div><button className="primary add" onClick={() => addToCart(product)} aria-label={`Dodaj ${product.name} v košarico`}>＋</button></div></article>)}</div>{shownProducts.length === 0 && <div className="no-results"><span>🔎</span><h3>Ničesar nismo našli</h3><p>Poskusi drugo iskalno besedo ali spremeni filter.</p><button className="secondary" onClick={() => { setSearch(""); setFilter("Vsi izdelki"); setOnlyFavorites(false); }}>Počisti filtre</button></div>}</section>
  <aside className={`cart-panel ${mobileCartOpen ? "mobile-open" : ""}`}><div className="cart-title"><div><p className="eyebrow">TVOJ IZBOR</p><h2>Košarica <span className="cart-count">{count}</span></h2></div><button className="text-button" onClick={() => setCart([])} disabled={!cart.length}>Izprazni</button><button className="cart-close" onClick={() => setMobileCartOpen(false)} aria-label="Zapri košarico">×</button></div>{cart.length === 0 ? <div className="empty-cart"><span>🛍️</span><h3>Košarica čaka nate</h3><p>Dodaj nekaj, kar ti je všeč.</p><button className="secondary" onClick={() => { setMobileCartOpen(false); document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth" }); }}>Razišči izdelke</button></div> : <div className="cart-items">{cart.map(item => <div className="cart-item" key={item.id}><div className="cart-emoji">{item.emoji}</div><div className="cart-info"><strong>{item.name}</strong><span>{money(item.price)} / kos</span><div className="qty"><button onClick={() => changeQty(item.id, -1)} aria-label="Zmanjšaj količino">−</button><span>{item.qty}</span><button onClick={() => changeQty(item.id, 1)} aria-label="Povečaj količino">＋</button></div></div><div className="cart-line-right"><strong>{money(item.price * item.qty)}</strong><button className="remove-item" onClick={() => setCart(c => c.filter(x => x.id !== item.id))} aria-label={`Odstrani ${item.name}`}>Odstrani</button></div></div>)}</div>}<div className="cart-summary"><div className="shipping-progress"><span>{subtotal >= 60 ? "🎉 Dosegel/-la si brezplačno dostavo!" : `Do brezplačne dostave ti manjka še ${money(60 - subtotal)}.`}</span><div className="progress-track"><i style={{ width: `${Math.min(100, subtotal / 60 * 100)}%` }}/></div></div><div><span>Vmesni seštevek</span><strong>{money(subtotal)}</strong></div><div><span>Dostava</span><strong>{shipping === 0 ? "Brezplačno" : money(shipping)}</strong></div><hr/><div className="total"><span>Skupaj</span><strong>{money(total)}</strong></div><p className="tax-note">Prikazane cene so informativne. Končni davčni in dostavni obračun mora potrditi ponudnik trgovine.</p><button className="primary full checkout-button" disabled={!cart.length} onClick={() => { setCheckoutOpen(true); setCheckoutNotice(""); setMobileCartOpen(false); }}>Nadaljuj na blagajno <span>→</span></button><div className="payment-note"><span>🔐</span> Podatki se obdelajo varno. Plačila še niso povezana.</div></div></aside></div></main><footer className="footer"><a className="brand brand-link" href="#top"><span className="brand-mark small">🛍️</span><span><strong>BuyEverything</strong><small>Vse na enem mestu.</small></span></a><span>© {new Date().getFullYear()} BuyEverything · Demo trgovina v pripravi</span><span className="footer-links">Pogoji uporabe · Zasebnost · Dostava in vračila</span></footer>
  <button className="mobile-cart-button" onClick={() => setMobileCartOpen(true)}>🛒 Košarica <span>{count}</span><b>{money(total)}</b></button>
  {checkoutOpen && <div className="modal-backdrop" onClick={e => { if (e.target === e.currentTarget) setCheckoutOpen(false); }}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title"><button className="modal-close" onClick={() => setCheckoutOpen(false)} aria-label="Zapri">×</button><p className="eyebrow">ŠE MALO IN SI TAM</p><h2 id="checkout-title">Podatki za dostavo</h2><p className="muted">Preveri košarico in vnesi podatke za dostavo.</p><form onSubmit={submitCheckout} className="checkout-form"><label>Ime in priimek<input required autoComplete="name" value={customer.name} onChange={e => setCustomer(c => ({ ...c, name: e.target.value }))} /></label><label>E-poštni naslov<input required type="email" autoComplete="email" value={session.user.email || ""} readOnly /></label><label>Telefon<input required type="tel" autoComplete="tel" value={customer.phone} onChange={e => setCustomer(c => ({ ...c, phone: e.target.value }))} placeholder="041 123 456" /></label><label>Naslov<input required autoComplete="street-address" value={customer.address} onChange={e => setCustomer(c => ({ ...c, address: e.target.value }))} placeholder="Ulica in hišna številka" /></label><div className="form-row"><label>Poštna številka<input required autoComplete="postal-code" value={customer.postal} onChange={e => setCustomer(c => ({ ...c, postal: e.target.value }))} /></label><label>Kraj<input required autoComplete="address-level2" value={customer.city} onChange={e => setCustomer(c => ({ ...c, city: e.target.value }))} /></label></div><label>Opomba (neobvezno)<textarea rows="2" value={customer.note} onChange={e => setCustomer(c => ({ ...c, note: e.target.value }))} placeholder="Dodatna navodila za dostavo" /></label><div className="checkout-total"><span>Skupaj za plačilo</span><strong>{money(total)}</strong></div><div className="notice warning">To je pripravljena blagajna, ne dejanska oddaja naročila. Pred prodajo je treba povezati varno strežniško obdelavo naročil, davke, dostavo in plačilni ponudnik.</div><button className="primary full" type="submit">Preveri podatke za naročilo</button>{checkoutNotice && <div className="notice info" role="status">{checkoutNotice}</div>}</form></section></div>}</div>;
}