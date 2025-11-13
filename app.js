// app.js – eksamensversion med netværkssikkerhed og middleware fra pensum

require('express-async-errors'); // gør async/await-fejl nemme at håndtere
require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const responseTime = require('response-time');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

// ========== 1) Basal konfiguration ==========

app.use(morgan('combined'));
app.use(helmet());

app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(responseTime());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ========== 2) Routes ==========

// Forside / hovedroute → bruger routes/index.js (DB-test)
app.use('/', indexRouter);

// Brugerruter
app.use('/users', usersRouter);

// Statisk content (HTML, CSS, JS, billeder) kun under /public
app.use('/public', express.static(path.join(__dirname, 'public')));

// ========== 3) Cookies + sessioner (HTTP + netværkssikkerhed) ==========

app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-session-secret-skal-aendres',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,              // sæt til true når du KUN kører HTTPS
    maxAge: 1000 * 60 * 60,     // 1 time
  },
}));

// Lille helper til debugging
app.use((req, res, next) => {
  // console.log('Session:', req.session);
  next();
});

// ========== 4) 404 og fejl-håndtering ==========

app.use((req, res, next) => {
  res.status(404).json({ error: 'Endpoint ikke fundet' });
});

app.use((err, req, res, next) => {
  console.error('Global fejl:', err);
  res.status(500).json({ error: 'Intern serverfejl' });
});

module.exports = app;
