const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'moviedb.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🎬 Seeding MovieDB database...');

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
    imdb_rating REAL,
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
    movie_id INTEGER, genre_id INTEGER,
    PRIMARY KEY (movie_id, genre_id),
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    author TEXT NOT NULL,
    headline TEXT,
    rating REAL NOT NULL,
    content TEXT,
    helpful INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS streaming_platforms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    logo TEXT,
    website TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS movie_streaming (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    platform_id INTEGER NOT NULL,
    url TEXT,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
    FOREIGN KEY (platform_id) REFERENCES streaming_platforms(id) ON DELETE CASCADE
  );
`);

// Migrate: add missing columns to existing databases
const moviesTable = db.prepare("PRAGMA table_info(movies)").all();
const moviesCols = moviesTable.map(c => c.name);
const missingCols = [
  { name: 'language', def: "'English'" },
  { name: 'country', def: "'USA'" },
  { name: 'streaming_links', def: 'NULL' },
  { name: 'trivia', def: 'NULL' },
  { name: 'quotes', def: 'NULL' },
  { name: 'did_you_know', def: 'NULL' },
  { name: 'awards', def: 'NULL' },
];
missingCols.forEach(col => {
  if (!moviesCols.includes(col.name)) {
    console.log(`  🔧 Adding missing column: ${col.name}`);
    db.exec(`ALTER TABLE movies ADD COLUMN ${col.name} TEXT DEFAULT ${col.def}`);
  }
});

if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='streaming_platforms'").get()) {
  console.log('  🔧 Creating streaming_platforms table');
  db.exec(`
    CREATE TABLE streaming_platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
if (!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='movie_streaming'").get()) {
  console.log('  🔧 Creating movie_streaming table');
  db.exec(`
    CREATE TABLE movie_streaming (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER NOT NULL,
      platform_id INTEGER NOT NULL,
      url TEXT,
      FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE,
      FOREIGN KEY (platform_id) REFERENCES streaming_platforms(id) ON DELETE CASCADE
    );
  `);
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
}

// Clear existing data
db.exec('DELETE FROM movie_genres');
db.exec('DELETE FROM reviews');
db.exec('DELETE FROM genres');
db.exec('DELETE FROM movies');

// Insert genres
const genres = ['Action','Adventure','Sci-Fi','Drama','Crime','Thriller','Comedy','Romance','Fantasy','Animation','Biography','History','War','Mystery','Horror','Western','Music'];
const insertGenre = db.prepare('INSERT INTO genres (name, slug) VALUES (?, ?)');
genres.forEach(g => insertGenre.run(g, slugify(g)));
console.log(`✅ Inserted ${genres.length} genres`);

const getGenreId = db.prepare('SELECT id FROM genres WHERE name = ?');

