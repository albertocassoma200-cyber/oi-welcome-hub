import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Check, Heart, Instagram, Menu, Minus, Plus, Search, ShoppingBag, MessageCircle, Moon, Sun, X } from "lucide-react";
import portrait from "@/assets/storefront-portrait.jpg.asset.json";
import thermalCup from "@/assets/catalog/thermal-cup-catalog.jpg.asset.json";
import makeupSet from "@/assets/catalog/makeup-set-catalog.jpg.asset.json";
import skincareDevice from "@/assets/catalog/skincare-device-catalog.jpg.asset.json";
import makeupBag from "@/assets/catalog/makeup-bag-catalog.jpg.asset.json";
import { catalogDetails, formatCatalogPrice } from "@/lib/store-catalog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Universo das Barbies | Beleza, estilo e acessórios" },
      { name: "description", content: "Descobre os produtos de beleza, cuidados pessoais e acessórios do Universo das Barbies, em Angola. Encomendas pelo WhatsApp." },
      { property: "og:title", content: "Universo das Barbies | Beleza, estilo e acessórios" },
      { property: "og:description", content: "Produtos de beleza, cuidados pessoais e acessórios escolhidos para ti. Encomenda pelo WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap" },
    ],
  }),
  component: Storefront,
});

const WA = "https://wa.me/244939292721";
const categories = [
  { name: "Beleza & cosméticos", image: makeupSet.url, count: "Realça a tua beleza" },
  { name: "Bolsas & acessórios", image: makeupBag.url, count: "Os detalhes que encantam" },
  { name: "Cuidados pessoais", image: skincareDevice.url, count: "O teu momento de cuidado" },
  { name: "Presentes & lifestyle", image: thermalCup.url, count: "Pequenos favoritos do dia a dia" },
];
const products = catalogDetails;
const provinceCapitals: Record<string, string> = {
  "Bengo": "Dande", "Benguela": "Benguela", "Bié": "Cuito", "Cabinda": "Cabinda",
  "Cuando": "Mavinga", "Cuanza Norte": "Cazengo", "Cuanza Sul": "Sumbe", "Cubango": "Menongue",
  "Cunene": "Cuanhama", "Huambo": "Huambo", "Huíla": "Lubango", "Icolo e Bengo": "Catete",
  "Luanda": "Ingombota", "Lunda Norte": "Dundo", "Lunda Sul": "Saurimo", "Malanje": "Malanje",
  "Moxico": "Luena", "Moxico Leste": "Cazombo", "Namibe": "Moçâmedes", "Uíge": "Uíge", "Zaire": "Mbanza Kongo",
};
const provinces = Object.keys(provinceCapitals).sort((a, b) => a.localeCompare(b, "pt"));
type Product = (typeof products)[number];
const money = formatCatalogPrice;

