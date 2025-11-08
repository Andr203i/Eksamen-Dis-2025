// app.js – eksamensversion med netværkssikkerhed og middleware fra pensum

require('express-async-errors'); // gør async/await-fejl nemme at håndtere

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const responseTime = require('response-time');

// Her kan du senere importere din database eller db-pool
// const db = require('./db');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
// Tilføj selv flere, fx:
// const authRouter = require('./routes/auth');
// const apiRouter = require('./routes/api');

const app = express();

// ========== 1) Basal konfiguration ==========

// Log alle HTTP-requests (god til debugging og analyse af trafik)
app.use(morgan('combined'));

// Sæt sikkerheds-headere (XSS, clickjacking, MIME-sniffing, osv.)
app.use(helmet());

// Tillad CORS hvis du har frontend et andet sted
// Hvis frontend og backend ligger samme sted, kan du gøre det strammere.
app.use(cors({
  origin: true,          // accepterer origin dynamisk (kan strammes til ['https://dit-domæne.dk'])
  credentials: true,     // så browseren må sende cookies med
}));

// Måling af responstid (til at koble teori om RTT/TTFB/response-time til praksis)
app.use(responseTime());

// Rate limiting – beskytter mod simple DoS/brute force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutter
  max: 200,                 // maks 200 requests per IP per vindue
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body-parsing (JSON og form-data)
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Statisk content (HTML, CSS, JS, billeder)
app.use(express.static(path.join(__dirname, 'public')));

// ========== 2) Cookies + sessioner (HTTP + netværkssikkerhed) ==========

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-skal-aendres',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,       // beskytter mod JS-adgang til cookie (XSS)
    sameSite: 'lax',      // beskytter lidt mod CSRF
    secure: false,        // SKAL sættes til true, når du KUN kører HTTPS i produktion
    maxAge: 1000 * 60 * 60, // 1 time
  },
}));

// Lille helper til at logge hvem der er logget ind (til debugging)
app.use((req, res, next) => {
  // du kan logge req.session.userId eller lignende, når du laver login
  // console.log('Session:', req.session);
  next();
});

// ========== 3) Routes ==========

// Forside / hovedroute
app.use('/', indexRouter);

// Brugerruter (registrering, profil osv.)
app.use('/users', usersRouter);

// Ekstra eksempler – tilføj selv, når du laver dem:
// app.use('/auth', authRouter);
// app.use('/api', apiRouter);

// ========== 4) 404-håndtering ==========

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint ikke fundet' });
});

// ========== 5) Global fejl-håndtering ==========
// Fanger fejl fra alle routes – inkl. async/await (pga. express-async-errors)

app.use((err, req, res, next) => {
  console.error('Global fejl:', err);

  // Her kan du differentiere lidt, hvis du vil:
  // fx err.statusCode || 500
  res.status(500).json({ error: 'Intern serverfejl' });
});

module.exports = app;
