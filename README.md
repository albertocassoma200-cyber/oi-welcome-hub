# Universo das Barbies

Loja online em português de Angola, com identidade visual rosa, branca e preta.

## Estado actual

- Página pública em `src/routes/index.tsx`, com apresentação da marca, pesquisa, categorias visuais, favoritos e lista de interesse enviada pelo WhatsApp.
- Os 12 artigos, imagens e preços actualmente presentes no catálogo são **referências ilustrativas**. Não representam stock confirmado nem inventário actualizado.
- Foi criado o cliente de ligação ao Supabase em `src/lib/supabase.ts`, usando apenas a URL e a chave publicável configuradas no ambiente.
- Foi criada a rota privada de administração em `/admin`, com login, verificação do papel `admin`, gestão de produtos/categorias e actualização do estado das encomendas.
- A loja pública ainda não está ligada ao catálogo real nem ao registo de encomendas na base de dados. O fluxo público continua a servir apenas para pedir confirmação pelo WhatsApp.
- A autenticação e o painel só ficam operacionais depois de aplicar o esquema no projecto Supabase e configurar as variáveis de ambiente.

## Preparar o Supabase

1. Confirma que o projecto Supabase da loja está activo.
2. Aplica o esquema existente em `supabase/migrations/202611160001_initial_store_schema.sql` através do fluxo de base de dados do projecto/Lovable ou do SQL Editor do Supabase. A migração cria tabelas, políticas RLS e a função transaccional `submit_order`; não insere produtos fictícios.
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

   Usa `.env.example` como referência. O valor da chave publicável deve ser colocado apenas nas definições de ambiente, não num commit.

6. Abre `/admin`, entra com a conta administradora e adiciona categorias, produtos, preços e quantidades de stock reais. Os produtos começam como rascunho; activa a publicação apenas depois de confirmares os dados.

**Segurança:** usa somente a chave publicável/anon no browser. Nunca coloques `service_role`, passwords ou tokens privados em variáveis `VITE_*`, no GitHub ou no código do cliente. O painel consulta o perfil e depende das políticas RLS da base de dados; esconder a rota não substitui a autorização no Supabase.

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

O GitHub Actions executa lint, testes e build em cada push para `main` e em pull requests.

## Próximas etapas

1. Aplicar o esquema e configurar as variáveis de ambiente no Supabase/Lovable.
2. Testar login, permissões RLS e gestão administrativa com a conta real do proprietário.
3. Ligar a página pública ao catálogo activo do Supabase e substituir as referências ilustrativas por produtos reais.
4. Ligar o checkout à função transaccional `submit_order`, confirmar stock/preços no servidor e testar o fluxo completo.
5. Rever imagens reais, políticas de entrega, pagamentos e contactos antes da publicação comercial.
