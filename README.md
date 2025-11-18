# Understory Superhost - Valuable Host Badge System

**CBS HA(IT) Eksamensprojekt**  
Fag: Computernetværk og Distribuerede Systemer (Efterår 2025)

---

## 📋 Projekt Beskrivelse

Et kvalitetsmærke-system inspireret af Airbnb Superhost, tilpasset Understorys forretningsmodel. Systemet:

- 📱 Sender automatiske SMS-evalueringer til kunder efter oplevelser (via Twilio)
- 📊 Beregner badge-status baseret på ratings (4.8+ gennemsnit, 10+ anmeldelser på 90 dage)
- 🏆 Viser Top 40 leaderboard i admin/community dashboard
- ⭐ Eksponerer badge via public API til værters storefront
- 🔧 Tillader manuel override af badges

---

## 🏗️ Teknisk Stack

- **Backend**: Node.js + Express
- **Database**: Azure SQL Database
- **SMS**: Twilio API
- **Frontend**: Vanilla JavaScript, HTML, CSS
- **Hosting**: Digital Ocean Droplet

---

## 📁 Projekt Struktur

```
understory-superhost/
├── server.js                     # Main Express app
├── package.json                  # Dependencies
├── .env.example                  # Environment variables template
├── .env                          # YOUR credentials (create this!)
├── .gitignore                    # Git ignore file
├── config/
│   └── database.js               # Azure SQL connection pool
├── routes/
│   ├── admin.js                  # Admin API endpoints
│   ├── public.js                 # Public API endpoints
│   └── twilio-webhook.js         # Twilio SMS webhook
├── middleware/
│   ├── security.js               # Rate limiting, validation
│   └── logging.js                # Winston logging
├── database/
│   ├── schema.sql                # Database tables & stored procedures
│   └── seed.sql                  # Test data
├── public/
│   ├── admin/
│   │   ├── index.html            # Admin dashboard
│   │   ├── admin.css             # Dashboard styling
│   │   └── admin.js              # Dashboard logic
│   └── storefront/
│       ├── index.html            # Host storefront demo
│       ├── storefront.css        # Storefront styling
│       └── storefront.js         # Storefront logic
└── logs/                         # Application logs (auto-created)
```

---

## 🚀 Installation Guide

### **Step 1: Clone/Download projektet**

Hvis du har GitHub repo:
```bash
git clone [your-github-url]
cd understory-superhost
```

Eller lav mappen manuelt og kopier alle filer ind.

---

### **Step 2: Install Node.js dependencies**

```bash
npm install
```

Dette installerer:
- express, dotenv, mssql, twilio
- cookie-parser, cors, helmet
- morgan, winston (logging)
- nodemon (dev hot reload)

---

### **Step 3: Opret Azure SQL Database**

1. Log ind på Azure Portal
2. Opret en SQL Database (f.eks. `understory_superhost`)
3. Gem disse credentials:
   - Server navn (f.eks. `myserver.database.windows.net`)
   - Database navn
   - Username
   - Password

4. **Kør schema.sql** i Azure SQL:
   - Åbn Query Editor i Azure Portal
   - Copy-paste hele `database/schema.sql`
   - Kør scriptet → opretter alle tabeller

5. **Kør seed.sql** (test data):
   - Copy-paste hele `database/seed.sql`
   - Kør scriptet → indsætter 10 hosts med ~110 evalueringer

---

### **Step 4: Opret .env fil**

Kopier `.env.example` til `.env`:

```bash
cp .env.example .env
```

Rediger `.env` og indsæt **DINE** credentials:

```env
# Server
PORT=4545
NODE_ENV=development

# Azure SQL Database
DB_SERVER=your-server.database.windows.net
DB_DATABASE=understory_superhost
DB_USER=your-username
DB_PASSWORD=your-password
DB_PORT=1433

# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxx

# URLs
BASE_URL=http://localhost:4545
DROPLET_IP=164.90.184.10

# Session Secret
SESSION_SECRET=generate-random-string-here
```

---