const movies = [
  {
    title: "The Shawshank Redemption", year: 1994, director: "Frank Darabont", runtime: 142, rated: "R", imdb_rating: 9.3, metascore: 82,
    cast_names: ["Tim Robbins", "Morgan Freeman", "Bob Gunton", "William Sadler"],
    writers: ["Stephen King", "Frank Darabont"],
    overview: "Over the course of several years, two convicts form a friendship, seeking consolation and eventual redemption through basic compassion.",
    tagline: "Fear can hold you prisoner. Hope can set you free.",
    poster_url: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    trailer_url: "https://www.youtube.com/watch?v=6hB3S9bIaco",
    genres: ["Drama"], budget: 25000000, revenue: 58300000, release_date: "1994-09-23",
    actor_photos: ["https://image.tmdb.org/t/p/w185/9rd0fGazCX3vrYP8fGwxaVr7DyH.jpg","https://image.tmdb.org/t/p/w185/oIciQWr8Vbti5MkQDxPaf3LrQgZ.jpg","https://image.tmdb.org/t/p/w185/fm6KqXy3xh8LrS0k5YBq10k5PzH.jpg","https://image.tmdb.org/t/p/w185/5IvK4yVj1h4yxCf9QqHfOZK5a5V.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg","https://image.tmdb.org/t/p/w780/3P3TQXk1234.jpg","https://image.tmdb.org/t/p/w780/56P3PN8s2345.jpg"],
    reviews: [
      { author: "CinemaFan", rating: 10, content: "A masterpiece of hope and resilience. Tim Robbins and Morgan Freeman deliver career-defining performances.", helpful: 45 },
      { author: "MovieBuff22", rating: 9.5, content: "The ending is one of the most satisfying in cinema history. Perfectly paced and beautifully shot.", helpful: 32 },
      { author: "FilmCritic_Pro", rating: 10, content: "This film transcends the prison genre. It's a profound meditation on friendship, hope, and the human spirit.", helpful: 28 },
    ]
  },
  {
    title: "The Dark Knight", year: 2008, director: "Christopher Nolan", runtime: 152, rated: "PG-13", imdb_rating: 9.0, metascore: 84,
    cast_names: ["Christian Bale", "Heath Ledger", "Aaron Eckhart", "Michael Caine"],
    writers: ["Jonathan Nolan", "Christopher Nolan"],
    overview: "When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
    tagline: "Why so serious?",
    poster_url: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911BTUgMe6r1xzh.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
    trailer_url: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    genres: ["Action", "Crime", "Drama"], budget: 185000000, revenue: 1005000000, release_date: "2008-07-18",
    actor_photos: ["https://image.tmdb.org/t/p/w185/7PzszfGrPgWmHq94uM0aWWfEYyT.jpg","https://image.tmdb.org/t/p/w185/5V0bJNfMCQ2MCCLlLDzIHfN0Lft.jpg","https://image.tmdb.org/t/p/w185/yFg88f878s05pMfB3bHlNPxqUx.jpg","https://image.tmdb.org/t/p/w185/bXNvKX7a3E9Gqg3tPnMYFm8F5Jg.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg","https://image.tmdb.org/t/p/w780/hZkgoQYus5dXo3H8T7F0w8E1aRd.jpg"],
    reviews: [
      { author: "BatmanFan99", rating: 10, content: "Heath Ledger's Joker is the greatest villain performance ever captured on film. Absolutely chilling.", helpful: 52 },
      { author: "ActionJunkie", rating: 9, content: "Christopher Nolan redefined the superhero genre with this one. The hospital scene is unforgettable.", helpful: 38 },
    ]
  },
  {
    title: "Inception", year: 2010, director: "Christopher Nolan", runtime: 148, rated: "PG-13", imdb_rating: 8.8, metascore: 74,
    cast_names: ["Leonardo DiCaprio", "Joseph Gordon-Levitt", "Elliot Page", "Tom Hardy"],
    writers: ["Christopher Nolan"],
    overview: "A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.",
    tagline: "Your mind is the scene of the crime.",
    poster_url: "https://image.tmdb.org/t/p/w500/ljsZTbVsrQSqZgWeep2B1QiDKuh.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    trailer_url: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    genres: ["Action", "Sci-Fi", "Thriller"], budget: 160000000, revenue: 836000000, release_date: "2010-07-16",
    actor_photos: ["https://image.tmdb.org/t/p/w185/wrkRdEc4K2DeI8j99LQH2F4wpjN.jpg","https://image.tmdb.org/t/p/w185/rdSH7BnGf8zQM8sLh00815k3f9x.jpg","https://image.tmdb.org/t/p/w185/fWvV16h4fYa8Xy36q6CZ0LjRw0o.jpg","https://image.tmdb.org/t/p/w185/xvTE0AkdG2VJOi3nEzT7Nz20e3P.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/s3TBrRGB1iav7gFOCNx3H31MoES.jpg","https://image.tmdb.org/t/p/w780/8dLJ7M7xgM4Z7V3L3XvJvFp8HwE.jpg"],
    reviews: [
      { author: "DreamerCritic", rating: 9, content: "Nolan's most ambitious film. The layered dream sequences are visually stunning and intellectually stimulating.", helpful: 41 },
    ]
  },
  {
    title: "The Godfather", year: 1972, director: "Francis Ford Coppola", runtime: 175, rated: "R", imdb_rating: 9.2, metascore: 100,
    cast_names: ["Marlon Brando", "Al Pacino", "James Caan", "Robert Duvall"],
    writers: ["Mario Puzo", "Francis Ford Coppola"],
    overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant youngest son.",
    tagline: "An offer you can't refuse.",
    poster_url: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1/tj8IOTD982h6S9QnFj2xI5E6Y3.jpg",
    trailer_url: "https://www.youtube.com/watch?v=UaVTIH8mujA",
    genres: ["Crime", "Drama"], budget: 7000000, revenue: 250000000, release_date: "1972-03-14",
    actor_photos: ["https://image.tmdb.org/t/p/w185/oF9nZ8eLhGSPFPnV182sPbC9F0y.jpg","https://image.tmdb.org/t/p/w185/huwPBVhbqMvG6EMLX8hFnazJbGA.jpg","https://image.tmdb.org/t/p/w185/3bR0R73Fv0B6TtEz8NcPp1aS0bK.jpg","https://image.tmdb.org/t/p/w185/lF0L7M5xY12B0g1WdN1v3M5bF6d.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/tj8IOTD982h6S9QnFj2xI5E6Y3.jpg"],
    reviews: [
      { author: "ClassicFilmFan", rating: 10, content: "The definitive American film. Brando and Pacino create characters that will live forever in cinema.", helpful: 67 },
    ]
  },
  {
    title: "Pulp Fiction", year: 1994, director: "Quentin Tarantino", runtime: 154, rated: "R", imdb_rating: 8.9, metascore: 95,
    cast_names: ["John Travolta", "Uma Thurman", "Samuel L. Jackson", "Bruce Willis"],
    writers: ["Quentin Tarantino", "Roger Avary"],
    overview: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
    tagline: "Just because you are a character doesn't mean you have character.",
    poster_url: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
    trailer_url: "https://www.youtube.com/watch?v=s7EdQ4FqbhY",
    genres: ["Crime", "Drama", "Thriller"], budget: 8000000, revenue: 214000000, release_date: "1994-10-14",
    actor_photos: ["https://image.tmdb.org/t/p/w185/sgxzT54GnvgeMnOZgpQQx9csAdd.jpg","https://image.tmdb.org/t/p/w185/j0BMLn2OMGP2x4KxjR1bIXm2r2d.jpg","https://image.tmdb.org/t/p/w185/fFv6fNsY8Mx89B3Qq7N2Z8j8C5X.jpg","https://image.tmdb.org/t/p/w185/8Y3sA1k75Ue9P0s6b5c2d1cFzU.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg"],
    reviews: [
      { author: "TarantinoFan", rating: 9, content: "Revolutionary storytelling. The nonlinear narrative was ahead of its time and still feels fresh today.", helpful: 44 },
    ]
  },
  {
    title: "Forrest Gump", year: 1994, director: "Robert Zemeckis", runtime: 142, rated: "PG-13", imdb_rating: 8.8, metascore: 82,
    cast_names: ["Tom Hanks", "Robin Wright", "Gary Sinise", "Sally Field"],
    writers: ["Eric Roth", "Winston Groom"],
    overview: "The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.",
    tagline: "Life is like a box of chocolates.",
    poster_url: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/qdIMHd4sEfJSckfVJfKQvisL02a.jpg",
    trailer_url: "https://www.youtube.com/watch?v=bLvq392IET0",
    genres: ["Drama", "Comedy", "Romance"], budget: 55000000, revenue: 677000000, release_date: "1994-07-06",
    actor_photos: ["https://image.tmdb.org/t/p/w185/xndWFsBlXO0x7tGrlT2TVolhUv7.jpg","https://image.tmdb.org/t/p/w185/e1J27NfMh8a4Mg5Dk2xO8gG4F0s.jpg","https://image.tmdb.org/t/p/w185/6w6TXPe08C6b2M9Ll06p02P3aPq.jpg","https://image.tmdb.org/t/p/w185/eOYpMjpM1K7lY3J4DfOIP0g4S2u.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/qdIMHd4sEfJSckfVJfKQvisL02a.jpg"],
    reviews: [
      { author: "FeelGoodViewer", rating: 9, content: "Tom Hanks gives a once-in-a-generation performance. Funny, touching, and endlessly rewatchable.", helpful: 56 },
    ]
  },
  {
    title: "Fight Club", year: 1999, director: "David Fincher", runtime: 139, rated: "R", imdb_rating: 8.8, metascore: 66,
    cast_names: ["Brad Pitt", "Edward Norton", "Helena Bonham Carter", "Meat Loaf"],
    writers: ["Chuck Palahniuk", "Jim Uhls"],
    overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club that evolves into much more.",
    tagline: "Mischief. Mayhem. Soap.",
    poster_url: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QI4S2t0POoT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/rrwEMRNMfHBj2mLzAiL5DvGz4v.jpg",
    trailer_url: "https://www.youtube.com/watch?v=SUXWAEX2jlg",
    genres: ["Drama", "Thriller"], budget: 63000000, revenue: 100900000, release_date: "1999-10-15",
    actor_photos: ["https://image.tmdb.org/t/p/w185/oTB7GMI91le5gBNf7688s7g3q2n.jpg","https://image.tmdb.org/t/p/w185/8FG20YnR2s0e4a0nQ4fFJWLPyM.jpg","https://image.tmdb.org/t/p/w185/i4kJ0vJ4GpVnRa0R2d94rKB3c3k.jpg","https://image.tmdb.org/t/p/w185/aWdH1n0pA1G9l4j2X5k7P5nH4R0.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/rrwEMRNMfHBj2mLzAiL5DvGz4v.jpg"],
    reviews: [
      { author: "CultClassicFan", rating: 9, content: "The twist ending recontextualizes everything. A biting satire of consumer culture wrapped in a Fight movie.", helpful: 39 },
    ]
  },
  {
    title: "The Matrix", year: 1999, director: "Lana Wachowski, Lilly Wachowski", runtime: 136, rated: "R", imdb_rating: 8.7, metascore: 73,
    cast_names: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss", "Hugo Weaving"],
    writers: ["Lilly Wachowski", "Lana Wachowski"],
    overview: "When a beautiful stranger leads computer hacker Neo to a forbidding underworld, he discovers the shocking truth — the life he knows is the elaborate deception of an evil cyber-intelligence.",
    tagline: "Welcome to the Real World.",
    poster_url: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg",
    trailer_url: "https://www.youtube.com/watch?v=vKQi3bBA1y8",
    genres: ["Action", "Sci-Fi"], budget: 63000000, revenue: 467000000, release_date: "1999-03-31",
    actor_photos: ["https://image.tmdb.org/t/p/w185/4D0PpnNIk0Y7i8ThBjE8VpI2krH.jpg","https://image.tmdb.org/t/p/w185/8nDx364zVJlCbH721eyJv3mVfS.jpg","https://image.tmdb.org/t/p/w185/nZd9xpV3a8ydEJzjV4E7L8J6F1A.jpg","https://image.tmdb.org/t/p/w185/mMrnIYpGfDfRtZ3p5bS3mH3E0zq.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg"],
    reviews: [
      { author: "SciFiAddict", rating: 10, content: "Changed cinema forever. The bullet-time effect, the philosophy, the action — a perfect sci-fi film.", helpful: 51 },
    ]
  },
  {
    title: "Interstellar", year: 2014, director: "Christopher Nolan", runtime: 169, rated: "PG-13", imdb_rating: 8.7, metascore: 74,
    cast_names: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain", "Michael Caine"],
    writers: ["Jonathan Nolan", "Christopher Nolan"],
    overview: "When Earth becomes uninhabitable in the future, a farmer and ex-NASA pilot is tasked with piloting a spacecraft to find a new planet for humanity.",
    tagline: "Mankind was born on Earth. It was never meant to die here.",
    poster_url: "https://image.tmdb.org/t/p/w500/gEU2QniL6Eol865BxXe2VYzsCzz.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/xJHokMbljvjADYdit5fK1Dho0Xx.jpg",
    trailer_url: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    genres: ["Sci-Fi", "Drama", "Adventure"], budget: 165000000, revenue: 675000000, release_date: "2014-11-07",
    actor_photos: ["https://image.tmdb.org/t/p/w185/wJiGed0Y1vuH0gJd6V3Qvh8J5rM.jpg","https://image.tmdb.org/t/p/w185/s6tIh4eTdAinTE3HkO1hXxK1d9i.jpg","https://image.tmdb.org/t/p/w185/y2aKBAUJ997b0Yp4s69Tl6XbL0R.jpg","https://image.tmdb.org/t/p/w185/bXNvKX7a3E9Gqg3tPnMYFm8F5Jg.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/xJHokMbljvjADYdit5fK1Dho0Xx.jpg"],
    reviews: [
      { author: "SpaceExplorer", rating: 10, content: "The docking scene alone is worth the price of admission. McConaughey's performance is heartbreaking.", helpful: 47 },
    ]
  },
  {
    title: "The Lord of the Rings: The Return of the King", year: 2003, director: "Peter Jackson", runtime: 201, rated: "PG-13", imdb_rating: 9.0, metascore: 94,
    cast_names: ["Elijah Wood", "Viggo Mortensen", "Ian McKellen", "Orlando Bloom"],
    writers: ["J.R.R. Tolkien", "Fran Walsh", "Philippa Boyens"],
    overview: "Gandalf and Aragorn lead the World of Men against Sauron's army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.",
    tagline: "The eye of the enemy is moving.",
    poster_url: "https://image.tmdb.org/t/p/w500/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/pm0RiwNpSja8gR0BTWpxo5a9Bbl.jpg",
    trailer_url: "https://www.youtube.com/watch?v=r5XhFNVQING",
    genres: ["Fantasy", "Adventure", "Drama"], budget: 94000000, revenue: 1146000000, release_date: "2003-12-17",
    actor_photos: ["https://image.tmdb.org/t/p/w185/7D3EzI7qjHxhOGJn1e3fF9g5c8.jpg","https://image.tmdb.org/t/p/w185/2Vu2mSot8G6Q25J2145eTy3JQqK.jpg","https://image.tmdb.org/t/p/w185/5hGMb5nZHv9bZ98W9GxQ6vJLHl.jpg","https://image.tmdb.org/t/p/w185/5cEa9W3c0K3yC6wR6c5Qb4HxH1j.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/pm0RiwNpSja8gR0BTWpxo5a9Bbl.jpg"],
    reviews: [
      { author: "MiddleEarthFan", rating: 10, content: "The greatest ending to the greatest trilogy. The coronation scene makes me cry every single time.", helpful: 58 },
    ]
  },
  {
    title: "Goodfellas", year: 1990, director: "Martin Scorsese", runtime: 146, rated: "R", imdb_rating: 8.7, metascore: 90,
    cast_names: ["Robert De Niro", "Ray Liotta", "Joe Pesci", "Lorraine Bracco"],
    writers: ["Nicholas Pileggi", "Martin Scorsese"],
    overview: "The story of Henry Hill and his life in the mob, covering his relationship with his wife and his mob partners Jimmy Conway and Tommy DeVito.",
    tagline: "As far back as I can remember, I always wanted to be a gangster.",
    poster_url: "https://image.tmdb.org/t/p/w500/aKuFiU82b2Yr7j4lQ0bp4q1R5c3.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/6CB5VKvJcY6xGfPFJlwX3JQ3BpC.jpg",
    trailer_url: "https://www.youtube.com/watch?v=qo5T3PzQZ9U",
    genres: ["Crime", "Drama", "Biography"], budget: 25000000, revenue: 468000000, release_date: "1990-09-12",
    actor_photos: ["https://image.tmdb.org/t/p/w185/cT8htcKvhofbRPNfAAl5gn1YcAn.jpg","https://image.tmdb.org/t/p/w185/xT9Xb18bMnF7G0K5vB3s9V8fH0F.jpg","https://image.tmdb.org/t/p/w185/vX2TqWqN9W5P1pG4b3a2YF3H2qM.jpg","https://image.tmdb.org/t/p/w185/aWn2r8f5J6Wq8cKXvJ8V9v7vF3c.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/6CB5VKvJcY6xGfPFJlwX3JQ3BpC.jpg"],
    reviews: [
      { author: "ScorseseStan", rating: 10, content: "The Copacabana tracking shot is cinema perfection. Liotta narrates like a poet of the streets.", helpful: 43 },
    ]
  },
  {
    title: "The Silence of the Lambs", year: 1991, director: "Jonathan Demme", runtime: 118, rated: "R", imdb_rating: 8.6, metascore: 95,
    cast_names: ["Jodie Foster", "Anthony Hopkins", "Lawrence A. Bonney", "Kasi Lemmons"],
    writers: ["Thomas Harris", "Ted Tally"],
    overview: "A young F.B.I. cadet must receive the help of an incarcerated and manipulative cannibal killer to help catch another serial killer.",
    tagline: "To enter the mind of a killer she must challenge the mind of a madman.",
    poster_url: "https://image.tmdb.org/t/p/w500/uPipelineSQ3Mm2Fy2409S3N0Xz3dR.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/bxwKC4qAbOBMjLU3SkSFRnhMOEq.jpg",
    trailer_url: "https://www.youtube.com/watch?v=W6a0nLp4p3A",
    genres: ["Thriller", "Crime", "Horror"], budget: 19000000, revenue: 272000000, release_date: "1991-02-14",
    actor_photos: ["https://image.tmdb.org/t/p/w185/yK9sMt3VJfEj1MPNR8FfZJQ3Wc.jpg","https://image.tmdb.org/t/p/w185/sM33SANp91t6tOQ1fDq4jJ4Vb0d.jpg","https://image.tmdb.org/t/p/w185/3kL1sJl3e2m5c3K5X6a7b8d9F0g.jpg","https://image.tmdb.org/t/p/w185/bW3Xw6nQp9d8X8k9Y7z6V5t4S3.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/bxwKC4qABOBMjLU3SkSFRnhMOEq.jpg"],
    reviews: [
      { author: "ThrillerKing", rating: 10, content: "Anthony Hopkins is on screen for barely 16 minutes and steals the entire film. Terrifying and elegant.", helpful: 49 },
    ]
  },
  {
    title: "Gladiator", year: 2000, director: "Ridley Scott", runtime: 155, rated: "R", imdb_rating: 8.5, metascore: 67,
    cast_names: ["Russell Crowe", "Joaquin Phoenix", "Connie Nielsen", "Oliver Reed"],
    writers: ["David Franzoni", "John Logan", "William Nicholson"],
    overview: "A former Roman General sets out to exact vengeance against the corrupt emperor who murdered his family and sent him into slavery.",
    tagline: "A Hero Will Rise.",
    poster_url: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgC5fE.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/hQ4pYsIbP22TWXj0dCnMmJ6MbSN.jpg",
    trailer_url: "https://www.youtube.com/watch?v=owK1khxDlD4",
    genres: ["Action", "Drama", "History"], budget: 103000000, revenue: 460000000, release_date: "2000-05-05",
    actor_photos: ["https://image.tmdb.org/t/p/w185/3ihE3VXaOA2rPYBnAf38KdFB9sC.jpg","https://image.tmdb.org/t/p/w185/nmLBEtKo9bXJjB9Mz6cVf4j3r1K.jpg","https://image.tmdb.org/t/p/w185/j3tY8K3xW8D3Y6mK5P1G6B9v0c4.jpg","https://image.tmdb.org/t/p/w185/9jN3kK7o9D2w6X5Y7V8U1c3b4f5.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/hQ4pYsIbP22TWXj0dCnMmJ6MbSN.jpg"],
    reviews: [
      { author: "EpicMovieFan", rating: 9, content: "The 'Are you not entertained?' scene is iconic. Crowe gives his career-best performance.", helpful: 41 },
    ]
  },
  {
    title: "Schindler's List", year: 1993, director: "Steven Spielberg", runtime: 195, rated: "R", imdb_rating: 9.0, metascore: 95,
    cast_names: ["Liam Neeson", "Ben Kingsley", "Ralph Fiennes", "Caroline Goodall"],
    writers: ["Thomas Keneally", "Steven Zaillian"],
    overview: "In German-occupied Poland during World War II, industrialist Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.",
    tagline: "Whoever saves one life, saves the world entire.",
    poster_url: "https://image.tmdb.org/t/p/w500/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/bV8Ivto8lfW2Xz3L3dDzN6YVp5H.jpg",
    trailer_url: "https://www.youtube.com/watch?v=gG22XJkmUO0",
    genres: ["Drama", "Biography", "History"], budget: 22000000, revenue: 322000000, release_date: "1993-12-15",
    actor_photos: ["https://image.tmdb.org/t/p/w185/5YtYJ221f5j1m8h3J8t7KpC3FwV.jpg","https://image.tmdb.org/t/p/w185/6aYcD2h8jR6T6zK1hP6z8R4V3n2.jpg","https://image.tmdb.org/t/p/w185/qk6W7g8u3aPn5f9Cj3t2bH0d8x.jpg","https://image.tmdb.org/t/p/w185/7G32q5w3X3R4t5y6U7I8O9P0q1S.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/bV8Ivto8lfW2Xz3L3dDzN6YVp5H.jpg"],
    reviews: [
      { author: "HistoryBuff", rating: 10, content: "The most important film ever made. The girl in the red coat scene will haunt you forever.", helpful: 62 },
    ]
  },
  {
    title: "Saving Private Ryan", year: 1998, director: "Steven Spielberg", runtime: 169, rated: "R", imdb_rating: 8.6, metascore: 91,
    cast_names: ["Tom Hanks", "Matt Damon", "Tom Sizemore", "Edward Burns"],
    writers: ["Robert Rodat"],
    overview: "Following the Normandy Landings, a group of U.S. soldiers go behind enemy lines to retrieve a paratrooper whose brothers have been killed in action.",
    tagline: "The mission is a man.",
    poster_url: "https://image.tmdb.org/t/p/w500/mEtZWi2ih38pF064C3bE2JYjE2k.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/wVnGQn5Qm6L9V3gGwN2s3h3L4hO.jpg",
    trailer_url: "https://www.youtube.com/watch?v=zwhP5b4tD6g",
    genres: ["War", "Drama"], budget: 70000000, revenue: 482000000, release_date: "1998-07-24",
    actor_photos: ["https://image.tmdb.org/t/p/w185/xndWFsBlXO0x7tGrlT2TVolhUv7.jpg","https://image.tmdb.org/t/p/w185/BzN043naPbCxVVz3D2J0k8lM8x.jpg","https://image.tmdb.org/t/p/w185/2s5Jq4n4e5bG6R6h3C5D7V8B9N0.jpg","https://image.tmdb.org/t/p/w185/3t5X4z5L6V7N8W9X0Y1Z2A3B4C5.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/wVnGQn5Qm6L9V3gGwN2s3h3L4hO.jpg"],
    reviews: [
      { author: "WarMovieFan", rating: 10, content: "The Omaha Beach landing is the most realistic battle sequence ever filmed. Absolutely harrowing.", helpful: 55 },
    ]
  },
  {
    title: "The Green Mile", year: 1999, director: "Frank Darabont", runtime: 189, rated: "R", imdb_rating: 8.6, metascore: 61,
    cast_names: ["Tom Hanks", "Michael Clarke Duncan", "David Morse", "Bonnie Hunt"],
    writers: ["Stephen King", "Frank Darabont"],
    overview: "The lives of guards on death row are affected by one of their charges: a gentle giant with a mysterious gift.",
    tagline: "Miracles do happen.",
    poster_url: "https://image.tmdb.org/t/p/w500/vel0sRh5Hgq1jRCK4bGT9rHvZmr.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/p4R4H0rE2k8a9Z7Yq3K5Z5T5T5T.jpg",
    trailer_url: "https://www.youtube.com/watch?v=Ki4zEj65KtY",
    genres: ["Drama", "Fantasy", "Crime"], budget: 60000000, revenue: 286000000, release_date: "1999-12-10",
    actor_photos: ["https://image.tmdb.org/t/p/w185/xndWFsBlXO0x7tGrlT2TVolhUv7.jpg","https://image.tmdb.org/t/p/w185/8aB29M98X8H5Y7G6V5X4W3V2U1.jpg","https://image.tmdb.org/t/p/w185/9Y4P6Q5T7U8I9O0P1A2S3D4F5G6.jpg","https://image.tmdb.org/t/p/w185/1H2J3K4L5Z6X7C8V9B0N1M2Q3W4.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/p4R4H0rE2k8a9Z7Yq3K5Z5T5T5T.jpg"],
    reviews: [
      { author: "DramaQueen", rating: 9, content: "Michael Clarke Duncan deserved that Oscar. One of the most moving films about compassion and injustice.", helpful: 37 },
    ]
  },
  {
    title: "The Departed", year: 2006, director: "Martin Scorsese", runtime: 151, rated: "R", imdb_rating: 8.5, metascore: 85,
    cast_names: ["Leonardo DiCaprio", "Matt Damon", "Jack Nicholson", "Mark Wahlberg"],
    writers: ["William Monahan", "Alan Mak", "Felix Chong"],
    overview: "An undercover cop and a mole in the police attempt to identify each other while infiltrating an Irish gang in South Boston.",
    tagline: "Cops or criminals. When you're facing a loaded gun, what's the difference?",
    poster_url: "https://image.tmdb.org/t/p/w500/nTtv7VHsV3MU2eKx4aFjh3jw6r2.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg",
    trailer_url: "https://www.youtube.com/watch?v=iKqGXeX9LhQ",
    genres: ["Crime", "Drama", "Thriller"], budget: 90000000, revenue: 291000000, release_date: "2006-10-06",
    actor_photos: ["https://image.tmdb.org/t/p/w185/wJiGed0Y1vuH0gJd6V3Qvh8J5rM.jpg","https://image.tmdb.org/t/p/w185/BzN043naPbCxVVz3D2J0k8lM8x.jpg","https://image.tmdb.org/t/p/w185/7Bd4EUOqQDKZXA6Od5gYv3kHmDq.jpg","https://image.tmdb.org/t/p/w185/8QdZ1pYr2C8e7J4T5R6Y7U8I9O0.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg"],
    reviews: [
      { author: "BostonIrish", rating: 9, content: "Jack Nicholson at his most unhinged. The ending will leave you speechless.", helpful: 34 },
    ]
  },
  {
    title: "Whiplash", year: 2014, director: "Damien Chazelle", runtime: 107, rated: "R", imdb_rating: 8.5, metascore: 89,
    cast_names: ["Miles Teller", "J.K. Simmons", "Paul Reiser", "Melissa Benoist"],
    writers: ["Damien Chazelle"],
    overview: "A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student's potential.",
    tagline: "The road to greatness can take you to the edge.",
    poster_url: "https://image.tmdb.org/t/p/w500/7fn624j544nwdf1DzMdCnLz7Luv.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/s3TBrRGB1iav7gFOCNx3H31MoES.jpg",
    trailer_url: "https://www.youtube.com/watch?v=7d_jQycdQGo",
    genres: ["Drama", "Music"], budget: 3300000, revenue: 49000000, release_date: "2014-10-10",
    actor_photos: ["https://image.tmdb.org/t/p/w185/5qG1n91Ck2kM8N6P3T8J5R6Y7U8.jpg","https://image.tmdb.org/t/p/w185/5G4xL8D2p5Wn6hX7Y8Z9A0B1C2D.jpg","https://image.tmdb.org/t/p/w185/3E4F5G6H7I8J9K0L1M2N3O4P5Q.jpg","https://image.tmdb.org/t/p/w185/6R7S8T9U0V1W2X3Y4Z5A6B7C8D.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/s3TBrRGB1iav7gFOCNx3H31MoES.jpg"],
    reviews: [
      { author: "MusicLover", rating: 10, content: "J.K. Simmons is absolutely terrifying. The final drumming scene is one of the greatest sequences in film.", helpful: 46 },
    ]
  },
  {
    title: "Django Unchained", year: 2012, director: "Quentin Tarantino", runtime: 165, rated: "R", imdb_rating: 8.5, metascore: 81,
    cast_names: ["Jamie Foxx", "Christoph Waltz", "Leonardo DiCaprio", "Samuel L. Jackson"],
    writers: ["Quentin Tarantino"],
    overview: "With the help of a German bounty hunter, a freed slave sets out to rescue his wife from a brutal Mississippi plantation owner.",
    taglife: "Life, liberty and the pursuit of vengeance.",
    poster_url: "https://image.tmdb.org/t/p/w500/bKg2v2EjB9nA0a6Q4s2P6j4W6K6.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg",
    trailer_url: "https://www.youtube.com/watch?v=0f4ItwT2mFc",
    genres: ["Drama", "Western"], budget: 100000000, revenue: 426000000, release_date: "2012-12-25",
    actor_photos: ["https://image.tmdb.org/t/p/w185/7Q7eJ8Z5Y5T6U7I8J9K0L1M2N3.jpg","https://image.tmdb.org/t/p/w185/4H5J6I7K8L9M0N1O2P3Q4R5S6T.jpg","https://image.tmdb.org/t/p/w185/wJiGed0Y1vuH0gJd6V3Qvh8J5rM.jpg","https://image.tmdb.org/t/p/w185/fFv6fNsY8Mx89B3Qq7N2Z8j8C5X.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg"],
    reviews: [
      { author: "TarantinoHead", rating: 9, content: "Christoph Waltz steals the movie as usual. The Candie dinner scene is pure tension.", helpful: 36 },
    ]
  },
  {
    title: "The Pianist", year: 2002, director: "Roman Polanski", runtime: 150, rated: "R", imdb_rating: 8.5, metascore: 85,
    cast_names: ["Adrien Brody", "Thomas Kretschmann", "Frank Finlay", "Emilia Fox"],
    writers: ["Ronald Harwood", "Władysław Szpilman"],
    overview: "A Polish musician struggles to survive the destruction of the Warsaw ghetto of World War II.",
    tagline: "In September 1939, Warsaw fell. The war for survival had just begun.",
    poster_url: "https://image.tmdb.org/t/p/w500/r6S4LBh5wV2bO3rC4w5R6D3Q8N8.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg",
    trailer_url: "https://www.youtube.com/watch?v=TG9W3NfIuXk",
    genres: ["Drama", "Biography", "War"], budget: 35000000, revenue: 120000000, release_date: "2002-09-24",
    actor_photos: ["https://image.tmdb.org/t/p/w185/5T6U7I8J9K0L1M2N3O4P5Q6R7S.jpg","https://image.tmdb.org/t/p/w185/6U7V8I9J0K1L2M3N4O5P6Q7R8S.jpg","https://image.tmdb.org/t/p/w185/7V8W9I0J1K2L3M4N5O6P7Q8R9S.jpg","https://image.tmdb.org/t/p/w185/8W9X0I1J2K3L4M5N6O7P8Q9R0S.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg"],
    reviews: [
      { author: "OscarBuzz", rating: 9, content: "Adrien Brody's performance is absolutely mesmerizing. A hauntingly beautiful survival story.", helpful: 31 },
    ]
  },
  {
    title: "Inglourious Basterds", year: 2009, director: "Quentin Tarantino", runtime: 153, rated: "R", imdb_rating: 8.4, metascore: 69,
    cast_names: ["Brad Pitt", "Mélanie Laurent", "Christoph Waltz", "Michael Fassbender"],
    writers: ["Quentin Tarantino"],
    overview: "In Nazi-occupied France during World War II, a plan to assassinate Nazi leaders by a group of Jewish U.S. soldiers coincides with a theatre owner's vengeful plans.",
    tagline: "Once upon a time in Nazi-occupied France...",
    poster_url: "https://image.tmdb.org/t/p/w500/aizyk6c1nG01Tf1v2X9x2eVz4r4.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg",
    trailer_url: "https://www.youtube.com/watch?v=KnrRy6kSFF0",
    genres: ["Drama", "War"], budget: 75000000, revenue: 321000000, release_date: "2009-08-21",
    actor_photos: ["https://image.tmdb.org/t/p/w185/oTB7GMI91le5gBNf7688s7g3q2n.jpg","https://image.tmdb.org/t/p/w185/1N2J3K4L5Z6X7C8V9B0N1M2Q3.jpg","https://image.tmdb.org/t/p/w185/4H5J6I7K8L9M0N1O2P3Q4R5S6.jpg","https://image.tmdb.org/t/p/w185/5I6J7K8L9M0N1O2P3Q4R5S6T7.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/3PfUX37z6T6dMh69W3hT3Q4q2X.jpg"],
    reviews: [
      { author: "TarantinoFan2", rating: 9, content: "Christoph Waltz earned every award for Hans Landa. The opening scene is a masterclass in tension.", helpful: 33 },
    ]
  },
  {
    title: "Parasite", year: 2019, director: "Bong Joon-ho", runtime: 132, rated: "R", imdb_rating: 8.5, metascore: 96,
    cast_names: ["Song Kang-ho", "Lee Sun-kyun", "Cho Yeo-jeong", "Choi Woo-shik"],
    writers: ["Bong Joon-ho", "Jin Won Han"],
    overview: "Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.",
    tagline: "Act like you own the place.",
    poster_url: "https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg",
    backdrop_url: "https://image.tmdb.org/t/p/w1280/TU97y1bF6d8V2V6s1bF6h5W6T3.jpg",
    trailer_url: "https://www.youtube.com/watch?v=5xH0HfJHsaY",
    genres: ["Drama", "Thriller"], budget: 15500000, revenue: 263000000, release_date: "2019-10-11",
    actor_photos: ["https://image.tmdb.org/t/p/w185/1I2J3K4L5Z6X7C8V9B0N1M2Q3.jpg","https://image.tmdb.org/t/p/w185/2J3K4L5M6N7O8P9Q0R1S2T3U.jpg","https://image.tmdb.org/t/p/w185/3K4L5M6N7O8P9Q0R1S2T3U4V.jpg","https://image.tmdb.org/t/p/w185/4L5M6N7O8P9Q0R1S2T3U4V5W.jpg"],
    photos: ["https://image.tmdb.org/t/p/w780/TU97y1bF6d8V2V6s1bF6h5W6T3.jpg"],
    reviews: [
      { author: "WorldCinema", rating: 10, content: "Bong Joon-ho made history. The genre shifts are seamless and the social commentary is razor-sharp.", helpful: 48 },
    ]
  },
];

