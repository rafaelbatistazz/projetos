# Guia de Deploy - Advanx Academy

Este guia explica como colocar sua aplicação no ar usando Cloudflare Pages (recomendado) ou GitHub Pages.

## Opção 1: Cloudflare Pages (Recomendado)

Como você já tem o domínio na Cloudflare, esta é a melhor e mais fácil opção.

### Passo 1: Subir o código para o GitHub

1.  Crie uma conta no [GitHub](https://github.com) se não tiver.
2.  Crie um **novo repositório** (ex: `advanx-academy`).
3.  No seu terminal (onde estão os arquivos do projeto), execute:

```bash
# Inicializa o git
git init

# Adiciona todos os arquivos
git add .

# Faz o primeiro commit
git commit -m "Primeiro commit"

# Conecta ao seu repositório (substitua SEU_USUARIO e SEU_REPOSITORIO)
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git

# Envia o código
git push -u origin main
```

### Passo 2: Conectar Cloudflare Pages

1.  Acesse o painel da [Cloudflare](https://dash.cloudflare.com).
2.  No menu lateral, vá em **Workers & Pages**.
3.  Clique em **Create Application** > **Pages** > **Connect to Git**.
4.  Selecione o repositório que você acabou de criar (`advanx-academy`).
5.  Configure as opções de build:
    *   **Framework preset**: Selecione `Vite` ou `React`.
    *   **Build command**: `npm run build`
    *   **Build output directory**: `dist`
6.  **Variáveis de Ambiente (Environment Variables)**:
    *   Adicione as variáveis que estão no seu arquivo `.env`:
        *   `VITE_SUPABASE_URL`: `https://lhbwfbquxkutcyqazpnw.supabase.co`
        *   `VITE_SUPABASE_ANON_KEY`: `(Sua chave anon que começa com eyJ...)`
        *   `VITE_ADMIN_PASSWORD`: `admin123` (ou a senha que desejar)
7.  Clique em **Save and Deploy**.

A Cloudflare vai construir seu site e te dar um link (ex: `advanx-academy.pages.dev`). Depois você pode configurar seu domínio personalizado na aba "Custom Domains" do projeto no Cloudflare Pages.

---

## Opção 2: Rodar no seu Servidor (VPS)

Se você prefere rodar no seu servidor (`srv927359`), você precisa instalar o Node.js e um servidor web (Nginx).

### 1. Instalar Node.js e NPM
```bash
# Atualiza os pacotes
apt update

# Instala Node.js (versão 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verifica instalação
node -v
npm -v
```

### 2. Construir o Projeto
```bash
# Entra na pasta do projeto
cd /caminho/para/advanx-academy

# Instala dependências
npm install

# Cria a versão de produção (pasta dist)
npm run build
```

### 3. Servir com Nginx (Recomendado para produção)
Não use `npm run dev` em produção. Use o Nginx para servir os arquivos estáticos da pasta `dist`.

```bash
apt install nginx
```

Crie um arquivo de configuração: `/etc/nginx/sites-available/advanx`

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    root /caminho/para/advanx-academy/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Ative o site e reinicie o Nginx:
```bash
ln -s /etc/nginx/sites-available/advanx /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```