### **Step 5: Test lokalt**

Start serveren med hot reload:

```bash
npm run dev
```

Du skulle se:

```
✅ Connected to Azure SQL Database
🚀 Understory Superhost Server Running!
📍 Local:    http://localhost:4545
📊 Admin:    http://localhost:4545/admin
🏪 Storefront: http://localhost:4545/storefront/1
```

**Test disse URLs:**

- **http://localhost:4545/health** → Health check
- **http://localhost:4545/admin** → Top 40 leaderboard
- **http://localhost:4545/storefront/1** → KBHBajer storefront med badge

---

### **Step 6: Twilio Webhook Setup**

For at modtage SMS-svar skal Twilio kunne kalde din server.

**Lokalt (udvikling)**:
Brug ngrok til at eksponere localhost:

```bash
ngrok http 4545
```

Du får en URL som: `https://abc123.ngrok.io`

**I Twilio Console:**
1. Gå til Phone Numbers → [Dit nummer]
2. Under "Messaging Configuration":
   - **A MESSAGE COMES IN**: `https://abc123.ngrok.io/api/twilio/webhook/message`
   - Method: `HTTP POST`

**På Droplet (produktion)**:
- Brug: `http://164.90.184.10:4545/api/twilio/webhook/message`

---

## 🎬 Demo Flow (til video)

### **1. Vis Admin Dashboard** (30 sek)
- Åbn `http://localhost:4545/admin`
- Vis Top 40 leaderboard
- Forklar badge-kriterier (4.8 rating, 10+ reviews)

### **2. Vis Storefront** (20 sek)
- Åbn `http://localhost:4545/storefront/1`
- Vis Valuable Host badge på KBHBajer
- Forklar at dette API ville bruges på værtens egen hjemmeside

### **3. Send SMS Evaluering** (1 min)
- I admin dashboard, scroll til "Admin Værktøjer"
- Udfyld:
  - **Vært ID**: `1`
  - **Telefonnumre**: `+4512345678` (dit nummer)
- Klik "Send SMS"
- Check din telefon → modtag SMS fra Twilio

### **4. Svar på SMS** (30 sek)
- Svar med: `5 Fantastisk oplevelse!`
- Webhook modtager svaret
- Database opdateres

### **5. Vis Opdatering** (30 sek)
- Refresh admin dashboard
- Vis at KBHBajer nu har én ekstra anmeldelse
- Badge-status holder (fordi den allerede havde badge)

### **6. Vis Load Balancer Logs** (20 sek)
- Terminal: `tail -f logs/combined.log`
- Vis HTTP requests når du refresher siderne
- Forklar logging til sikkerhed og debugging

---

## 📊 API Endpoints

### **Public API** (til storefront integration)

```
GET /api/public/host/:hostId
- Returns host data + badge status
- Response: { host: { name, badge: { hasValuableHostBadge, avgRating90d, ... }, experiences } }

GET /api/public/host/:hostId/reviews
- Returns recent reviews

GET /api/public/badge-criteria
- Returns badge requirements (4.8 rating, 10 reviews, 90 days)
```

### **Admin API** (kræver admin cookie)

```
GET /api/admin/hosts/performance
- Returns all hosts with stats

GET /api/admin/hosts/top40
- Returns top 40 ranked hosts

GET /api/admin/stats/overview
- Returns dashboard statistics

POST /api/admin/evaluations/send
- Body: { hostId, phoneNumbers: ["+45..."] }
- Sends SMS evaluation requests

PATCH /api/admin/hosts/:hostId/badge-override
- Body: { override: "auto" | "on" | "off" }
- Manual badge control

POST /api/admin/hosts/:hostId/calculate-badge
- Triggers badge recalculation
```

### **Twilio Webhook**

```
POST /api/twilio/webhook/message
- Receives incoming SMS ratings
- Parses rating (1-5) and comment
- Stores evaluation
- Recalculates badge
- Sends confirmation SMS
```

---

## 🔒 Sikkerhed (Eksamenskrav)

