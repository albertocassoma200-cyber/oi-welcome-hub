type SupabaseUser = {
  id: string;
  email?: string;
};

type SupabaseSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: SupabaseUser;
};

type AuthResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  user: SupabaseUser;
};

type Profile = {
  id: string;
  full_name: string | null;
  role: "customer" | "admin";
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type ProductRow = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price_aoa: number;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
};

export type StorefrontCategory = Pick<CategoryRow, "id" | "name" | "slug">;

export type StorefrontProduct = {
  id: string;
  name: string;
  category: string;
  category_id: string | null;
  description: string | null;
  price: number;
  image: string;
  stockQuantity: number;
  tag: string;
};

export type AdminProduct = ProductRow;

export type AdminCategory = CategoryRow;

export type AdminOrder = {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string | null;
  customer_note: string | null;
  status: "pending" | "confirmed" | "preparing" | "shipped" | "completed" | "cancelled";
  total_aoa: number;
  created_at: string;
  order_items: Array<{
    id: string;
    product_name: string;
    unit_price_aoa: number;
    quantity: number;
  }>;
};

const SESSION_KEY = "universo-barbies:supabase-session";

function getConfig() {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "A ligação à base de dados ainda não está configurada. Define VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente da aplicação.",
    );
  }

  return { url, key };
}

export function isSupabaseConfigured() {
  return Boolean(
    import.meta.env.VITE_SUPABASE_URL?.trim() &&
      import.meta.env.VITE_SUPABASE_ANON_KEY?.trim(),
  );
}

function readSession(): SupabaseSession | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;

    const value = JSON.parse(raw) as Partial<SupabaseSession>;
    if (
      typeof value.access_token !== "string" ||
      typeof value.refresh_token !== "string" ||
      typeof value.expires_at !== "number" ||
      typeof value.user?.id !== "string"
    ) {
      window.localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return value as SupabaseSession;
  } catch {
    return null;
  }
}

function saveSession(response: AuthResponse) {
  if (typeof window === "undefined") return null;

  const session: SupabaseSession = {
    access_token: response.access_token,
    refresh_token: response.refresh_token,
    expires_at: response.expires_at ?? Math.floor(Date.now() / 1000) + response.expires_in,
    user: response.user,
  };

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

function clearSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

async function readError(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string; msg?: string; error_description?: string; error?: string }
    | null;

  return (
    payload?.message ??
    payload?.msg ??
    payload?.error_description ??
    payload?.error ??
    `O servidor respondeu com o código ${response.status}.`
  );
}

async function refreshSession() {
  const current = readSession();
  if (!current) return null;

  const { url, key } = getConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: current.refresh_token }),
  });

  if (!response.ok) {
    clearSession();
    return null;
  }

  return saveSession((await response.json()) as AuthResponse);
}

