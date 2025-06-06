# 📹 Sistema de Transmissão Globo

Sistema completo de monitoramento de câmeras com streaming em tempo real e reconhecimento de voz. Desenvolvido com Next.js 14, TypeScript e PostgreSQL.

## 🎯 Funcionalidades

- ✅ **Visualização de câmeras** em tempo real (RTSP/WebRTC)
- ✅ **Modo Multiview** - múltiplas câmeras simultaneamente
- ✅ **Reconhecimento de voz** - troque câmeras por comando
- ✅ **Gestão de usuários** - ADMIN/OPERATOR com autenticação
- ✅ **Sistema de backup** - backup e restauração completa
- ✅ **Painel administrativo** - configurações centralizadas

## 🛠️ Tecnologias

- **Next.js 14** - Frontend e Backend
- **TypeScript** - Tipagem
- **PostgreSQL** - Banco de dados
- **Prisma** - ORM
- **MediaMTX** - Servidor de streaming
- **NextAuth.js** - Autenticação
- **Tailwind CSS** - Estilização

## 📋 Pré-requisitos (Windows)

- **Node.js 18+** - [Download aqui](https://nodejs.org)
- **PostgreSQL 13+** - [Download aqui](https://www.postgresql.org/download/windows/)
- **Git** - [Download aqui](https://git-scm.com/download/win)

## 🚀 Instalação

### 1. Clone o Projeto
```bash
git clone https://github.com/luisgabrieltech/sistema-transmissão-globo.git
cd sistema-transmissão-globo
```

### 2. Instale as Dependências
```bash
npm install
```

### 3. Configure o PostgreSQL

Durante a instalação do PostgreSQL, defina uma senha para o usuário `postgres`.

Abra o **SQL Shell (psql)** e execute:
```sql
CREATE USER globo_user WITH PASSWORD 'senha123';
CREATE DATABASE globo_surveillance OWNER globo_user;
GRANT ALL PRIVILEGES ON DATABASE globo_surveillance TO globo_user;
\q
```

### 4. Configure as Variáveis de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:
```env
# Banco de dados
DATABASE_URL="postgresql://globo_user:senha123@localhost:5432/globo_surveillance"

# Autenticação
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sua_chave_secreta_super_forte_aqui_32_chars"

# Google Speech API (opcional)
GOOGLE_SPEECH_API_KEY="sua_api_key_google"

# MediaMTX
MEDIAMTX_URL="http://localhost:8888"
```

### 5. Configure o Banco
```bash
npx prisma generate
npx prisma db push
```

### 6. Configure o MediaMTX

1. **Baixe o MediaMTX:** 
   - Acesse: https://github.com/bluenviron/mediamtx/releases/latest
   - Baixe: `mediamtx_v1.x.x_windows_amd64.zip`

2. **Extraia para uma pasta** (ex: `C:\mediamtx`)

3. **Copie a configuração:**
   ```bash
   copy mediamtx\mediamtx.yml C:\mediamtx\
   ```

4. **Execute o MediaMTX:**
   ```bash
   cd C:\mediamtx
   .\mediamtx.exe
   ```

## ▶️ Executar o Sistema

### 1. Inicie o MediaMTX
Em um terminal:
```bash
cd C:\mediamtx
.\mediamtx.exe
```

### 2. Inicie a Aplicação
Em outro terminal:
```bash
npm run dev
```

### 3. Acesse o Sistema
- **URL:** http://localhost:3000
- **Primeiro acesso:** http://localhost:3000/register

## ⚙️ Configuração Inicial

### 1. Primeiro Usuário
- Acesse `/register` e crie o primeiro usuário
- Este será automaticamente **ADMIN**

### 2. Adicionar Câmeras
- Vá em **Câmeras** → **Adicionar Câmera**
- Configure as URLs RTSP das suas câmeras IP
- Exemplo: `rtsp://admin:senha@192.168.1.100:554/stream`

### 3. Reconhecimento de Voz (Opcional)
- Vá em **Admin** → **Configurações**
- Adicione sua **Google Speech API Key**
- Teste o reconhecimento de voz nas câmeras

## 🎤 Comandos de Voz

Fale claramente para o microfone:
- **"câmera um"** - Troca para câmera 1
- **"portaria"** - Troca para câmera com keyword "portaria"
- **"entrada"** - Troca para câmera com keyword "entrada"

## 💾 Sistema de Backup

- **Criar backup:** Área de **Backups** → Escolha o tipo
- **Restaurar:** Clique no botão verde ↻ do backup
- **Download:** Clique no botão azul ⬇️ para baixar JSON

## 🔧 URLs das Câmeras Comuns

```bash
# Hikvision
rtsp://admin:senha@192.168.1.100:554/Streaming/Channels/101

# Dahua  
rtsp://admin:senha@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0

# Genérica
rtsp://usuario:senha@ip:porta/stream
```

## 🚨 Problemas Comuns

### PostgreSQL não conecta
```bash
# Verificar se está rodando
services.msc → PostgreSQL

# Testar conexão
psql -h localhost -U globo_user -d globo_surveillance
```

### MediaMTX não inicia
```bash
# Verificar se porta 8554 está livre
netstat -an | findstr 8554

# Executar como administrador
```

### Erro no npm install
```bash
# Limpar cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Câmera não aparece
- Verifique se a URL RTSP está correta
- Teste a URL em um player como VLC
- Verifique se a câmera está na mesma rede

## 📁 Estrutura do Projeto

```
sistema-transmissão-globo/
├── app/                    # Next.js App Router
│   ├── admin/             # Painel administrativo  
│   ├── api/               # APIs (auth, cameras, backup)
│   ├── backups/           # Página de backups
│   ├── cameras/           # Visualização de câmeras
│   └── multiview/         # Vista múltipla
├── components/            # Componentes React
├── mediamtx/             # Configuração MediaMTX
├── prisma/               # Schema do banco
└── .env.local            # Variáveis de ambiente
```

---

**Desenvolvido para a Globo** 🎬 