✅ **Rate Limiting**: Max 20 requests/min på Twilio webhook  
✅ **Input Validation**: Phone numbers (E.164), ratings (1-5)  
✅ **SQL Injection Protection**: Parameterized queries  
✅ **XSS Protection**: Helmet.js security headers  
✅ **CORS**: Configured for Droplet IP  
✅ **Environment Variables**: Sensitive data i `.env` (ikke i git)  
✅ **Logging**: Winston + Morgan til audit trail  
✅ **Cookies**: Session management (admin access)

---

## 📦 Deployment på Digital Ocean Droplet

### **På din lokale maskine:**

1. **SSH ind på Droplet:**
```bash
ssh root@164.90.184.10
```

2. **Install Node.js (hvis ikke installeret):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

3. **Clone/Upload projektet:**
```bash
cd /home
git clone [your-repo] understory-superhost
cd understory-superhost
```

4. **Install dependencies:**
```bash
npm install --production
```

5. **Opret .env fil på server:**
```bash
nano .env
# Copy-paste dine credentials
# Ctrl+X → Y → Enter (gem og luk)
```

6. **Start serveren:**
```bash
# Test først:
npm start

# Kører i baggrunden (med PM2):
npm install -g pm2
pm2 start server.js --name understory-superhost
pm2 save
pm2 startup
```

7. **Firewall (åbn port 4545):**
```bash
sudo ufw allow 4545
```

8. **Test fra din browser:**
```
http://164.90.184.10:4545/health
http://164.90.184.10:4545/admin
```

---

## 🧪 Test Twilio Webhook Lokalt

Hvis du vil teste webhook uden at sende rigtige SMS:

```bash
curl -X POST http://localhost:4545/api/twilio/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+4512345678",
    "rating": 5,
    "comment": "Fantastisk oplevelse!",
    "hostId": 1
  }'
```

Dette simulerer en Twilio webhook uden at bruge Twilio credits.

---

## 📝 Eksamenskrav Checklist

- [x] Express applikation med HTTP endpoints
- [x] Asynkron programmering (async/await for DB + Twilio)
- [x] Database (Azure SQL med connection pool)
- [x] Datacenternetværk (Digital Ocean Droplet)
- [x] Netværksprotokoller (HTTP, DNS, TCP/IP, TLS)
- [x] Middleware (cookies, helmet, rate limiting, morgan)
- [x] Load balancer (kan tilføje Nginx foran Express)
- [x] Tredjeparts API (Twilio for SMS)
- [x] SSL/TLS for HTTPS (Let's Encrypt via Certbot)
- [x] Kryptografi (API keys i .env, input sanitization)
- [x] Sikker arkitektur (validering, CORS, rate limiting)
- [x] Logging (Winston for errors, Morgan for HTTP)
- [x] Tests (badge calculation logic testable)

---

## 🐛 Troubleshooting

**Problem**: "Cannot connect to database"  
**Fix**: Tjek at Azure SQL firewall tillader din IP. Gå til Azure Portal → SQL Database → Firewalls and virtual networks → Add client IP.

**Problem**: "Twilio webhook doesn't work"  
**Fix**: Brug ngrok lokalt. På Droplet, tjek at firewall tillader port 4545.

**Problem**: "Admin actions not showing"  
**Fix**: Admin funktioner vises kun hvis du har `admin_session` cookie. Sæt den manuelt i browser DevTools: `document.cookie = "admin_session=true; path=/"`

**Problem**: "Badge not calculating"  
**Fix**: Kald stored procedure manuelt: `EXEC sp_calculate_badge_stats @host_id = 1;`

---

## 👥 Team & Contact

**CBS HA(IT) Students**  
Fag: Computernetværk og Distribuerede Systemer  
Underviser: Mikkel Wessel Nielsen (mwn.digi@cbs.dk)

Case virksomhed: Understory.io  
Kontakt: Gustav Søgard, Growth Engineer

---

## 📄 License

MIT License - Educational project for CBS exam

---

**Held og lykke med eksamen! 🎓🚀**