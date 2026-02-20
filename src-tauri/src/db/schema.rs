use rusqlite::Connection;

pub fn create_tables(conn: &Connection) -> Result<(), String> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS articles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            slug TEXT NOT NULL UNIQUE,
            url TEXT UNIQUE NOT NULL,

            title TEXT NOT NULL,
            subtitle TEXT,

            author_name TEXT,
            author_profile_url TEXT,
            author_avatar TEXT,

            cover_image TEXT,
            published_date TEXT,
            updated_date TEXT,
            reading_time TEXT,
            content TEXT NOT NULL,

            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        );

        CREATE TABLE IF NOT EXISTS article_tags (
            article_id INTEGER NOT NULL,
            tag_id INTEGER NOT NULL,
            PRIMARY KEY(article_id, tag_id),
            FOREIGN KEY(article_id) REFERENCES articles(id),
            FOREIGN KEY(tag_id) REFERENCES tags(id)
        );

        CREATE INDEX IF NOT EXISTS idx_articles_title ON articles(title);

        CREATE TABLE IF NOT EXISTS reading_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            article_id INTEGER NOT NULL,
            visited_at TEXT DEFAULT (datetime('now')),
            FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_reading_history_visited_at ON reading_history(visited_at DESC);

        CREATE VIRTUAL TABLE IF NOT EXISTS articles_fts 
        USING fts5(
            title,
            subtitle,
            content
        );
    ",
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
