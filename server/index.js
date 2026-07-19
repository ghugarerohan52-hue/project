const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Setup SQLite database
const dbPath = path.join(__dirname, 'moviedb.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Migrate: fix old column names in streaming_platforms
const spCols = db.prepare("PRAGMA table_info(streaming_platforms)").all().map(c => c.name);
if (spCols.includes('icon') && !spCols.includes('logo')) {
  db.exec('ALTER TABLE streaming_platforms ADD COLUMN logo TEXT');
  db.exec("UPDATE streaming_platforms SET logo = icon WHERE logo IS NULL");
}
if (spCols.includes('base_url') && !spCols.includes('website')) {
  db.exec('ALTER TABLE streaming_platforms ADD COLUMN website TEXT');
  db.exec("UPDATE streaming_platforms SET website = base_url WHERE website IS NULL");
}

// Migrate: add headline to reviews if missing
const reviewCols = db.prepare("PRAGMA table_info(reviews)").all().map(c => c.name);
if (!reviewCols.includes('headline')) {
  db.exec('ALTER TABLE reviews ADD COLUMN headline TEXT');
}

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    year INTEGER,
    director TEXT,
    runtime INTEGER,
    rated TEXT,
    imdb_rating REAL DEFAULT 0,
    metascore INTEGER,
    cast_names TEXT,
    writers TEXT,
    overview TEXT,
    tagline TEXT,
    poster_url TEXT,
    backdrop_url TEXT,
    trailer_url TEXT,
    actor_photos TEXT,
    photos TEXT,
    budget INTEGER,
    revenue INTEGER,
    release_date TEXT,
    language TEXT DEFAULT 'English',
    country TEXT DEFAULT 'USA',
    streaming_links TEXT,
    trivia TEXT,
    quotes TEXT,
    did_you_know TEXT,
    awards TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS genres (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT
  );
  CREATE TABLE IF NOT EXISTS movie_genres (
    movie_id INTEGER,
    genre_id INTEGER,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    headline TEXT,
    content TEXT,
    rating REAL NOT NULL,
    helpful INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS streaming_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    logo TEXT,
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS movie_streaming (
    movie_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    url TEXT,
    PRIMARY KEY (movie_id, platform_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES streaming_platforms(id) ON DELETE CASCADE
  );
`);

// Helper: create slug from title
function slugify(text) {
  return text.toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper: compute avgRating + ratingCount for a movie
function getMovieRating(movieId) {
  const r = db.prepare('SELECT AVG(rating) as avg, COUNT(*) as count FROM reviews WHERE movie_id = ?').get(movieId);
  return { avgRating: r.avg ? Number(r.avg.toFixed(1)) : 0, ratingCount: r.count };
}

// Helper: get genres for a movie in frontend format
function getMovieGenres(movieId) {
  const rows = db.prepare('SELECT g.id, g.name, g.slug FROM genres g JOIN movie_genres mg ON g.id = mg.genre_id WHERE mg.movie_id = ?').all(movieId);
  return rows.map(g => ({ genre: { id: String(g.id), name: g.name, slug: g.slug } }));
}

function getMovieStreaming(movieId) {
  const rows = db.prepare('SELECT ms.platform_id, ms.url, sp.name, sp.logo, sp.website FROM movie_streaming ms JOIN streaming_platforms sp ON ms.platform_id = sp.id WHERE ms.movie_id = ?').all(movieId);
  return rows.map(r => ({ platformId: String(r.platform_id), name: r.name, logo: r.logo || '', website: r.website || '', url: r.url || '' }));
}

// Helper: enrich a movie row with genres, ratings, slug
function enrichMovie(row) {
  if (!row) return null;
  const rating = getMovieRating(row.id);
  const genres = getMovieGenres(row.id);
  return {
    id: String(row.id),
    title: row.title,
    slug: row.slug,
    year: row.year,
    runtime: row.runtime,
    rated: row.rated,
    posterUrl: row.poster_url,
    backdropUrl: row.backdrop_url,
    trailerUrl: row.trailer_url,
    director: row.director,
    writers: row.writers,
    cast: row.cast_names,
    actorPhotos: row.actor_photos,
    photos: row.photos,
    overview: row.overview,
    tagline: row.tagline,
    language: row.language,
    country: row.country,
    budget: row.budget,
    revenue: row.revenue,
    streamingLinks: row.streaming_links || null,
    trivia: row.trivia || null,
    quotes: row.quotes || null,
    didYouKnow: row.did_you_know || null,
    awards: row.awards || null,
    release_date: row.release_date || null,
    metascore: row.metascore || null,
    ...rating,
    genres,
    streaming: getMovieStreaming(row.id),
  };
}

function enrichReview(row) {
  if (!row) return null;
  return {
    id: String(row.id),
    movieId: String(row.movie_id),
    author: row.author,
    headline: row.headline,
    content: row.content,
    rating: row.rating,
    helpful: row.helpful,
    createdAt: row.created_at,
  };
}

// ===== MOVIES ROUTES =====

// GET /api/movies - list with search, sort, pagination
app.get('/api/movies', (req, res) => {
  const { search, sort, page = '1', limit = '50', genre } = req.query;
  let query = 'SELECT m.* FROM movies m';
  const conditions = [];
  const params = [];

  if (genre) {
    query += ' JOIN movie_genres mg ON m.id = mg.movie_id JOIN genres g ON mg.genre_id = g.id';
    conditions.push('g.name = ?');
    params.push(genre);
  }

  if (search) {
    conditions.push("(m.title LIKE ? OR m.director LIKE ? OR m.cast_names LIKE ?)");
    const s = `%${search}%`;
    params.push(s, s, s);
  }

  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

  // Count total
  const countQuery = query.replace('SELECT m.*', 'SELECT COUNT(DISTINCT m.id) as count');
  const total = db.prepare(countQuery).get(...params).count;

  // Sort
  if (sort === 'rating') query += ' ORDER BY m.imdb_rating DESC';
  else if (sort === 'year') query += ' ORDER BY m.year DESC';
  else if (sort === 'revenue') query += ' ORDER BY m.revenue DESC';
  else if (sort === 'avgRating') query += ' ORDER BY m.imdb_rating DESC';
  else query += ' ORDER BY m.imdb_rating DESC';

  // Pagination
  const lim = Math.min(parseInt(limit) || 50, 100);
  const pg = Math.max(parseInt(page) || 1, 1);
  const offset = (pg - 1) * lim;
  query += ` LIMIT ? OFFSET ?`;
  params.push(lim, offset);

  const movies = db.prepare(query).all(...params);
  const totalPages = Math.ceil(total / lim);

  res.json({
    movies: movies.map(enrichMovie),
    totalPages,
    total,
    page: pg,
  });
});

// GET /api/featured
app.get('/api/featured', (req, res) => {
  const movies = db.prepare('SELECT * FROM movies WHERE imdb_rating >= 8.5 ORDER BY imdb_rating DESC LIMIT 5').all();
  res.json({ movies: movies.map(enrichMovie) });
});

// GET /api/top250
app.get('/api/top250', (req, res) => {
  const movies = db.prepare('SELECT * FROM movies ORDER BY imdb_rating DESC LIMIT 250').all();
  res.json({ movies: movies.map(enrichMovie) });
});

// GET /api/stats
app.get('/api/stats', (req, res) => {
  const movieCount = db.prepare('SELECT COUNT(*) as c FROM movies').get().c;
  const reviewCount = db.prepare('SELECT COUNT(*) as c FROM reviews').get().c;
  const genreCount = db.prepare('SELECT COUNT(*) as c FROM genres').get().c;
  const userCount = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  const platformCount = db.prepare('SELECT COUNT(*) as c FROM streaming_platforms').get().c;
  res.json({ movieCount, reviewCount, genreCount, userCount, platformCount });
});

// GET /api/genres
app.get('/api/genres', (req, res) => {
  const genres = db.prepare(`
    SELECT g.*, COUNT(mg.movie_id) as movie_count
    FROM genres g LEFT JOIN movie_genres mg ON g.id = mg.genre_id
    GROUP BY g.id ORDER BY g.name
  `).all();
  res.json({
    genres: genres.map(g => ({
      id: String(g.id),
      name: g.name,
      slug: g.slug,
      description: g.description,
      _count: { movies: g.movie_count },
    })),
  });
});

// GET /api/movies/:slug - single movie with reviews
app.get('/api/movies/:slug', (req, res) => {
  const movie = db.prepare('SELECT * FROM movies WHERE slug = ?').get(req.params.slug);
  if (!movie) return res.json({ error: 'Movie not found' });

  const enriched = enrichMovie(movie);
  const reviews = db.prepare('SELECT * FROM reviews WHERE movie_id = ? ORDER BY created_at DESC').all(movie.id);
  enriched.reviews = reviews.map(enrichReview);

  res.json({ movie: enriched });
});

// ===== REVIEW ROUTES =====

// POST /api/reviews - create review
app.post('/api/reviews', (req, res) => {
  try {
    const { movieId, author, headline, content, rating } = req.body;

    // Validate inputs
    if (!movieId || !author || !content || !rating) {
      return res.status(400).json({ error: 'Missing required fields: movieId, author, content, rating' });
    }

    const parsedMovieId = parseInt(movieId);
    const parsedRating = parseInt(rating);

    if (isNaN(parsedMovieId) || isNaN(parsedRating)) {
      return res.status(400).json({ error: 'movieId and rating must be valid numbers' });
    }

    if (parsedRating < 1 || parsedRating > 10) {
      return res.status(400).json({ error: 'rating must be between 1 and 10' });
    }

    // Check if movie exists
    const movie = db.prepare('SELECT id FROM movies WHERE id = ?').get(parsedMovieId);
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    const result = db.prepare('INSERT INTO reviews (movie_id, author, headline, content, rating) VALUES (?, ?, ?, ?, ?)')
      .run(parsedMovieId, author, headline || null, content, parsedRating);

    // Update movie's average rating
    const avgResult = db.prepare('SELECT AVG(rating) as avg FROM reviews WHERE movie_id = ?').get(parsedMovieId);
    const newAvgRating = avgResult.avg || 0;
    db.prepare('UPDATE movies SET imdb_rating = ? WHERE id = ?').run(newAvgRating, parsedMovieId);

    const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
    res.json({ review: enrichReview(review) });
  } catch (error) {
    console.error('Review creation error:', error);
    res.status(500).json({ error: 'Failed to create review: ' + error.message });
  }
});

// POST /api/reviews/:id/helpful
app.post('/api/reviews/:id/helpful', (req, res) => {
  db.prepare('UPDATE reviews SET helpful = helpful + 1 WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

// ===== ADMIN ROUTES =====

// GET /api/admin/movies
app.get('/api/admin/movies', (req, res) => {
  const { page = '1', limit = '15', search } = req.query;
  let query = 'SELECT m.* FROM movies m';
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(m.title LIKE ? OR m.director LIKE ? OR m.cast_names LIKE ?)");
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

  const countQ = query.replace('SELECT m.*', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQ).get(...params).count;

  query += ' ORDER BY m.title ASC';
  const lim = Math.min(parseInt(limit) || 15, 100);
  const pg = Math.max(parseInt(page) || 1, 1);
  query += ` LIMIT ? OFFSET ?`;
  params.push(lim, (pg - 1) * lim);

  const movies = db.prepare(query).all(...params);

  res.json({
    movies: movies.map(m => {
      const enriched = enrichMovie(m);
      const rc = db.prepare('SELECT COUNT(*) as c FROM reviews WHERE movie_id = ?').get(m.id);
      enriched._count = { reviews: rc.c };
      return enriched;
    }),
    totalPages: Math.ceil(total / lim),
    total,
    page: pg,
  });
});

// POST /api/admin/movies
app.post('/api/admin/movies', (req, res) => {
  try {
    const b = req.body;
    if (!b.title || !b.director || !b.overview) {
      return res.status(400).json({ error: 'Title, director, and overview are required' });
    }
    const slug = slugify(b.title) + '-' + Date.now();
    const result = db.prepare(`
      INSERT INTO movies (title, slug, year, director, runtime, rated, imdb_rating, metascore,
        cast_names, writers, overview, tagline, poster_url, backdrop_url, trailer_url,
        actor_photos, photos, budget, revenue, release_date, language, country,
        streaming_links, trivia, quotes, did_you_know, awards)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      b.title, slug, b.year, b.director, b.runtime || 120, b.rated || 'PG-13',
      b.imdb_rating || 0, b.metascore || null,
      b.cast || null, b.writers || null, b.overview, b.tagline || null,
      b.posterUrl || null, b.backdropUrl || null, b.trailerUrl || null,
      b.actorPhotos || null, b.photos || null,
      b.budget || null, b.revenue || null, b.release_date || null,
      b.language || 'English', b.country || 'USA',
      b.streamingLinks || null, b.trivia || null, b.quotes || null,
      b.didYouKnow || null, b.awards || null
    );

    if (b.genreIds && b.genreIds.length) {
      b.genreIds.filter(gid => gid && String(gid).length > 0).forEach(gid => {
        db.prepare('INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)').run(result.lastInsertRowid, parseInt(gid));
      });
    }

    if (b.streamingPlatforms && b.streamingPlatforms.length) {
      b.streamingPlatforms.forEach(sp => {
        if (sp.platformId) {
          db.prepare('INSERT OR IGNORE INTO movie_streaming (movie_id, platform_id, url) VALUES (?, ?, ?)').run(result.lastInsertRowid, parseInt(sp.platformId), sp.url || null);
        }
      });
    }

    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(result.lastInsertRowid);
    res.json({ movie: enrichMovie(movie) });
  } catch (err) {
    console.error('Create movie error:', err);
    res.status(500).json({ error: err.message || 'Failed to create movie' });
  }
});