const insertMovie = db.prepare(`
  INSERT INTO movies (title, slug, year, director, runtime, rated, imdb_rating, metascore,
    cast_names, writers, overview, tagline, poster_url, backdrop_url, trailer_url,
    actor_photos, photos, budget, revenue, release_date, language, country)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMovieGenre = db.prepare('INSERT OR IGNORE INTO movie_genres (movie_id, genre_id) VALUES (?, ?)');
const insertReview = db.prepare('INSERT INTO reviews (movie_id, author, rating, content, helpful) VALUES (?, ?, ?, ?, ?)');

const insertAll = db.transaction(() => {
  movies.forEach(movie => {
    const slug = slugify(movie.title) + '-' + movie.year;
    const result = insertMovie.run(
      movie.title, slug, movie.year, movie.director, movie.runtime, movie.rated, movie.imdb_rating, movie.metascore,
      JSON.stringify(movie.cast_names || []), JSON.stringify(movie.writers || []),
      movie.overview, movie.tagline || '', movie.poster_url, movie.backdrop_url, movie.trailer_url,
      JSON.stringify(movie.actor_photos || []), JSON.stringify(movie.photos || []),
      movie.budget, movie.revenue, movie.release_date, 'English', 'USA'
    );

    const movieId = result.lastInsertRowid;
    (movie.genres || []).forEach(genreName => {
      const g = getGenreId.get(genreName);
      if (g) insertMovieGenre.run(movieId, g.id);
    });

    (movie.reviews || []).forEach(rev => {
      insertReview.run(movieId, rev.author, rev.rating, rev.content, rev.helpful || 0);
    });
  });
});

insertAll();

const counts = {
  movies: db.prepare('SELECT COUNT(*) as c FROM movies').get().c,
  reviews: db.prepare('SELECT COUNT(*) as c FROM reviews').get().c,
  genres: db.prepare('SELECT COUNT(*) as c FROM genres').get().c,
};

console.log(`✅ Seeded ${counts.movies} movies, ${counts.reviews} reviews, ${counts.genres} genres`);
console.log('🎬 Database ready! Run: npm run dev');
db.close();
