# Universo das Barbies

Loja online em português de Angola, com identidade visual rosa, branca e preta.

## Estado actual

- A página pública em `src/routes/index.tsx` mantém a apresentação da marca, pesquisa, categorias visuais, favoritos e contactos.
- O catálogo público lê apenas produtos e categorias activos do Supabase. As quantidades disponíveis limitam o selector de artigos; artigos sem stock aparecem como esgotados.
- O checkout envia os artigos para a função transaccional `submit_order`. O servidor volta a validar preços e stock, regista a encomenda e guarda as linhas com o preço do momento da compra.
- A rota `/admin` inclui login, verificação do papel `admin`, criação/edição de produtos, gestão de categorias e actualização do estado das encomendas.
- As 12 referências locais em `src/lib/store-catalog.ts` são apenas materiais de demonstração/teste. Não são apresentadas como inventário e não são inseridas na base de dados.
- A integração está preparada no código, mas ainda depende da aplicação da migração e da configuração das variáveis de ambiente no alojamento. Não foi feita uma operação na base de dados real durante esta execução.

## Preparar o Supabase

1. Confirma que o projecto Supabase da loja está activo.
2. Aplica o esquema existente em `supabase/migrations/202611160001_initial_store_schema.sql` pelo fluxo de base de dados do projecto/Lovable ou pelo SQL Editor do Supabase. A migração cria tabelas, políticas RLS e a função transaccional `submit_order`; não insere produtos fictícios.
3. Em Authentication, cria a conta do proprietário. Não existe registo público no painel.
4. Copia o UUID da conta e promove essa conta a administradora no SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = '<AUTH_USER_UUID>';
   ```

5. Define estas variáveis no ambiente de desenvolvimento e no alojamento:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

   Usa `.env.example` como referência. A chave publicável deve ficar apenas nas definições de ambiente, nunca num commit.

6. Abre `/admin`, entra com a conta administradora e adiciona categorias, produtos, preços, imagens e quantidades de stock reais. Os produtos começam como rascunho; publica-os apenas depois de confirmares os dados.

7. Testa uma encomenda com stock real e confirma que aparece no painel. Não publiques a loja comercialmente antes de validar as políticas RLS, a função `submit_order` e o fluxo de entrega.

**Segurança:** usa somente a chave publicável/anon no browser. Nunca coloques `service_role`, passwords ou tokens privados em variáveis `VITE_*`, no GitHub ou no código do cliente. O painel verifica o perfil e depende das políticas RLS da base de dados; esconder a rota não substitui a autorização no Supabase.

## Modelo de dados

- `profiles`: perfil associado à conta Auth; novas contas começam sempre como `customer`.
- `categories`: categorias geridas pela administração.
- `products`: produtos com preço inteiro em AOA, stock e estado de publicação.
- `orders`: dados de contacto, morada e estado da encomenda.
- `order_items`: linhas da encomenda com cópia do nome e preço no momento da compra.

## Desenvolvimento e verificações

O repositório usa Bun e mantém `bun.lock`:

```sh
bun install --frozen-lockfile
bun run dev
bun run lint
bun run test
bun run build
```

O GitHub Actions executa formatação, lint, testes e build em cada push para `main` e em pull requests.

## Próximas etapas

1. Aplicar a migração e configurar as variáveis de ambiente no Supabase/Lovable.
2. Testar login, permissões RLS e gestão administrativa com a conta real do proprietário.
3. Confirmar que o catálogo público apresenta apenas artigos reais publicados e que o stock é actualizado após cada encomenda.
4. Validar a função transaccional `submit_order`, os estados das encomendas e os contactos com clientes.
5. Configurar armazenamento de imagens, políticas de entrega e pagamentos antes de activar a operação comercial.