// PATCH /api/admin/movies/:id
app.patch('/api/admin/movies/:id', (req, res) => {
  try {
    const b = req.body;
    const id = parseInt(req.params.id);
    db.prepare(`
      UPDATE movies SET title=?, year=?, director=?, runtime=?, rated=?, imdb_rating=?, metascore=?,
        cast_names=?, writers=?, overview=?, tagline=?, poster_url=?, backdrop_url=?, trailer_url=?,
        actor_photos=?, photos=?, budget=?, revenue=?, release_date=?, language=?, country=?,
        streaming_links=?, trivia=?, quotes=?, did_you_know=?, awards=?
      WHERE id=?
    `).run(
      b.title, b.year, b.director, b.runtime || 120, b.rated || 'PG-13',
      b.imdb_rating || 0, b.metascore || null,
      b.cast || null, b.writers || null, b.overview, b.tagline || null,
      b.posterUrl || null, b.backdropUrl || null, b.trailerUrl || null,
      b.actorPhotos || null, b.photos || null,
      b.budget || null, b.revenue || null, b.release_date || null,
      b.language || 'English', b.country || 'USA',
      b.streamingLinks || null, b.trivia || null, b.quotes || null,
      b.didYouKnow || null, b.awards || null, id
    );

    db.prepare('DELETE FROM movie_genres WHERE movie_id = ?').run(id);
    if (b.genreIds && b.genreIds.length) {
      b.genreIds.filter(gid => gid && String(gid).length > 0).forEach(gid => {
        db.prepare('INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)').run(id, parseInt(gid));
      });
    }

    db.prepare('DELETE FROM movie_streaming WHERE movie_id = ?').run(id);
    if (b.streamingPlatforms && b.streamingPlatforms.length) {
      b.streamingPlatforms.forEach(sp => {
        if (sp.platformId) {
          db.prepare('INSERT OR IGNORE INTO movie_streaming (movie_id, platform_id, url) VALUES (?, ?, ?)').run(id, parseInt(sp.platformId), sp.url || null);
        }
      });
    }

    const movie = db.prepare('SELECT * FROM movies WHERE id = ?').get(id);
    res.json({ movie: enrichMovie(movie) });
  } catch (err) {
    console.error('Update movie error:', err);
    res.status(500).json({ error: err.message || 'Failed to update movie' });
  }
});

