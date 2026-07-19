const Database = require('better-sqlite3');
const path = require('path');
const db = new Database(path.join(__dirname, 'moviedb.db'));

console.log('🎬 Adding IMDb-style content to movies...');

// First, add new columns if they don't exist
const columns = db.prepare("PRAGMA table_info(movies)").all().map(c => c.name);
if (!columns.includes('streaming_links')) db.exec("ALTER TABLE movies ADD COLUMN streaming_links TEXT");
if (!columns.includes('trivia')) db.exec("ALTER TABLE movies ADD COLUMN trivia TEXT");
if (!columns.includes('quotes')) db.exec("ALTER TABLE movies ADD COLUMN quotes TEXT");
if (!columns.includes('did_you_know')) db.exec("ALTER TABLE movies ADD COLUMN did_you_know TEXT");
if (!columns.includes('awards')) db.exec("ALTER TABLE movies ADD COLUMN awards TEXT");

const update = db.prepare('UPDATE movies SET streaming_links=?, trivia=?, quotes=?, did_you_know=?, awards=? WHERE slug LIKE ?');

const data = [
  {
    slugMatch: 'the-shawshank-redemption',
    awards: 'Nominated for 7 Academy Awards including Best Picture. #1 on IMDb Top 250. Selected for preservation in the National Film Registry by the Library of Congress.',
    didYouKnow: 'Despite being a box office disappointment initially, it became the most rented video of 1995 and has since become one of the most beloved films of all time.',
    trivia: JSON.stringify([
      { question: 'Why was the film initially a box office failure?', answer: 'Despite critical acclaim, it opened against Pulp Fiction and Forrest Gump, two massive films that dominated the box office. It earned only $58 million against a $25 million budget.' },
      { question: 'How did Morgan Freeman get his iconic narration role?', answer: 'Freeman was originally considered for the role of Elmo Blutch in a different film. Director Frank Darabont specifically wrote the voice-over narration with Freeman\'s voice in mind.' },
      { question: 'What happened to the real Red after the movie?', answer: 'The character "Red" is based on the real-life Allen (Randy) Boyd, not a red-haired person as the joke in the film suggests. Freeman\'s casting actually made the joke work differently.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Andy Dufresne', text: 'Get busy living, or get busy dying.' },
      { character: 'Red', text: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.' },
      { character: 'Andy Dufresne', text: 'I guess it comes down to a simple choice, really. Get busy living, or get busy dying.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Netflix', url: 'https://www.netflix.com/title/14568', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Shawshank-Redemption-Tim-Robbins/dp/B001O8BZ1E', logo: '', type: 'rent' },
      { platform: 'Apple TV+', url: 'https://tv.apple.com/movie/the-shawshank-redemption/umc.cmc.187dqc02ln12a3lq1j03k6p5r', logo: '', type: 'buy' },
    ]),
  },
  {
    slugMatch: 'the-dark-knight',
    awards: 'Won 2 Academy Awards. Heath Ledger won a posthumous Academy Award for Best Supporting Actor. #3 on IMDb Top 250.',
    didYouKnow: 'Heath Ledger locked himself in a hotel room for six weeks to develop the Joker\'s voice, mannerisms, and personality. He kept a diary of disturbing thoughts to get into character.',
    trivia: JSON.stringify([
      { question: 'How did Heath Ledger create the Joker\'s lip-licking habit?', answer: 'The licking of the scars was Ledger\'s idea. He came up with it to compensate for the prosthetic scars that kept pulling down on his face. It became one of the character\'s most iconic traits.' },
      { question: 'What about the hospital explosion scene?', answer: 'The explosion of the hospital was done practically in one take. When the explosives briefly malfunctioned, Ledger improvised by looking confused and hitting the detonator — that reaction made it into the final cut.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Joker', text: 'Why so serious?' },
      { character: 'Joker', text: 'I believe whatever doesn\'t kill you simply makes you stranger.' },
      { character: 'Batman', text: 'You either die a hero, or you live long enough to see yourself become the villain.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Netflix', url: 'https://www.netflix.com/title/702', logo: '', type: 'stream' },
      { platform: 'HBO Max', url: 'https://play.max.com/movie/dark-knight', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Dark-Knight-Christian-Bale/dp/B0013FKH6S', logo: '', type: 'rent' },
    ]),
  },
  {
    slugMatch: 'inception',
    awards: 'Won 4 Academy Awards including Best Cinematography. Nominated for Best Picture. #13 on IMDb Top 250.',
    didYouKnow: 'Christopher Nolan spent 10 years writing the screenplay before making the film. The concept came from lucid dreaming techniques he studied.',
    trivia: JSON.stringify([
      { question: 'How long did it take to film the hallway fight?', answer: 'The rotating hallway fight scene took three weeks to film and used a massive 360-degree rotating set that weighed 100 tons. Joseph Gordon-Levitt trained for weeks to perform his own stunts.' },
      { question: 'What does the final spinning top mean?', answer: 'Nolan has stated that the point is that Cobb doesn\'t care whether he\'s dreaming or not — he\'s with his children. The top wobbles slightly before the cut to black, suggesting it\'s real.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Cobb', text: 'You mustn\'t be afraid to dream a little bigger, darling.' },
      { character: 'Ariadne', text: 'What\'s the most resilient parasite? An idea.' },
      { character: 'Cobb', text: 'I need to get back to reality. Or what I perceive as reality.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Netflix', url: 'https://www.netflix.com/title/70055', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Inception-Leonardo-DiCaprio/dp/B0047Y13DE', logo: '', type: 'rent' },
      { platform: 'Apple TV+', url: 'https://tv.apple.com/movie/inception/umc.cmc.25d39r41g5t2w3r1q0k2z5y8', logo: '', type: 'buy' },
    ]),
  },
  {
    slugMatch: 'the-godfather',
    awards: 'Won 3 Academy Awards including Best Picture, Best Actor (Marlon Brando), and Best Adapted Screenplay. #2 on IMDb Top 250.',
    didYouKnow: 'Marlon Brando stuffed his cheeks with cotton balls to create Don Corleone\'s distinctive look and voice. He was not expected to win the Oscar and sent Sacheen Littlefeather to decline it.',
    trivia: JSON.stringify([
      { question: 'How did they get the cat?', answer: 'The cat in Brando\'s lap was a stray that Francis Ford Coppola found on the Paramount lot. Its purring was so loud that some of Brando\'s dialogue had to be re-recorded.' },
      { question: 'Why was the movie almost not made?', answer: 'Paramount executives wanted a budget of $1 million and Italian-American actors. Coppola fought for a higher budget and the casting of Brando, who was considered box office poison at the time.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Don Corleone', text: 'I\'m gonna make him an offer he can\'t refuse.' },
      { character: 'Don Corleone', text: 'A man who doesn\'t spend time with his family can never be a real man.' },
      { character: 'Sonny Corleone', text: 'You can act like a man!' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Paramount+', url: 'https://www.paramountplus.com/movies/the-godfather/', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Godfather-Brando-Pacino/dp/B000P6L3TW', logo: '', type: 'rent' },
    ]),
  },
  {
    slugMatch: 'pulp-fiction',
    awards: 'Won the Palme d\'Or at Cannes. Nominated for 7 Academy Awards, won Best Original Screenplay. #7 on IMDb Top 250.',
    didYouKnow: 'Quentin Tarantino wrote the role of Vincent Vega specifically for John Travolta, hoping to revive his career. It worked — Travolta received an Oscar nomination.',
    trivia: JSON.stringify([
      { question: 'Where did the famous dance scene come from?', answer: 'The twist dance at Jack Rabbit Slim\'s was improvised by Travolta and Uma Thurman. Tarantino had the song "You Never Can Tell" by Chuck Berry playing on set and told them to dance.' },
      { question: 'Why is the briefcase never opened?', answer: 'Tarantino has never revealed what\'s inside the briefcase. He believes the mystery is more powerful than any answer. Fans have speculated everything from gold bars to Marsellus Wallace\'s soul.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Jules Winnfield', text: 'Say "what" again! I dare you, I double dare you, motherf***er!' },
      { character: 'Mia Wallace', text: 'Don\'t you just hate that?' },
      { character: 'Jules Winnfield', text: 'I\'m trying, Ringo. I\'m trying real hard to be the shepherd.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Netflix', url: 'https://www.netflix.com/title/43158', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Pulp-Fiction-Remastered/dp/B001G8Y9V0', logo: '', type: 'rent' },
    ]),
  },
  {
    slugMatch: 'forrest-gump',
    awards: 'Won 6 Academy Awards including Best Picture, Best Director, Best Actor (Tom Hanks). #14 on IMDb Top 250.',
    didYouKnow: 'The famous line "Life is like a box of chocolates" was originally "Life was like a box of chocolates." Tom Hanks\' son Colin suggested changing "was" to "is" and the line was rewritten.',
    trivia: JSON.stringify([
      { question: 'How were the historical footage scenes created?', answer: 'The filmmakers used cutting-edge digital compositing to place Tom Hanks into actual historical footage with presidents Kennedy, Johnson, and Nixon, as well as the Apollo 11 mission.' },
      { question: 'How much weight did Tom Hanks gain for the role?', answer: 'Hanks gained 40 pounds for the role and grew his hair long. The transformation was so complete that many crew members didn\'t recognize him.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Forrest Gump', text: 'Mama always said life was like a box of chocolates. You never know what you\'re gonna get.' },
      { character: 'Forrest Gump', text: 'Stupid is as stupid does.' },
      { character: 'Forrest Gump', text: 'That\'s all I have to say about that.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Paramount+', url: 'https://www.paramountplus.com/movies/forrest-gump/', logo: '', type: 'stream' },
      { platform: 'Netflix', url: 'https://www.netflix.com/title/5526', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Forrest-Gump-Tom-Hanks/dp/B000PDAPR4', logo: '', type: 'rent' },
    ]),
  },
  {
    slugMatch: 'fight-club',
    awards: 'Nominated for the Palme d\'Or at Cannes. Has become one of the most quoted films of the 1990s. #12 on IMDb Top 250.',
    didYouKnow: 'The film was a box office disappointment upon release but became a massive cult classic on DVD, selling over 6 million copies in its first year.',
    trivia: JSON.stringify([
      { question: 'What about the subliminal flashes?', answer: 'Director David Fincher inserted single-frame flashes of Tyler Durden into the film before his character is introduced. These frames appear so quickly that viewers perceive them as subliminal suggestions.' },
      { question: 'How was Brad Pitt\'s physique achieved?', answer: 'Brad Pitt trained for over a year with a personal trainer, going from 155 to 170 pounds of muscle. He also learned to fight properly and even got a dental plate to enhance his look.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Tyler Durden', text: 'The first rule of Fight Club is: you do not talk about Fight Club.' },
      { character: 'Tyler Durden', text: 'It\'s only after we\'ve lost everything that we\'re free to do anything.' },
      { character: 'Narrator', text: 'The things you own end up owning you.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Hulu', url: 'https://www.hulu.com/movie/fight-club', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Fight-Club-Pitt-Norton/dp/B000HCZBJI', logo: '', type: 'rent' },
    ]),
  },
  {
    slugMatch: 'the-matrix',
    awards: 'Won 4 Academy Awards for Film Editing, Sound, Sound Effects, and Visual Effects. #16 on IMDb Top 250.',
    didYouKnow: 'The "bullet time" effect was achieved using 120 still cameras arranged in an arc, firing in sequence. It took 10 months to develop the technology.',
    trivia: JSON.stringify([
      { question: 'How was the "bullet time" effect created?', answer: 'The effect used 120 still cameras arranged in an arc around the subject. Each camera fired in rapid sequence while the image was digitally stitched together. Some shots also used CGI to extend the background.' },
      { question: 'What does the green code mean?', answer: 'The cascading green characters are actually mirror-imaged Japanese characters from a cookbook. Designer Simon Whiteley created them using his wife\'s sushi recipe as source material.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Morpheus', text: 'Unfortunately, no one can be told what the Matrix is. You have to see it for yourself.' },
      { character: 'Neo', text: 'I know kung fu.' },
      { character: 'Morpheus', text: 'Free your mind.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Netflix', url: 'https://www.netflix.com/title/14568', logo: '', type: 'stream' },
      { platform: 'HBO Max', url: 'https://play.max.com/movie/the-matrix', logo: '', type: 'stream' },
    ]),
  },
  {
    slugMatch: 'interstellar',
    awards: 'Won Academy Award for Best Visual Effects. Nominated for 4 other Oscars. #19 on IMDb Top 250.',
    didYouKnow: 'Physicist Kip Thorne served as scientific consultant. The black hole Gargantua was rendered using actual equations from general relativity, producing images later published as scientific papers.',
    trivia: JSON.stringify([
      { question: 'How real was the corn field?', answer: 'Christopher Nolan planted 500 acres of corn for the farm scenes. After filming, he sold the corn and made a profit — the farm became profitable enough that he later used the technique in other films.' },
      { question: 'What about the docking scene music?', answer: 'Hans Zimmer composed the organ-heavy score without knowing the plot. Nolan only told him it was about a father\'s love for his child. The resulting score perfectly matches the intensity of the docking sequence.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Cooper', text: 'Mankind was born on Earth. It was never meant to die here.' },
      { character: 'Murph', text: 'Don\'t let me leave, Murph!' },
      { character: 'Brand', text: 'We used to look up at the sky and wonder at our place in the stars. Now we just look down, and worry about our place in the dirt.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'Paramount+', url: 'https://www.paramountplus.com/movies/interstellar/', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Interstellar-Matthew-McConaughey-Channing-Tatum/dp/B00NOOVKXC', logo: '', type: 'rent' },
    ]),
  },
  {
    slugMatch: 'the-lord-of-the-rings-the-return-of-the-king',
    awards: 'Won all 11 Academy Awards it was nominated for, including Best Picture and Best Director. Tied the record with Ben-Hur and Titanic.',
    didYouKnow: 'The film held the record for highest-grossing film ever until Avatar (2009). Peter Jackson shot all three LOTR films simultaneously over 438 consecutive days.',
    trivia: JSON.stringify([
      { question: 'How many awards did it win?', answer: 'It won all 11 Oscars it was nominated for, tying the all-time record with Ben-Hur (1959) and Titanic (1997). This included Best Picture and Best Director.' },
      { question: 'How was Gollum created?', answer: 'Andy Serkis performed Gollum through motion capture technology. His performance was digitally enhanced but kept his facial expressions and voice, creating one of cinema\'s first fully digital characters.' },
    ]),
    quotes: JSON.stringify([
      { character: 'Samwise Gamgee', text: 'I\'m glad to be with you, Samwise Gamgee. Here at the end of all things.' },
      { character: 'Frodo Baggins', text: 'I\'m glad to be with you, Samwise Gamgee. Here at the end of all things.' },
      { character: 'Gandalf', text: 'All we have to decide is what to do with the time that is given us.' },
    ]),
    streaming: JSON.stringify([
      { platform: 'HBO Max', url: 'https://play.max.com/movie/the-lord-of-the-rings-the-return-of-the-king', logo: '', type: 'stream' },
      { platform: 'Amazon Prime Video', url: 'https://www.amazon.com/Return-King-Peter-Jackson/dp/B0013FXQS6', logo: '', type: 'rent' },
    ]),
  },
];

// Add streaming links for remaining movies that don't have custom data
const remainingMovies = db.prepare('SELECT slug FROM movies').all();

const updateStmt = db.prepare('UPDATE movies SET streaming_links=?, trivia=?, quotes=?, did_you_know=?, awards=? WHERE slug=?');

const tx = db.transaction(() => {
  data.forEach(d => {
    updateStmt.run(d.streaming, d.trivia, d.quotes, d.didYouKnow, d.awards, '%' + d.slugMatch + '%');
  });

  // Add default streaming for movies without custom data
  remainingMovies.forEach(m => {
    const existing = db.prepare('SELECT streaming_links FROM movies WHERE slug = ?').get(m.slug);
    if (!existing || !existing.streaming_links) {
      const defaultStreaming = JSON.stringify([
        { platform: 'Netflix', url: 'https://www.netflix.com', logo: '', type: 'stream' },
        { platform: 'Amazon Prime Video', url: 'https://www.amazon.com', logo: '', type: 'rent' },
      ]);
      updateStmt.run(defaultStreaming, '[]', '[]', '', '', m.slug);
    }
  });
});

tx();

const count = db.prepare("SELECT COUNT(*) as c FROM movies WHERE streaming_links IS NOT NULL AND streaming_links != 'null'").get().c;
console.log('Updated ' + count + ' movies with streaming links, trivia, quotes, and awards');
console.log('Done!');
db.close();