function Storefront() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    const savedTheme = window.localStorage.getItem("universo-barbies-theme");
    if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
  }, []);
  useEffect(() => {
    window.localStorage.setItem("universo-barbies-theme", theme);
  }, [theme]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [cart, setCart] = useState<Record<number, number>>({});
  const [selected, setSelected] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [buyer, setBuyer] = useState({ name: "", phone: "", province: "", municipality: "", neighborhood: "", note: "" });
  const [notice, setNotice] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  useEffect(() => {
    const triggerHaptic = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("button, a, [role='button']")) return;
      if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(10);
    };
    document.addEventListener("pointerdown", triggerHaptic, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", triggerHaptic, true);
  }, []);
  const filtered = useMemo(() => products.filter(p => (category === "Todos" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const cartProducts = products.filter(p => (cart[p.id] ?? 0) > 0);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartProducts.reduce((sum, p) => sum + p.price * (cart[p.id] ?? 0), 0);
  const orderMessage = (items: typeof products) => encodeURIComponent("Olá, Universo das Barbies! Gostaria de fazer uma encomenda.\n\nDADOS DO COMPRADOR\nNome: " + buyer.name.trim() + "\nTelefone: " + buyer.phone.trim() + "\nProvíncia: " + buyer.province.trim() + "\nMunicípio: " + buyer.municipality.trim() + "\nBairro: " + buyer.neighborhood.trim() + "\nObservações: " + (buyer.note.trim() || "Nenhuma") + "\n\nPRODUTOS\n" + items.map(p => "• " + p.name + " × " + cart[p.id] + " — " + money(p.price * (cart[p.id] ?? 0))).join("\n") + "\n\nTotal estimado: " + money(cartTotal) + "\n\nAguardo confirmação da disponibilidade e entrega.");
  const submitCheckout = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!cartCount) return;
    window.open(WA + "?text=" + orderMessage(cartProducts), "_blank", "noopener,noreferrer");
    setCheckoutOpen(false);
  };

  return <main className={theme === "dark" ? "theme-dark" : "theme-light"}>
    <header className="site-header">
      <button className="mobile-menu icon-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menu">{menuOpen ? <X/> : <Menu/>}</button>
      <a href="#inicio" className="brand" aria-label="Universo das Barbies - início"><img className="brand-logo" src="/logo-universo.webp" alt="Universo das Barbies" /></a>
      <nav className={menuOpen ? "main-nav open" : "main-nav"}>
        <a href="#inicio" onClick={() => setMenuOpen(false)}>Início</a><a href="#categorias" onClick={() => setMenuOpen(false)}>Categorias</a><a href="#produtos" onClick={() => setMenuOpen(false)}>Produtos</a><a href="#sobre" onClick={() => setMenuOpen(false)}>Sobre nós</a><a href="#contactos" onClick={() => setMenuOpen(false)}>Contactos</a>
      </nav>
      <div className="header-actions">
        <button className="icon-btn" aria-label="Pesquisar" onClick={() => setSearchOpen(!searchOpen)}><Search/></button>
        <a className="icon-btn cart-button" href="#produtos" aria-label="Ver produtos"><ShoppingBag/>{cartCount > 0 && <i>{cartCount}</i>}</a>
        <div className="theme-switch" aria-label="Escolher tema"><button type="button" className={theme === "light" ? "theme-choice active" : "theme-choice"} onClick={() => setTheme("light")} aria-label="Tema claro" title="Tema claro"><Sun size={16}/></button><button type="button" className={theme === "dark" ? "theme-choice active" : "theme-choice"} onClick={() => setTheme("dark")} aria-label="Tema escuro" title="Tema escuro"><Moon size={16}/></button></div><a className="header-cta" href={WA} target="_blank" rel="noreferrer">Falar connosco <ArrowUpRight size={15}/></a>
      </div>
    </header>
    {searchOpen && <div className="search-bar"><Search size={18}/><input autoFocus placeholder="O que procuras hoje?" value={query} onChange={e => {setQuery(e.target.value);document.getElementById("produtos")?.scrollIntoView({behavior:"auto"});}}/><button onClick={() => {setQuery("");setSearchOpen(false)}}><X size={18}/></button></div>}
    <section className="hero" id="inicio">
      <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> O TEU ESTILO, A TUA ESSÊNCIA</span><h1>Universo das<br/><em>Barbies.</em></h1><p>Beleza, cuidados pessoais e acessórios escolhidos para realçar a tua essência. Encontra os teus favoritos e encomenda facilmente pelo WhatsApp.</p><div className="hero-actions"><a className="btn-primary" href="#produtos">Explorar produtos <ArrowRight size={17}/></a><a className="btn-link" href={WA} target="_blank" rel="noreferrer">Falar connosco <ArrowUpRight size={16}/></a></div><div className="hero-note"><span className="note-stars">★★★★★</span><span>Um toque especial em cada escolha.</span></div></div>
      <div className="hero-visual"><div className="hero-photo"><img src={portrait.url} alt="Adrileia Caizer, fundadora do Universo das Barbies" fetchPriority="high"/></div><div className="hero-stamp"><span>FEITO PARA</span><strong>BRILHARES</strong><span>À TUA MANEIRA ✦</span></div><div className="hero-caption">ADRILEIA CAIZER · FUNDADORA</div></div>
      <div className="hero-bottom">01 — 04 <span/> UNIVERSO DAS BARBIES</div>
    </section>
    <section className="benefits"><div><span className="benefit-icon">✦</span><p><b>Escolhas com estilo</b><small>Produtos selecionados para ti</small></p></div><div><span className="benefit-icon">♡</span><p><b>Atendimento próximo</b><small>Estamos aqui para ajudar</small></p></div><div><span className="benefit-icon">↗</span><p><b>Encomenda simples</b><small>Fala connosco pelo WhatsApp</small></p></div><div><span className="benefit-icon">✧</span><p><b>O teu momento</b><small>Beleza, confiança e personalidade</small></p></div></section>
    <section className="section categories-section" id="categorias"><div className="section-heading"><div><span className="eyebrow">DESCOBRE O TEU FAVORITO</span><h2>Entra no nosso <em>universo.</em></h2></div><a className="text-arrow" href="#produtos">Ver todos os produtos <ArrowUpRight size={16}/></a></div><div className="category-grid">{categories.map((c,i)=><button className="category-card" key={c.name} onClick={()=>{setCategory(c.name);document.getElementById("produtos")?.scrollIntoView({behavior:"auto"})}}><img src={c.image} alt={c.name}/><span className="category-number">0{i+1}</span><span className="category-info"><b>{c.name}</b><small>{c.count}</small></span><span className="category-arrow"><ArrowUpRight size={18}/></span></button>)}</div></section>
    <section className="section products-section" id="produtos"><div className="section-heading"><div><span className="eyebrow">A TUA PRÓXIMA DESCOBERTA</span><h2>Peças que falam <em>por ti.</em></h2><p className="section-sub">Inspira-te e encontra algo que combina contigo.</p></div><div className="product-tools"><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filtrar por categoria"><option>Todos</option>{categories.map(c=><option key={c.name}>{c.name}</option>)}</select><button className="filter-search" onClick={()=>setSearchOpen(!searchOpen)}><Search size={16}/> Pesquisar</button></div></div>
      <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image" role="button" tabIndex={0} aria-label={"Ver detalhes de "+p.name} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(p)}}} onClick={()=>setSelected(p)}><img src={p.image} alt={p.name}/><span className="product-tag">{p.tag}</span><button className={favorites.includes(p.id)?"favorite active":"favorite"} onClick={e=>{e.stopPropagation();setFavorites(f=>f.includes(p.id)?f.filter(x=>x!==p.id):[...f,p.id])}} aria-label="Adicionar aos favoritos"><Heart size={17} fill={favorites.includes(p.id)?"currentColor":"none"}/></button><button className="quick-view" onClick={()=>setSelected(p)}>Ver detalhes <ArrowUpRight size={15}/></button></div><div className="product-info"><span>{p.category}</span><h3>{p.name}</h3><div className="product-bottom"><b>{money(p.price)}</b><div className="product-quantity" aria-label={"Quantidade de "+p.name}>{(cart[p.id]??0)>0&&<><button type="button" className="quantity-action quantity-minus" aria-label={"Retirar uma unidade de "+p.name} onClick={()=>setCart(c=>({...c,[p.id]:Math.max(0,(c[p.id]??0)-1)}))}><Minus size={15}/></button><span>{cart[p.id]}</span></>}<button type="button" className="quantity-action" aria-label={"Adicionar uma unidade de "+p.name} onClick={()=>{setCart(c=>({...c,[p.id]:(c[p.id]??0)+1}));setNotice(p.name+" adicionado à encomenda.");}}><Plus size={16}/></button></div></div></div></article>)}</div>
      {filtered.length===0 && <div className="empty-state">Não encontrámos produtos com essa pesquisa. Experimenta outra palavra.</div>}
      <div className="catalog-note">Catálogo ilustrativo: imagens, artigos e preços apresentados não confirmam stock nem disponibilidade. Confirma sempre o preço e o artigo pelo WhatsApp antes de encomendar.</div>
      {cartCount>0 && <div className="order-bar"><div><b>{cartCount} {cartCount===1?"artigo selecionado":"artigos selecionados"}</b><small>{money(cartTotal)} · Lista de encomenda</small><div className="order-quantities">{cartProducts.map(p=><span key={p.id}>{p.name}: {cart[p.id]} <button aria-label={"Remover uma unidade de "+p.name} onClick={()=>setCart(c=>({...c,[p.id]:Math.max(0,(c[p.id]??0)-1)}))}>−</button></span>)}</div></div><button type="button" onClick={()=>setCheckoutOpen(true)}>Pedir confirmação <ArrowUpRight size={17}/></button><button aria-label="Limpar lista" onClick={()=>setCart({})}><X size={17}/></button></div>}
    </section>
    <section className="editorial" id="sobre"><div className="editorial-copy"><span className="eyebrow">A EMPRESÁRIA POR TRÁS DA MARCA</span><h2>Uma visão que começou <em>cedo.</em></h2><h3 className="founder-name">Adrileia Caizer</h3><p>Jovem, inteligente e determinada, Adrileia Caizer começou a investir desde cedo, acreditando no valor de construir o seu próprio caminho e transformar ideias em oportunidades.</p><p>É com essa visão empreendedora que nasce e cresce o Universo das Barbies: uma marca que procura unir beleza, estilo e confiança, criando uma experiência especial para cada cliente.</p><p className="founder-quote">“Acreditar numa ideia é o primeiro passo para lhe dar vida.”</p><a className="btn-primary" href={WA} target="_blank" rel="noreferrer">Fala com a nossa equipa <ArrowRight size={17}/></a><div className="signature">Com visão e dedicação, <b>Adrileia Caizer ♡</b></div></div><div className="editorial-image founder-photo"><img src={portrait.url} alt="Adrileia Caizer, fundadora do Universo das Barbies" loading="lazy"/><span>ADRILEIA CAIZER · FUNDADORA</span></div></section>
    <section className="quote-section"><span>✦</span><p aria-hidden="true"> </p><h2>A beleza começa quando te sentes <em>bem contigo.</em></h2><small>UNIVERSO DAS BARBIES · BELEZA, ESTILO, ATITUDE</small></section>
    <section className="contact-section" id="contactos"><div><span className="eyebrow">VAMOS CONVERSAR?</span><h2>Estamos à distância<br/>de uma <em>mensagem.</em></h2><p>Encontraste algo de que gostas ou precisas de ajuda? Fala connosco. Teremos todo o gosto em atender-te.</p><a className="btn-light" href={WA} target="_blank" rel="noreferrer">Conversar no WhatsApp <ArrowUpRight size={17}/></a></div><div className="contact-details"><a href="tel:+244939292721">+244 939 292 721</a><a href="mailto:universodasberbies27@gmail.com">universodasberbies27@gmail.com</a><div className="socials"><a href="https://www.instagram.com/universo_dasbarbies" target="_blank" rel="noreferrer"><Instagram size={18}/> Instagram</a><a href="https://www.tiktok.com/@universo.das.barb" target="_blank" rel="noreferrer">♪ TikTok</a><a href="https://www.facebook.com/share/1FX7oY4Eco/" target="_blank" rel="noreferrer">f Facebook</a></div></div></section>
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about"><a href="#inicio" className="footer-wordmark">Universo <em>das Barbies</em></a><p>Beleza, estilo e confiança num só universo. Descobre produtos pensados para realçar a tua essência.</p><div className="footer-socials"><a href="https://www.instagram.com/universo_dasbarbies" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a><a href="https://www.facebook.com/share/1FX7oY4Eco/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.tiktok.com/@universo.das.barb" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a></div></div>
        <div className="footer-column"><h3>Explorar</h3><a href="#inicio">Início</a><a href="#categorias">Categorias</a><a href="#produtos">Produtos</a><a href="#sobre">Sobre a fundadora</a></div>
        <div className="footer-column"><h3>A marca</h3><a href="#sobre">A nossa história</a><a href="#contactos">Contactos</a><a href="#produtos">Encomendas</a></div>
        <div className="footer-column footer-contact"><h3>Fala connosco</h3><a href="https://wa.me/244939292721" target="_blank" rel="noreferrer">WhatsApp · +244 939 292 721</a><a href="mailto:universodasberbies27@gmail.com">universodasberbies27@gmail.com</a><a href="#contactos">Atendimento e apoio</a><a href="/admin">Administração da loja</a></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Universo das Barbies. Todos os direitos reservados.</span><a href="#inicio">Voltar ao topo <span>↑</span></a></div>
    </footer>
    {checkoutOpen && <div className="modal-backdrop checkout-backdrop" onClick={()=>setCheckoutOpen(false)}><section className="checkout-modal" role="dialog" aria-modal="true" aria-labelledby="checkout-title" onClick={e=>e.stopPropagation()}><button className="modal-close" type="button" onClick={()=>setCheckoutOpen(false)} aria-label="Fechar formulário"><X/></button><div className="checkout-heading"><span className="eyebrow">SÓ MAIS UM PASSO</span><h2 id="checkout-title">Dados do <em>comprador.</em></h2><p>Preenche os teus dados para enviares um pedido de confirmação à equipa pelo WhatsApp.</p></div><form className="checkout-form" onSubmit={submitCheckout}><label>Nome completo<input required minLength={2} maxLength={120} autoComplete="name" placeholder="O teu nome" value={buyer.name} onChange={e=>setBuyer({...buyer,name:e.target.value})}/></label><label>Número de telefone<input required type="tel" minLength={6} maxLength={30} autoComplete="tel" placeholder="+244 9XX XXX XXX" value={buyer.phone} onChange={e=>setBuyer({...buyer,phone:e.target.value})}/></label><div className="checkout-fields"><label>Província<select required autoComplete="address-level1" value={buyer.province} onChange={e=>setBuyer({...buyer,province:e.target.value,municipality:provinceCapitals[e.target.value]??""})}><option value="">Seleciona a província</option>{provinces.map(province=><option key={province} value={province}>{province}</option>)}</select></label><label>Município<input required autoComplete="address-level2" list="angola-municipalities" placeholder="Escreve ou confirma o município" value={buyer.municipality} onChange={e=>setBuyer({...buyer,municipality:e.target.value})}/><datalist id="angola-municipalities">{buyer.province&&<option value={provinceCapitals[buyer.province]}/>}</datalist></label></div><label>Bairro / Rua<input required autoComplete="street-address" placeholder="Escreve o bairro e a rua" value={buyer.neighborhood} onChange={e=>setBuyer({...buyer,neighborhood:e.target.value})}/><small className="field-hint">O bairro é indicado pelo comprador para garantir a morada correta.</small></label><label>Observações (opcional)<textarea rows={3} maxLength={500} placeholder="Referência da morada ou outras informações..." value={buyer.note} onChange={e=>setBuyer({...buyer,note:e.target.value})}/></label><div className="checkout-summary"><b>Produtos escolhidos e quantidades</b>{cartProducts.map(p=><div key={p.id}><span>{p.name} × {cart[p.id]}</span><strong>{money(p.price*(cart[p.id]??0))}</strong></div>)}<div className="checkout-total"><span>Total estimado</span><strong>{money(cartTotal)}</strong></div><small>O envio da encomenda não significa confirmação de stock ou entrega. A equipa confirmará os detalhes no WhatsApp.</small></div><button className="checkout-submit" type="submit">Enviar pedido de confirmação pelo WhatsApp <ArrowUpRight size={17}/></button></form></section></div>}
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="product-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}><X/></button><img src={selected.image} alt={selected.name}/><div><span className="eyebrow">{selected.category}</span><h2>{selected.name}</h2><b>{money(selected.price)}</b><p>Este artigo é um exemplo de apresentação. Contacta-nos para confirmar disponibilidade, opções e detalhes da encomenda.</p><button className="btn-primary" onClick={()=>window.open(WA+"?text="+encodeURIComponent("Olá! Tenho interesse em "+selected.name+". Podem confirmar a disponibilidade e os detalhes?"),"_blank")}>Perguntar pelo WhatsApp <ArrowUpRight size={16}/></button></div></div></div>}
    {notice && <div className="toast"><Check size={17}/>{notice}</div>}
    <a className="whatsapp-float" href={WA} target="_blank" rel="noreferrer" aria-label="Falar pelo WhatsApp"><MessageCircle size={25}/></a>
  </main>;
}