// DELETE /api/admin/movies/:id
app.delete('/api/admin/movies/:id', (req, res) => {
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM reviews WHERE movie_id = ?').run(id);
  db.prepare('DELETE FROM movie_genres WHERE movie_id = ?').run(id);
  db.prepare('DELETE FROM movies WHERE id = ?').run(id);
  res.json({ ok: true });
});

// GET /api/admin/reviews
app.get('/api/admin/reviews', (req, res) => {
  const { page = '1', limit = '15', search } = req.query;
  let query = 'SELECT r.*, m.title as movie_title, m.slug as movie_slug FROM reviews r LEFT JOIN movies m ON r.movie_id = m.id';
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push("(r.author LIKE ? OR r.content LIKE ? OR r.headline LIKE ?)");
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

  const countQ = query.replace('SELECT r.*, m.title as movie_title, m.slug as movie_slug', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQ).get(...params).count;

  query += ' ORDER BY r.created_at DESC';
  const lim = Math.min(parseInt(limit) || 15, 100);
  const pg = Math.max(parseInt(page) || 1, 1);
  query += ` LIMIT ? OFFSET ?`;
  params.push(lim, (pg - 1) * lim);

  const reviews = db.prepare(query).all(...params);

  res.json({
    reviews: reviews.map(r => ({
      id: String(r.id),
      movieId: String(r.movie_id),
      author: r.author,
      headline: r.headline,
      content: r.content,
      rating: r.rating,
      helpful: r.helpful,
      createdAt: r.created_at,
      movie: {
        id: String(r.movie_id),
        title: r.movie_title,
        slug: r.movie_slug,
      },
    })),
    totalPages: Math.ceil(total / lim),
    total,
    page: pg,
  });
});

