import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  Boxes,
  ClipboardList,
  LogOut,
  PackagePlus,
  RefreshCw,
  ShieldCheck,
  Tags,
} from "lucide-react";

import {
  getCurrentUser,
  getProfile,
  isSupabaseConfigured,
  loadAdminData,
  saveAdminCategory,
  saveAdminProduct,
  setAdminCategoryActive,
  signInWithPassword,
  signOut,
  updateAdminOrderStatus,
  type AdminCategory,
  type AdminOrder,
  type AdminProduct,
} from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administração | Universo das Barbies" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AdminPage,
});

type AdminData = {
  products: AdminProduct[];
  categories: AdminCategory[];
  orders: AdminOrder[];
};

type ProductForm = {
  name: string;
  slug: string;
  category_id: string;
  description: string;
  image_url: string;
  price_aoa: string;
  stock_quantity: string;
  is_active: boolean;
};

const emptyProduct: ProductForm = {
  name: "",
  slug: "",
  category_id: "",
  description: "",
  image_url: "",
  price_aoa: "",
  stock_quantity: "0",
  is_active: false,
};

const orderStatuses: Array<{ value: AdminOrder["status"]; label: string }> = [
  { value: "pending", label: "Pendente" },
  { value: "confirmed", label: "Confirmada" },
  { value: "preparing", label: "Em preparação" },
  { value: "shipped", label: "Enviada" },
  { value: "completed", label: "Concluída" },
  { value: "cancelled", label: "Cancelada" },
];

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-AO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function AdminPage() {
  const [configured] = useState(isSupabaseConfigured());
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  const refreshData = async () => {
    setBusy(true);
    setError("");
    try {
      setData(await loadAdminData());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    let active = true;

    const initialise = async () => {
      try {
        if (!configured) return;
        const user = await getCurrentUser();
        if (!user) return;

        const profile = await getProfile(user.id);
        if (!active) return;
        if (profile?.role !== "admin") {
          setError("Esta conta não tem permissões de administração.");
          return;
        }

        setUserEmail(user.email ?? "");
        setData(await loadAdminData());
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Não foi possível validar a sessão.");
        }
      } finally {
        if (active) setChecking(false);
      }
    };

    void initialise();
    return () => {
      active = false;
    };
  }, [configured]);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const session = await signInWithPassword(email.trim(), password);
      if (!session) throw new Error("Não foi possível iniciar a sessão.");

      const profile = await getProfile(session.user.id);
      if (profile?.role !== "admin") {
        await signOut();
        throw new Error("Esta conta não tem permissões de administração. Contacta o responsável da loja.");
      }

      setUserEmail(session.user.email ?? email.trim());
      setData(await loadAdminData());
      setPassword("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível iniciar sessão.");
    } finally {
      setBusy(false);
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setError("");
    try {
      await signOut();
      setData(null);
      setUserEmail("");
      setNotice("Sessão terminada.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível terminar a sessão.");
    } finally {
      setBusy(false);
    }
  };

  const handleProductSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const price = Number(productForm.price_aoa);
    const stock = Number(productForm.stock_quantity);

    if (!productForm.name.trim()) {
      setError("Indica o nome do produto.");
      return;
    }
    if (!Number.isSafeInteger(price) || price < 0) {
      setError("O preço deve ser um número inteiro igual ou superior a zero.");
      return;
    }
    if (!Number.isSafeInteger(stock) || stock < 0) {
      setError("O stock deve ser um número inteiro igual ou superior a zero.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveAdminProduct({
        ...(editingId ? { id: editingId } : {}),
        name: productForm.name.trim(),
        slug: productForm.slug.trim() || slugify(productForm.name),
        category_id: productForm.category_id || null,
        description: productForm.description.trim() || null,
        image_url: productForm.image_url.trim() || null,
        price_aoa: price,
        stock_quantity: stock,
        is_active: productForm.is_active,
      });
      setProductForm(emptyProduct);
      setEditingId(null);
      setNotice(editingId ? "Produto actualizado." : "Produto criado.");
      await refreshData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível guardar o produto.");
    } finally {
      setBusy(false);
    }
  };

  const editProduct = (product: AdminProduct) => {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      slug: product.slug,
      category_id: product.category_id ?? "",
      description: product.description ?? "",
      image_url: product.image_url ?? "",
      price_aoa: String(product.price_aoa),
      stock_quantity: String(product.stock_quantity),
      is_active: product.is_active,
    });
    setError("");
    setNotice("");
    document.getElementById("product-editor")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCategorySave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (categoryName.trim().length < 2) {
      setError("O nome da categoria deve ter pelo menos 2 caracteres.");
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");
    try {
      await saveAdminCategory({
        name: categoryName.trim(),
        slug: slugify(categoryName),
        description: categoryDescription.trim() || null,
        is_active: true,
      });
      setCategoryName("");
      setCategoryDescription("");
      setNotice("Categoria criada.");
      await refreshData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível guardar a categoria.");
    } finally {
      setBusy(false);
    }
  };

  const changeOrderStatus = async (order: AdminOrder, status: AdminOrder["status"]) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await updateAdminOrderStatus(order.id, status);
      setNotice("Estado da encomenda actualizado.");
      await refreshData();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível actualizar a encomenda.");
    } finally {
      setBusy(false);
    }
  };

  if (checking) {
    return (
      <main className="min-h-screen bg-[#fff7fb] px-4 py-16 text-center text-slate-700">
        <p>A verificar a sessão de administração…</p>
      </main>
    );
  }

  if (!configured) {
    return (
      <main className="min-h-screen bg-[#fff7fb] px-4 py-12 text-slate-800">
        <div className="mx-auto max-w-xl rounded-3xl border border-pink-100 bg-white p-8 shadow-sm">
          <ShieldCheck className="mb-4 text-pink-600" size={34} />
          <h1 className="text-2xl font-semibold">Painel de administração</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            A ligação ao Supabase ainda não está configurada neste ambiente. Define as variáveis
            públicas VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no alojamento e volta a abrir esta página.
          </p>
          <a className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-pink-700" href="/">
            <ArrowLeft size={16} /> Voltar à loja
          </a>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-[#fff7fb] px-4 py-12 text-slate-800">
        <div className="mx-auto max-w-md rounded-3xl border border-pink-100 bg-white p-8 shadow-sm">
          <a className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-pink-700" href="/">
            <ArrowLeft size={16} /> Voltar à loja
          </a>
          <ShieldCheck className="mb-4 text-pink-600" size={34} />
          <h1 className="text-2xl font-semibold">Acesso à administração</h1>
          <p className="mt-2 text-sm text-slate-600">
            Entra com a conta de administradora criada no Supabase. Não existe registo público nesta página.
          </p>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          <form className="mt-6 space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium">E-mail
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">Palavra-passe
              <input className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-3 outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100" type="password" autoComplete="current-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>
            <button className="w-full rounded-xl bg-pink-600 px-4 py-3 font-semibold text-white transition hover:bg-pink-700 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={busy}>
              {busy ? "A entrar…" : "Entrar no painel"}
            </button>
          </form>
        </div>
      </main>
    );
  }

  const activeProducts = data.products.filter((product) => product.is_active).length;
  const pendingOrders = data.orders.filter((order) => order.status === "pending").length;

  return (
    <main className="min-h-screen bg-[#fff7fb] px-4 py-6 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
          <div>
            <a href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-pink-700"><ArrowLeft size={16} /> Ver loja</a>
            <h1 className="mt-2 text-2xl font-semibold">Universo das Barbies <span className="text-pink-600">· Administração</span></h1>
            <p className="mt-1 text-sm text-slate-500">Sessão iniciada como {userEmail}</p>
          </div>
          <button type="button" onClick={handleLogout} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-pink-300 hover:text-pink-700 disabled:opacity-60">
            <LogOut size={16} /> Terminar sessão
          </button>
        </header>

        {(error || notice) && (
          <div className={error ? "mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700" : "mt-5 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800"} role={error ? "alert" : "status"}>
            {error || notice}
          </div>
        )}

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-pink-100 bg-white p-5"><PackagePlus className="text-pink-600" /><p className="mt-3 text-sm text-slate-500">Produtos publicados</p><strong className="text-3xl">{activeProducts}</strong></div>
          <div className="rounded-2xl border border-pink-100 bg-white p-5"><Tags className="text-pink-600" /><p className="mt-3 text-sm text-slate-500">Categorias</p><strong className="text-3xl">{data.categories.length}</strong></div>
          <div className="rounded-2xl border border-pink-100 bg-white p-5"><ClipboardList className="text-pink-600" /><p className="mt-3 text-sm text-slate-500">Encomendas pendentes</p><strong className="text-3xl">{pendingOrders}</strong></div>
        </section>

        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-xl font-semibold">Produtos</h2><p className="text-sm text-slate-500">Gerir preços, stock e publicação</p></div>
              <button type="button" onClick={() => void refreshData()} disabled={busy} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:border-pink-300 disabled:opacity-60"><RefreshCw size={15} /> Actualizar</button>
            </div>

            <form id="product-editor" className="mt-5 grid gap-3 rounded-2xl bg-pink-50/70 p-4 sm:grid-cols-2" onSubmit={handleProductSave}>
              <div className="sm:col-span-2"><h3 className="font-semibold">{editingId ? "Editar produto" : "Adicionar produto"}</h3><p className="text-xs text-slate-500">Só publica depois de confirmares os dados e o stock real.</p></div>
              <label className="text-sm font-medium">Nome<input required minLength={2} maxLength={120} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
              <label className="text-sm font-medium">Referência URL (opcional)<input maxLength={140} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} placeholder="gerada automaticamente" /></label>
              <label className="text-sm font-medium">Categoria<select className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.category_id} onChange={(event) => setProductForm({ ...productForm, category_id: event.target.value })}><option value="">Sem categoria</option>{data.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              <label className="text-sm font-medium">Preço (AOA)<input required type="number" min="0" step="1" inputMode="numeric" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.price_aoa} onChange={(event) => setProductForm({ ...productForm, price_aoa: event.target.value })} /></label>
              <label className="text-sm font-medium">Stock real<input required type="number" min="0" step="1" inputMode="numeric" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.stock_quantity} onChange={(event) => setProductForm({ ...productForm, stock_quantity: event.target.value })} /></label>
              <label className="text-sm font-medium sm:col-span-2">URL da imagem (opcional)<input type="url" className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.image_url} onChange={(event) => setProductForm({ ...productForm, image_url: event.target.value })} placeholder="https://…" /></label>
              <label className="text-sm font-medium sm:col-span-2">Descrição<textarea rows={2} maxLength={1000} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2" value={productForm.description} onChange={(event) => setProductForm({ ...productForm, description: event.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={productForm.is_active} onChange={(event) => setProductForm({ ...productForm, is_active: event.target.checked })} /> Publicar este produto na loja</label>
              <div className="flex flex-wrap gap-2 sm:col-span-2">
                <button disabled={busy} className="rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60" type="submit">{busy ? "A guardar…" : editingId ? "Guardar alterações" : "Adicionar produto"}</button>
                {editingId && <button type="button" onClick={() => { setEditingId(null); setProductForm(emptyProduct); }} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm">Cancelar edição</button>}
              </div>
            </form>

            <div className="mt-5 space-y-3">
              {data.products.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Ainda não existem produtos na base de dados. Adiciona apenas artigos e preços confirmados.</p>}
              {data.products.map((product) => (
                <article key={product.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">{product.name}</h3><span className={product.is_active ? "rounded-full bg-green-50 px-2 py-1 text-xs text-green-700" : "rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600"}>{product.is_active ? "Publicado" : "Rascunho"}</span></div>
                    <p className="mt-1 text-sm text-slate-500">{formatPrice(product.price_aoa)} · Stock: {product.stock_quantity}</p>
                  </div>
                  <button type="button" onClick={() => editProduct(product)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:border-pink-300 hover:text-pink-700">Editar</button>
                </article>
              ))}
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
              <h2 className="text-xl font-semibold">Categorias</h2>
              <form className="mt-4 space-y-3" onSubmit={handleCategorySave}>
                <label className="block text-sm font-medium">Nome da categoria<input required minLength={2} maxLength={80} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /></label>
                <label className="block text-sm font-medium">Descrição (opcional)<textarea maxLength={500} rows={2} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} /></label>
                <button disabled={busy} className="rounded-xl bg-pink-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-pink-700 disabled:opacity-60" type="submit">Adicionar categoria</button>
              </form>
              <div className="mt-4 space-y-2">
                {data.categories.map((category) => (
                  <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3">
                    <div><p className="text-sm font-medium">{category.name}</p><p className="text-xs text-slate-500">{category.is_active ? "Activa" : "Inactiva"}</p></div>
                    <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await setAdminCategoryActive(category.id, !category.is_active); setNotice("Categoria actualizada."); await refreshData(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível actualizar a categoria."); } finally { setBusy(false); } }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium">{category.is_active ? "Desactivar" : "Activar"}</button>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-pink-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2"><Boxes className="text-pink-600" /><h2 className="text-xl font-semibold">Encomendas</h2></div>
              <p className="mt-1 text-sm text-slate-500">As 100 encomendas mais recentes</p>
              <div className="mt-4 space-y-3">
                {data.orders.length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">Ainda não há encomendas registadas.</p>}
                {data.orders.map((order) => (
                  <article key={order.id} className="rounded-2xl border border-slate-100 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-semibold">{order.customer_name}</h3><p className="text-xs text-slate-500">{order.customer_phone} · {formatDate(order.created_at)}</p></div><strong className="text-sm text-pink-700">{formatPrice(order.total_aoa)}</strong></div>
                    <ul className="mt-3 space-y-1 text-sm text-slate-600">{order.order_items.map((item) => <li key={item.id}>{item.quantity} × {item.product_name}</li>)}</ul>
                    {order.delivery_address && <p className="mt-2 text-xs text-slate-500">{order.delivery_address}</p>}
                    <label className="mt-3 block text-xs font-medium text-slate-500">Estado da encomenda<select aria-label={"Estado da encomenda de " + order.customer_name} disabled={busy} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800" value={order.status} onChange={(event) => void changeOrderStatus(order, event.target.value as AdminOrder["status"])}>{orderStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-3xl text-center text-xs leading-5 text-slate-500">As alterações dependem das políticas de segurança do Supabase. Esta página não contém chaves privadas; a autorização é sempre validada pela sessão e pelas políticas RLS da base de dados.</p>
      </div>
    </main>
  );
}