async function accessToken() {
  const { key } = getConfig();
  const current = readSession();
  if (!current) return key;

  if (current.expires_at * 1000 > Date.now() + 60_000) {
    return current.access_token;
  }

  const refreshed = await refreshSession();
  return refreshed?.access_token ?? key;
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  retryAfterRefresh = true,
): Promise<T> {
  const { url, key } = getConfig();
  const token = await accessToken();
  const headers = new Headers(init.headers);

  headers.set("apikey", key);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${url}${path}`, { ...init, headers });

  if (response.status === 401 && retryAfterRefresh && readSession()) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest<T>(path, init, false);
  }

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function signInWithPassword(email: string, password: string) {
  const { url, key } = getConfig();
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) throw new Error(await readError(response));

  return saveSession((await response.json()) as AuthResponse);
}

export async function signOut() {
  const current = readSession();
  if (!current) return;

  const { url, key } = getConfig();
  try {
    const response = await fetch(`${url}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${current.access_token}`,
      },
    });
    if (!response.ok && response.status !== 401) {
      throw new Error(await readError(response));
    }
  } finally {
    clearSession();
  }
}

export async function getCurrentUser(): Promise<SupabaseUser | null> {
  if (!readSession()) return null;
  return apiRequest<SupabaseUser>("/auth/v1/user");
}

export async function getProfile(userId: string) {
  const query = new URLSearchParams({
    select: "id,full_name,role",
    id: `eq.${userId}`,
    limit: "1",
  });
  const rows = await apiRequest<Profile[]>(`/rest/v1/profiles?${query.toString()}`);
  return rows[0] ?? null;
}

export async function loadStorefrontCatalog() {
  const categoryQuery = new URLSearchParams({
    select: "id,name,slug",
    is_active: "eq.true",
    order: "sort_order.asc,name.asc",
  });
  const productQuery = new URLSearchParams({
    select: "id,name,category_id,description,image_url,price_aoa,stock_quantity",
    is_active: "eq.true",
    order: "created_at.desc",
  });

  const [categories, rows] = await Promise.all([
    apiRequest<StorefrontCategory[]>(`/rest/v1/categories?${categoryQuery.toString()}`),
    apiRequest<
      Array<
        Pick<
          ProductRow,
          | "id"
          | "name"
          | "category_id"
          | "description"
          | "image_url"
          | "price_aoa"
          | "stock_quantity"
        >
      >
    >(`/rest/v1/products?${productQuery.toString()}`),
  ]);

  const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

  const products: StorefrontProduct[] = rows.map((product) => ({
    id: product.id,
    name: product.name,
    category_id: product.category_id,
    category: product.category_id
      ? (categoryNames.get(product.category_id) ?? "Outros")
      : "Outros",
    description: product.description,
    price: product.price_aoa,
    image: product.image_url ?? "",
    stockQuantity: product.stock_quantity,
    tag: product.stock_quantity > 0 ? "Em stock" : "Esgotado",
  }));

  return { categories, products };
}

export async function submitStoreOrder(input: {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  customerNote: string;
  items: Array<{ product_id: string; quantity: number }>;
}) {
  return apiRequest<string>("/rest/v1/rpc/submit_order", {
    method: "POST",
    body: JSON.stringify({
      p_customer_name: input.customerName,
      p_customer_phone: input.customerPhone,
      p_delivery_address: input.deliveryAddress,
      p_customer_note: input.customerNote,
      p_items: input.items,
    }),
  });
}

export async function loadAdminData() {
  const productQuery = new URLSearchParams({
    select: "*",
    order: "created_at.desc",
  });
  const categoryQuery = new URLSearchParams({
    select: "*",
    order: "sort_order.asc,name.asc",
  });
  const orderQuery = new URLSearchParams({
    select: "id,customer_name,customer_phone,delivery_address,customer_note,status,total_aoa,created_at,order_items(id,product_name,unit_price_aoa,quantity)",
    order: "created_at.desc",
    limit: "100",
  });

  const [products, categories, orders] = await Promise.all([
    apiRequest<AdminProduct[]>(`/rest/v1/products?${productQuery.toString()}`),
    apiRequest<AdminCategory[]>(`/rest/v1/categories?${categoryQuery.toString()}`),
    apiRequest<AdminOrder[]>(`/rest/v1/orders?${orderQuery.toString()}`),
  ]);

  return { products, categories, orders };
}

export async function saveAdminCategory(input: {
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}) {
  return apiRequest<AdminCategory[]>("/rest/v1/categories", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(input),
  });
}

export async function setAdminCategoryActive(id: string, isActive: boolean) {
  const query = new URLSearchParams({ id: `eq.${id}` });
  return apiRequest<AdminCategory[]>(`/rest/v1/categories?${query.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ is_active: isActive }),
  });
}

export async function saveAdminProduct(input: {
  id?: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  price_aoa: number;
  stock_quantity: number;
  is_active: boolean;
}) {
  const { id, ...values } = input;
  if (id) {
    const query = new URLSearchParams({ id: `eq.${id}` });
    return apiRequest<AdminProduct[]>(`/rest/v1/products?${query.toString()}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(values),
    });
  }

  return apiRequest<AdminProduct[]>("/rest/v1/products", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify(values),
  });
}

export async function updateAdminOrderStatus(
  id: string,
  status: AdminOrder["status"],
) {
  const query = new URLSearchParams({ id: `eq.${id}` });
  return apiRequest<AdminOrder[]>(`/rest/v1/orders?${query.toString()}`, {
    method: "PATCH",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ status }),
  });
}