// DELETE /api/admin/reviews/:id
app.delete('/api/admin/reviews/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const review = db.prepare('SELECT movie_id FROM reviews WHERE id = ?').get(id);
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);

  // Recalculate movie rating
  if (review) {
    const avg = db.prepare('SELECT AVG(rating) as avg_rating FROM reviews WHERE movie_id = ?').get(review.movie_id);
    db.prepare('UPDATE movies SET imdb_rating = ROUND(COALESCE(?, 0), 1) WHERE id = ?').run(avg?.avg_rating, review.movie_id);
  }

  res.json({ ok: true });
});

// GET /api/admin/genres
app.get('/api/admin/genres', (req, res) => {
  const genres = db.prepare('SELECT * FROM genres ORDER BY name').all();
  res.json({
    genres: genres.map(g => ({
      id: String(g.id),
      name: g.name,
      slug: g.slug,
      description: g.description,
    })),
  });
});

// ===== AUTH ROUTES =====

// POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { username, email, phone, password } = req.body;
  if (!username || !email || !phone || !password) {
    return res.status(400).json({ error: 'All fields are required (username, email, phone, password)' });
  }
  // Check duplicates
  const existing = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
  if (existing) {
    return res.status(400).json({ error: 'Username or email already exists' });
  }
  const avatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(username) + '&background=F5C518&color=000&bold=true&size=128';
  const result = db.prepare('INSERT INTO users (username, email, phone, password, avatar) VALUES (?, ?, ?, ?, ?)')
    .run(username, email, phone, password, avatar);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
  res.json({
    user: { id: String(user.id), username: user.username, email: user.email, phone: user.phone, avatar: user.avatar, createdAt: user.created_at }
  });
});

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE email = ? AND password = ?').get(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({
    user: { id: String(user.id), username: user.username, email: user.email, phone: user.phone, avatar: user.avatar, createdAt: user.created_at }
  });
});

