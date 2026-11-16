import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Heart, Instagram, Menu, Plus, Search, ShoppingBag, MessageCircle, Moon, Sun, X } from "lucide-react";

export const Route = createFileRoute("/")({ component: Storefront });

const WA = "https://wa.me/244939292721";
const categories = [
  { name: "Moda feminina", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=95", count: "Estilo para todos os dias" },
  { name: "Beleza & cosméticos", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=95", count: "Realça a tua beleza" },
  { name: "Bolsas & acessórios", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=95", count: "Os detalhes que encantam" },
  { name: "Cuidados pessoais", image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1600&q=95", count: "O teu momento de cuidado" },
];
const products = [
  { id: 1, name: "Conjunto de beleza essencial", category: "Beleza & cosméticos", price: 18500, image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1600&q=95", tag: "Em destaque" },
  { id: 2, name: "Bolsa elegante everyday", category: "Bolsas & acessórios", price: 24000, image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=95", tag: "Favorito" },
  { id: 3, name: "Kit de autocuidado", category: "Cuidados pessoais", price: 12500, image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1600&q=95", tag: "Novidade" },
  { id: 4, name: "Look casual feminino", category: "Moda feminina", price: 32000, image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=95", tag: "Em destaque" },
];
type Product = (typeof products)[number];
const money = (n: number) => new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(n);

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
  const [notice, setNotice] = useState("");
  const [favorites, setFavorites] = useState<number[]>([]);
  const filtered = useMemo(() => products.filter(p => (category === "Todos" || p.category === category) && p.name.toLowerCase().includes(query.toLowerCase())), [category, query]);
  const cartProducts = products.filter(p => (cart[p.id] ?? 0) > 0);
  const cartCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  const cartTotal = cartProducts.reduce((sum, p) => sum + p.price * (cart[p.id] ?? 0), 0);
  const orderMessage = (items: typeof products) => encodeURIComponent("Olá, Universo das Barbies! Gostaria de fazer uma encomenda:\n\n" + items.map(p => "• " + p.name + " × " + cart[p.id] + " — " + money(p.price * (cart[p.id] ?? 0))).join("\n") + "\n\nPodem informar-me sobre disponibilidade e entrega?");

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
    {searchOpen && <div className="search-bar"><Search size={18}/><input autoFocus placeholder="O que procuras hoje?" value={query} onChange={e => {setQuery(e.target.value);document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"});}}/><button onClick={() => {setQuery("");setSearchOpen(false)}}><X size={18}/></button></div>}
    <section className="hero" id="inicio">
      <div className="hero-copy"><span className="eyebrow"><span className="eyebrow-line"/> O TEU ESTILO, A TUA ESSÊNCIA</span><h1>Bem-vinda ao<br/><em>teu universo</em><br/>de possibilidades.</h1><p>Tudo o que precisas para realçar a tua beleza, expressar o teu estilo e tornar cada momento especial.</p><div className="hero-actions"><a className="btn-primary" href="#produtos">Explorar produtos <ArrowRight size={17}/></a><a className="btn-link" href={WA} target="_blank" rel="noreferrer">Falar connosco <ArrowUpRight size={16}/></a></div><div className="hero-note"><span className="note-stars">★★★★★</span><span>Um toque especial em cada escolha.</span></div></div>
      <div className="hero-visual"><div className="hero-photo founder-placeholder" role="img" aria-label="Espaço reservado para a fotografia original de Adrileia Caizer"><span>AC</span><small>ADRILEIA CAIZER</small></div><div className="hero-stamp"><span>FEITO PARA</span><strong>BRILHARES</strong><span>À TUA MANEIRA ✦</span></div><div className="hero-caption">BE YOUR OWN KIND OF BEAUTIFUL</div></div>
      <div className="hero-bottom">01 — 04 <span/> UNIVERSO DAS BARBIES</div>
    </section>
    <section className="benefits"><div><span className="benefit-icon">✦</span><p><b>Escolhas com estilo</b><small>Produtos selecionados para ti</small></p></div><div><span className="benefit-icon">♡</span><p><b>Atendimento próximo</b><small>Estamos aqui para ajudar</small></p></div><div><span className="benefit-icon">↗</span><p><b>Encomenda simples</b><small>Fala connosco pelo WhatsApp</small></p></div><div><span className="benefit-icon">✧</span><p><b>O teu momento</b><small>Beleza, confiança e personalidade</small></p></div></section>
    <section className="section categories-section" id="categorias"><div className="section-heading"><div><span className="eyebrow">DESCOBRE O TEU FAVORITO</span><h2>Entra no nosso <em>universo.</em></h2></div><a className="text-arrow" href="#produtos">Ver todos os produtos <ArrowUpRight size={16}/></a></div><div className="category-grid">{categories.map((c,i)=><button className="category-card" key={c.name} onClick={()=>{setCategory(c.name);document.getElementById("produtos")?.scrollIntoView({behavior:"smooth"})}}><img src={c.image} alt={c.name}/><span className="category-number">0{i+1}</span><span className="category-info"><b>{c.name}</b><small>{c.count}</small></span><span className="category-arrow"><ArrowUpRight size={18}/></span></button>)}</div></section>
    <section className="section products-section" id="produtos"><div className="section-heading"><div><span className="eyebrow">A TUA PRÓXIMA DESCOBERTA</span><h2>Peças que falam <em>por ti.</em></h2><p className="section-sub">Inspira-te e encontra algo que combina contigo.</p></div><div className="product-tools"><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filtrar por categoria"><option>Todos</option>{categories.map(c=><option key={c.name}>{c.name}</option>)}</select><button className="filter-search" onClick={()=>setSearchOpen(!searchOpen)}><Search size={16}/> Pesquisar</button></div></div>
      <div className="product-grid">{filtered.map(p=><article className="product-card" key={p.id}><div className="product-image" role="button" tabIndex={0} aria-label={"Ver detalhes de "+p.name} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(p)}}} onClick={()=>setSelected(p)}><img src={p.image} alt={p.name}/><span className="product-tag">{p.tag}</span><button className={favorites.includes(p.id)?"favorite active":"favorite"} onClick={e=>{e.stopPropagation();setFavorites(f=>f.includes(p.id)?f.filter(x=>x!==p.id):[...f,p.id])}} aria-label="Adicionar aos favoritos"><Heart size={17} fill={favorites.includes(p.id)?"currentColor":"none"}/></button><button className="quick-view" onClick={()=>setSelected(p)}>Ver detalhes <ArrowUpRight size={15}/></button></div><div className="product-info"><span>{p.category}</span><h3>{p.name}</h3><div className="product-bottom"><b>{money(p.price)}</b><button onClick={()=>{setCart(c=>({...c,[p.id]:(c[p.id]??0)+1}));setNotice("Adicionado à tua lista de encomenda.");setTimeout(()=>setNotice(""),2600)}}><Plus size={16}/></button></div></div></article>)}</div>
      {filtered.length===0 && <div className="empty-state">Não encontrámos produtos com essa pesquisa. Experimenta outra palavra.</div>}
      <div className="catalog-note">Os artigos apresentados são exemplos visuais. Confirma disponibilidade e preço pelo WhatsApp.</div>
      {cartCount>0 && <div className="order-bar"><div><b>{cartCount} {cartCount===1?"artigo selecionado":"artigos selecionados"}</b><small>{money(cartTotal)} · Lista de encomenda</small><div className="order-quantities">{cartProducts.map(p=><span key={p.id}>{p.name}: {cart[p.id]} <button aria-label={"Remover uma unidade de "+p.name} onClick={()=>setCart(c=>({...c,[p.id]:Math.max(0,(c[p.id]??0)-1)}))}>−</button></span>)}</div></div><a href={WA+"?text="+orderMessage(cartProducts)} target="_blank" rel="noreferrer">Enviar encomenda <ArrowUpRight size={17}/></a><button aria-label="Limpar lista" onClick={()=>setCart({})}><X size={17}/></button></div>}
    </section>
    <section className="editorial" id="sobre"><div className="editorial-image founder-photo"><img src="/fundadora.webp" alt="Adrileia Caizer, empresária e fundadora do Universo das Barbies" loading="lazy"/><span>ADRILEIA CAIZER · FUNDADORA</span></div><div className="editorial-copy"><span className="eyebrow">A EMPRESÁRIA POR TRÁS DA MARCA</span><h2>Uma visão que começou <em>cedo.</em></h2><h3 className="founder-name">Adrileia Caizer</h3><p>Jovem, inteligente e determinada, Adrileia Caizer começou a investir desde cedo, acreditando no valor de construir o seu próprio caminho e transformar ideias em oportunidades.</p><p>É com essa visão empreendedora que nasce e cresce o Universo das Barbies: uma marca que procura unir beleza, estilo e confiança, criando uma experiência especial para cada cliente.</p><p className="founder-quote">“Acreditar numa ideia é o primeiro passo para lhe dar vida.”</p><a className="btn-primary" href={WA} target="_blank" rel="noreferrer">Fala com a nossa equipa <ArrowRight size={17}/></a><div className="signature">Com visão e dedicação, <b>Adrileia Caizer ♡</b></div></div></section>
    <section className="quote-section"><span>✦</span><p aria-hidden="true"> </p><h2>A beleza começa quando te sentes <em>bem contigo.</em></h2><small>UNIVERSO DAS BARBIES · BELEZA, ESTILO, ATITUDE</small></section>
    <section className="contact-section" id="contactos"><div><span className="eyebrow">VAMOS CONVERSAR?</span><h2>Estamos à distância<br/>de uma <em>mensagem.</em></h2><p>Encontraste algo de que gostas ou precisas de ajuda? Fala connosco. Teremos todo o gosto em atender-te.</p><a className="btn-light" href={WA} target="_blank" rel="noreferrer">Conversar no WhatsApp <ArrowUpRight size={17}/></a></div><div className="contact-details"><a href="tel:+244939292721">+244 939 292 721</a><a href="mailto:universodasberbies27@gmail.com">universodasberbies27@gmail.com</a><div className="socials"><a href="https://www.instagram.com/universo_dasbarbies" target="_blank" rel="noreferrer"><Instagram size={18}/> Instagram</a><a href="https://www.tiktok.com/@universo.das.barb" target="_blank" rel="noreferrer">♪ TikTok</a><a href="https://www.facebook.com/share/1FX7oY4Eco/" target="_blank" rel="noreferrer">f Facebook</a></div></div></section>
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-about"><a href="#inicio" className="footer-wordmark">Universo <em>das Barbies</em></a><p>Beleza, estilo e confiança num só universo. Descobre produtos pensados para realçar a tua essência.</p><div className="footer-socials"><a href="https://www.instagram.com/universo_dasbarbies" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={17}/></a><a href="https://www.facebook.com/share/1FX7oY4Eco/" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="https://www.tiktok.com/@universo.das.barb" target="_blank" rel="noreferrer" aria-label="TikTok">♪</a></div></div>
        <div className="footer-column"><h3>Explorar</h3><a href="#inicio">Início</a><a href="#categorias">Categorias</a><a href="#produtos">Produtos</a><a href="#sobre">Sobre a fundadora</a></div>
        <div className="footer-column"><h3>A marca</h3><a href="#sobre">A nossa história</a><a href="#contactos">Contactos</a><a href="#produtos">Encomendas</a></div>
        <div className="footer-column footer-contact"><h3>Fala connosco</h3><a href="https://wa.me/244939292721" target="_blank" rel="noreferrer">WhatsApp · +244 939 292 721</a><a href="mailto:universodasberbies27@gmail.com">universodasberbies27@gmail.com</a><a href="#contactos">Atendimento e apoio</a></div>
      </div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} Universo das Barbies. Todos os direitos reservados.</span><a href="#inicio">Voltar ao topo <span>↑</span></a></div>
    </footer>
    {selected && <div className="modal-backdrop" onClick={()=>setSelected(null)}><div className="product-modal" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSelected(null)}><X/></button><img src={selected.image} alt={selected.name}/><div><span className="eyebrow">{selected.category}</span><h2>{selected.name}</h2><b>{money(selected.price)}</b><p>Este artigo é um exemplo de apresentação. Contacta-nos para confirmar disponibilidade, opções e detalhes da encomenda.</p><button className="btn-primary" onClick={()=>window.open(WA+"?text="+encodeURIComponent("Olá! Tenho interesse em "+selected.name+". Podem confirmar a disponibilidade e os detalhes?"),"_blank")}>Perguntar pelo WhatsApp <ArrowUpRight size={16}/></button></div></div></div>}
    {notice && <div className="toast"><Check size={17}/>{notice}</div>}
    <a className="whatsapp-float" href={WA} target="_blank" rel="noreferrer" aria-label="Falar pelo WhatsApp"><MessageCircle size={25}/></a>
  </main>;
}
