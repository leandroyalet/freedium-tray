use rusqlite::{params, Connection, Row};

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryEntryData {
    pub id: i64,
    pub article_slug: String,
    pub visited_at: String,
    pub article: Option<ArticleSummary>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleSummary {
    pub title: String,
    pub author: AuthorSummary,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorSummary {
    pub avatar: String,
}

fn map_history_row(row: &Row) -> rusqlite::Result<HistoryEntryData> {
    let article_title: Option<String> = row.get(3)?;
    let article_avatar: Option<String> = row.get(4)?;

    let article = article_title.map(|title| ArticleSummary {
        title,
        author: AuthorSummary {
            avatar: article_avatar.unwrap_or_default(),
        },
    });

    Ok(HistoryEntryData {
        id: row.get(0)?,
        article_slug: row.get(1)?,
        visited_at: row.get(2)?,
        article,
    })
}

pub fn add_to_history(conn: &Connection, article_url: &str) -> Result<i64, rusqlite::Error> {
    let article_id: Option<i64> = conn
        .query_row(
            "SELECT id FROM articles WHERE url = ?1",
            [article_url],
            |row| row.get(0),
        )
        .ok();

    let Some(article_id) = article_id else {
        return Ok(0);
    };

    let existing: Option<i64> = conn
        .query_row(
            "SELECT id FROM reading_history WHERE article_id = ?1 AND date(visited_at) = date('now')",
            [article_id],
            |row| row.get(0),
        )
        .ok();

    if let Some(id) = existing {
        conn.execute(
            "UPDATE reading_history SET visited_at = datetime('now') WHERE id = ?1",
            params![id],
        )?;
        Ok(id)
    } else {
        conn.execute(
            "INSERT INTO reading_history (article_id, visited_at) VALUES (?1, datetime('now'))",
            params![article_id],
        )?;
        Ok(conn.last_insert_rowid())
    }
}

pub fn get_reading_history(
    conn: &Connection,
    limit: i64,
    offset: i64,
) -> Result<Vec<HistoryEntryData>, rusqlite::Error> {
    let mut sql = String::from(
        "
            SELECT 
                h.id,
                a.slug,
                h.visited_at,
                a.title,
                a.author_avatar
            FROM reading_history h
            JOIN articles a ON a.id = h.article_id
            ORDER BY h.visited_at DESC
            ",
    );

    if limit >= 0 {
        sql.push_str(&format!(" LIMIT {} OFFSET {}", limit, offset));
    }

    let mut stmt = conn.prepare(&sql)?;

    let rows = stmt.query_map([], map_history_row)?;

    Ok(rows.filter_map(Result::ok).collect())
}

pub fn clear_history(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute("DELETE FROM reading_history", [])?;
    Ok(())
}