// GET /api/auth/users - admin: list all users
app.get('/api/auth/users', (req, res) => {
  const { page = '1', limit = '20', search } = req.query;
  let query = 'SELECT * FROM users';
  const conditions = [];
  const params = [];
  if (search) {
    conditions.push('(username LIKE ? OR email LIKE ? OR phone LIKE ?)');
    const s = '%' + search + '%';
    params.push(s, s, s);
  }
  if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
  const countQ = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const total = db.prepare(countQ).get(...params).count;
  query += ' ORDER BY created_at DESC';
  const lim = Math.min(parseInt(limit) || 20, 100);
  const pg = Math.max(parseInt(page) || 1, 1);
  query += ' LIMIT ? OFFSET ?';
  params.push(lim, (pg - 1) * lim);
  const users = db.prepare(query).all(...params);
  res.json({
    users: users.map(u => ({ id: String(u.id), username: u.username, email: u.email, phone: u.phone, avatar: u.avatar, createdAt: u.created_at })),
    totalPages: Math.ceil(total / lim),
    total,
    page: pg,
  });
});

// DELETE /api/auth/users/:id
app.delete('/api/auth/users/:id', (req, res) => {
  db.prepare('DELETE FROM users WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

// ===== STREAMING PLATFORM ROUTES =====

// GET /api/admin/platforms
app.get('/api/admin/platforms', (req, res) => {
  const platforms = db.prepare('SELECT * FROM streaming_platforms ORDER BY name').all();
  res.json({
    platforms: platforms.map(p => ({
      id: String(p.id),
      name: p.name,
      logo: p.logo || '',
      website: p.website || '',
      createdAt: p.created_at,
    })),
  });
});

// POST /api/admin/platforms
app.post('/api/admin/platforms', (req, res) => {
  const { name, logo, website } = req.body;
  if (!name) return res.status(400).json({ error: 'Platform name is required' });
  try {
    const result = db.prepare('INSERT INTO streaming_platforms (name, logo, website) VALUES (?, ?, ?)')
      .run(name, logo || null, website || null);
    const platform = db.prepare('SELECT * FROM streaming_platforms WHERE id = ?').get(result.lastInsertRowid);
    res.json({
      platform: { id: String(platform.id), name: platform.name, logo: platform.logo || '', website: platform.website || '' }
    });
  } catch (e) {
    if (e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Platform name already exists' });
    }
    throw e;
  }
});

// PATCH /api/admin/platforms/:id
app.patch('/api/admin/platforms/:id', (req, res) => {
  const { name, logo, website } = req.body;
  const id = parseInt(req.params.id);
  db.prepare('UPDATE streaming_platforms SET name=?, logo=?, website=? WHERE id=?')
    .run(name, logo || null, website || null, id);
  const platform = db.prepare('SELECT * FROM streaming_platforms WHERE id = ?').get(id);
  res.json({
    platform: { id: String(platform.id), name: platform.name, logo: platform.logo || '', website: platform.website || '' }
  });
});

// DELETE /api/admin/platforms/:id
app.delete('/api/admin/platforms/:id', (req, res) => {
  db.prepare('DELETE FROM streaming_platforms WHERE id = ?').run(parseInt(req.params.id));
  res.json({ ok: true });
});

// ===== DOWNLOAD =====
const fs = require('fs');
app.get('/api/download', (req, res) => {
  const filePath = path.join(__dirname, '..', 'project-download.tar.gz');
  if (fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    res.writeHead(200, {
      'Content-Type': 'application/gzip',
      'Content-Disposition': 'attachment; filename="moviedb-project.tar.gz"',
      'Content-Length': stat.size,
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.status(404).json({ error: 'Download file not found' });
  }
});

const PORT = 3001;
app.listen(PORT, function() {
  console.log('MovieDB API running at http://localhost:' + PORT);
});
