# Universo das Barbies

Loja online em português de Angola, com identidade visual rosa, branca e preta.

## Estado actual

- Página de apresentação e catálogo visual em `src/routes/index.tsx`.
- Pesquisa, filtros por categoria, favoritos e lista de encomenda para WhatsApp.
- O catálogo apresenta os nove produtos e preços indicados nas fotografias fornecidas. O stock e a disponibilidade devem ser confirmados pelo WhatsApp.
- A integração com Supabase está preparada ao nível do esquema, mas ainda não está ligada à interface. Não existe autenticação administrativa activa nesta versão.

## Preparar o Supabase

1. Cria um projecto no [Supabase](https://supabase.com/).
2. No SQL Editor do projecto, executa o ficheiro `supabase/migrations/202611160001_initial_store_schema.sql`.
3. Em Authentication, configura os métodos de acesso pretendidos e confirma o URL de redireccionamento do site.
4. Cria a conta do proprietário em Authentication > Users.
5. Copia o UUID dessa conta e promove-a manualmente a administradora no SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = '<AUTH_USER_UUID>';
   ```

6. Define `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de desenvolvimento/hosting, usando `.env.example` como referência.

**Segurança:** usa apenas a chave publicável/anon no browser. Nunca coloques `service_role`, passwords ou tokens privados em variáveis `VITE_*`, no GitHub ou no código do cliente. As políticas RLS da migração limitam a gestão de catálogo e encomendas a contas com perfil `admin`.

## Modelo de dados criado

- `profiles`: perfil associado à conta Auth; novas contas começam sempre com papel `customer`.
- `categories`: categorias geridas pela administração.
- `products`: produtos com preço inteiro em AOA, stock e estado de publicação.
- `orders`: dados de contacto e estado da encomenda.
- `order_items`: linhas de encomenda com cópia do nome e preço no momento da compra.

A migração não cria produtos, categorias, administradores nem encomendas fictícias.

## Desenvolvimento

Requer Node.js e npm:

```sh
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Próximas etapas

1. Configurar o projecto Supabase e as variáveis de ambiente.
2. Adicionar o cliente Supabase com validação da configuração.
3. Implementar login/logout e rotas administrativas protegidas por sessão e RLS.
4. Ligar catálogo, stock e criação de encomendas à base de dados.
5. Testar permissões, validações, erros e fluxo completo antes da publicação.
