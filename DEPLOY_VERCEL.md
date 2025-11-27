# Deploy Simplificado - Vercel

## Passos (5 minutos):

1. Acesse: https://vercel.com/signup
2. Clique em **"Continue with GitHub"**
3. Autorize o Vercel a acessar seus repositórios
4. Na tela inicial do Vercel, clique em **"Add New Project"**
5. Selecione o repositório **"projetos"**
6. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
7. Clique em **"Environment Variables"** e adicione:
   - `VITE_SUPABASE_URL` = `https://lhbwfbquxkutcyqazpnw.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxoYndmYnF1eGt1dGN5cWF6cG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA1Mjc5MTksImV4cCI6MjA2NjEwMzkxOX0.Tk6O2kpzTWcce9laIancu-lMFATLYkaTvgLBiRMsa10`
   - `VITE_ADMIN_PASSWORD` = `admin123`
8. Clique em **"Deploy"**

Pronto! Seu site estará no ar em 1-2 minutos. 🚀

Você pode depois conectar seu domínio da Cloudflare no Vercel nas configurações do projeto.
