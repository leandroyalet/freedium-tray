use crate::{ArticleData, ArticleSummary, AuthorData};
use rusqlite::{params, Connection, Row};
use scraper::Html;

fn sanitize_content(html: &str) -> String {
    let fragment = Html::parse_fragment(html);
    fragment
        .root_element()
        .text()
        .collect::<Vec<_>>()
        .join(" ")
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ")
}

fn sanitize_fts5_query(query: &str) -> String {
    let special_chars = ['"', '\'', '*', '?', '-', '+', '(', ')', ':', '^', '~', '\0'];
    let mut result = String::with_capacity(query.len() * 2);

    for c in query.chars() {
        if special_chars.contains(&c) {
            result.push(' ');
        } else {
            result.push(c);
        }
    }

    result.split_whitespace().collect::<Vec<_>>().join(" ")
}

fn validate_tag(tag: &str) -> Option<String> {
    let trimmed = tag.trim();
    if trimmed.is_empty() || trimmed.len() > 50 {
        return None;
    }

    let valid = trimmed
        .chars()
        .all(|c| c.is_alphanumeric() || c == '-' || c == '_');
    if valid {
        Some(trimmed.to_string())
    } else {
        None
    }
}

pub fn save_article(conn: &mut Connection, article: &ArticleData) -> Result<(), rusqlite::Error> {
    let tx = conn.transaction()?;

    let inserted = tx.execute(
        "
        INSERT OR IGNORE INTO articles 
        (
            slug,
            url, 
            title, 
            subtitle, 
            author_name,
            author_avatar,
            author_profile_url,
            cover_image, 
            published_date, 
            updated_date,
            reading_time, 
            content
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
        ",
        params![
            article.slug,
            article.url,
            article.title,
            article.subtitle,
            article.author.name,
            article.author.avatar,
            article.author.profile_url,
            article.cover_image,
            article.published_date,
            article.updated_date,
            article.reading_time,
            article.content
        ],
    )?;

    let article_id = if inserted > 0 {
        tx.last_insert_rowid()
    } else {
        tx.query_row(
            "SELECT id FROM articles WHERE slug = ?1",
            params![article.slug],
            |row| row.get(0),
        )?
    };

    for tag in &article.tags {
        tx.execute(
            "INSERT OR IGNORE INTO tags (name) VALUES (?1)",
            params![tag],
        )?;

        let tag_id: i64 =
            tx.query_row("SELECT id FROM tags WHERE name = ?1", params![tag], |row| {
                row.get(0)
            })?;

        tx.execute(
            "INSERT OR IGNORE INTO article_tags (article_id, tag_id) VALUES (?1, ?2)",
            params![article_id, tag_id],
        )?;
    }

    tx.execute(
        "DELETE FROM articles_fts WHERE rowid = ?1",
        params![article_id],
    )?;

    tx.execute(
        "
        INSERT INTO articles_fts (rowid, title, subtitle, content)
        VALUES (?1, ?2, ?3, ?4)
        ",
        params![
            article_id,
            article.title,
            article.subtitle,
            sanitize_content(&article.content)
        ],
    )?;

    tx.commit()?;

    Ok(())
}

fn map_article_summary(row: &Row) -> rusqlite::Result<ArticleSummary> {
    Ok(ArticleSummary {
        slug: row.get(0)?,
        url: row.get(1)?,
        title: row.get(2)?,
        subtitle: row.get(3)?,
        author: AuthorData {
            name: row.get(4)?,
            avatar: row.get(5)?,
            profile_url: row.get(6)?,
        },
        cover_image: row.get(7)?,
        published_date: row.get(8)?,
        updated_date: row.get(9)?,
        reading_time: row.get(10)?,
        tags: vec![],
    })
}

const ARTICLE_SUMMARY_PROJECTION: &str = "
    SELECT a.slug, a.url, a.title, a.subtitle,
           a.author_name, a.author_avatar, a.author_profile_url,
           a.cover_image, a.published_date, a.updated_date, a.reading_time
 ";

fn execute_article_summary_query(
    conn: &Connection,
    sql: &str,
    params: impl rusqlite::Params,
) -> Result<Vec<ArticleSummary>, rusqlite::Error> {
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(params, map_article_summary)?;

    let mut result = Vec::new();
    for article_result in rows {
        if let Ok(mut article) = article_result {
            article.tags = load_article_tags(conn, &article.slug).unwrap_or_default();
            result.push(article);
        }
    }

    Ok(result)
}

fn map_article(row: &Row, slug: &str) -> rusqlite::Result<ArticleData> {
    Ok(ArticleData {
        slug: slug.to_string(),
        url: row.get(0)?,
        title: row.get(1)?,
        subtitle: row.get(2)?,
        author: AuthorData {
            name: row.get::<_, Option<String>>(3)?.unwrap_or_default(),
            avatar: row.get(4)?,
            profile_url: row.get(5)?,
        },
        cover_image: row.get(6)?,
        published_date: row.get(7)?,
        updated_date: row.get(8)?,
        reading_time: row.get(9)?,
        content: row.get(10)?,
        tags: vec![],
    })
}

pub fn search_articles(
    conn: &Connection,
    query: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<ArticleSummary>, rusqlite::Error> {
    let query = query.trim();

    if query.starts_with('#') {
        let tag = &query[1..];
        if !tag.is_empty() {
            if let Some(sanitized_tag) = validate_tag(tag) {
                return search_articles_by_tag(conn, &sanitized_tag, limit, offset);
            }
            return Ok(vec![]);
        }
    }

    let query = sanitize_fts5_query(query);

    if query.is_empty() {
        return Ok(vec![]);
    }

    let limit = limit.max(1).min(50);
    let offset = offset.max(0);

    let sql = format!(
        "{} FROM articles_fts f JOIN articles a ON a.id = f.rowid WHERE articles_fts MATCH ?1 ORDER BY bm25(articles_fts) LIMIT ?2 OFFSET ?3",
        ARTICLE_SUMMARY_PROJECTION
    );

    execute_article_summary_query(conn, &sql, params![query, limit, offset])
}

pub fn get_recent_articles(
    conn: &Connection,
    limit: i64,
    offset: i64,
) -> Result<Vec<ArticleSummary>, rusqlite::Error> {
    let limit = limit.max(1).min(50);
    let offset = offset.max(0);

    let sql = format!(
        "{} FROM articles ORDER BY datetime(created_at) DESC LIMIT ?1 OFFSET ?2",
        ARTICLE_SUMMARY_PROJECTION.replace("a.", "")
    );

    execute_article_summary_query(conn, &sql, params![limit, offset])
}

fn load_article_tags(conn: &Connection, slug: &str) -> Result<Vec<String>, rusqlite::Error> {
    let mut tag_stmt = conn.prepare(
        "
        SELECT t.name
        FROM tags t
        JOIN article_tags at ON at.tag_id = t.id
        JOIN articles a ON a.id = at.article_id
        WHERE a.slug = ?1
        ",
    )?;

    let tag_rows = tag_stmt.query_map([slug], |row| row.get::<_, String>(0))?;

    Ok(tag_rows.filter_map(Result::ok).collect())
}

pub fn get_article_by_slug(conn: &Connection, slug: &str) -> Result<ArticleData, rusqlite::Error> {
    let mut stmt = conn.prepare(
        "
        SELECT url, title, subtitle,
               author_name, author_avatar, author_profile_url,
               cover_image, published_date, updated_date, reading_time, content
        FROM articles
        WHERE slug = ?1
        ",
    )?;

    let mut article = stmt.query_row([slug], |row| map_article(row, slug))?;

    article.tags = load_article_tags(conn, slug).unwrap_or_default();

    Ok(article)
}

pub fn get_all_urls(conn: &Connection) -> Result<Vec<String>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT url FROM articles ORDER BY created_at DESC")?;

    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;

    Ok(rows.filter_map(Result::ok).collect())
}

pub fn get_article_count(conn: &Connection) -> Result<i64, rusqlite::Error> {
    conn.query_row("SELECT COUNT(*) FROM articles", [], |row| row.get(0))
}

pub fn url_exists(conn: &Connection, url: &str) -> Result<bool, rusqlite::Error> {
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM articles WHERE url = ?1",
        [url],
        |row| row.get(0),
    )?;
    Ok(count > 0)
}

pub fn delete_article(conn: &mut Connection, slug: &str) -> Result<(), rusqlite::Error> {
    let tx = conn.transaction()?;

    let article_id: Option<i64> = tx
        .query_row("SELECT id FROM articles WHERE slug = ?1", [slug], |row| {
            row.get(0)
        })
        .ok();

    if let Some(id) = article_id {
        tx.execute("DELETE FROM article_tags WHERE article_id = ?1", [id])?;
        tx.execute("DELETE FROM articles_fts WHERE rowid = ?1", [id])?;
        tx.execute("DELETE FROM articles WHERE id = ?1", [id])?;
    }

    tx.commit()?;
    Ok(())
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TagCount {
    pub name: String,
    pub count: i64,
}

pub fn get_popular_tags(conn: &Connection, limit: i64) -> Result<Vec<TagCount>, rusqlite::Error> {
    let limit = limit.max(1).min(50);
    let mut stmt = conn.prepare(
        "
        SELECT t.name, COUNT(at.article_id) as count
        FROM tags t
        JOIN article_tags at ON at.tag_id = t.id
        GROUP BY t.id
        ORDER BY count DESC
        LIMIT ?1
        ",
    )?;

    let rows = stmt.query_map([limit], |row| {
        Ok(TagCount {
            name: row.get(0)?,
            count: row.get(1)?,
        })
    })?;

    Ok(rows.filter_map(Result::ok).collect())
}

pub fn search_articles_by_tag(
    conn: &Connection,
    tag: &str,
    limit: i64,
    offset: i64,
) -> Result<Vec<ArticleSummary>, rusqlite::Error> {
    let tag = match validate_tag(tag) {
        Some(t) => t,
        None => return Ok(vec![]),
    };

    let limit = limit.max(1).min(50);
    let offset = offset.max(0);

    let sql = format!(
        "{} FROM articles a JOIN article_tags at ON at.article_id = a.id JOIN tags t ON t.id = at.tag_id WHERE t.name = ?1 ORDER BY datetime(a.created_at) DESC LIMIT ?2 OFFSET ?3",
        ARTICLE_SUMMARY_PROJECTION
    );

    execute_article_summary_query(conn, &sql, params![tag, limit, offset])
}

pub fn search_articles_count(conn: &Connection, query: &str) -> Result<i64, rusqlite::Error> {
    let query = query.trim();

    if query.starts_with('#') {
        let tag = &query[1..];
        if !tag.is_empty() {
            if let Some(sanitized_tag) = validate_tag(tag) {
                let count: i64 = conn.query_row(
                    "
                    SELECT COUNT(*)
                    FROM articles a
                    JOIN article_tags at ON at.article_id = a.id
                    JOIN tags t ON t.id = at.tag_id
                    WHERE t.name = ?1
                    ",
                    [&sanitized_tag],
                    |row| row.get(0),
                )?;
                return Ok(count);
            }
            return Ok(0);
        }
    }

    let query = sanitize_fts5_query(query);

    if query.is_empty() {
        return Ok(0);
    }

    let count: i64 = conn.query_row(
        "
        SELECT COUNT(*)
        FROM articles_fts f
        JOIN articles a ON a.id = f.rowid
        WHERE articles_fts MATCH ?1
        ",
        [query],
        |row| row.get(0),
    )?;

    Ok(count)
}

#[cfg(test)]
mod test {
    use super::sanitize_content;

    const CONTENT: &str = r#"
    <div class="m-2 mt-5 bg-gray-100 border border-gray-300 dark:bg-gray-600">
            <div class="flex items-center p-4 space-x-4">
                <div class=flex-shrink-0>
                    <a href="https://medium.com/@user" target=_blank title="Title" class="relative block">
                        <img src="https://medium.com/image.jpeg" alt="User" loading=eager referrerpolicy=no-referrer class="rounded-full h-11 w-11 no-lightense">
                        <div class="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    </a>
                </div>
                <div class=flex-grow>
                    <a href="https://medium.com/@user" target=_blank title="Title" class="block font-semibold text-gray-900 dark:text-white">User</a>
                    <button class="px-3 py-1 mt-1 text-sm text-white bg-green-500 rounded-lg dark:bg-green-700">
                        <a href="https://medium.com/@user" target=_blank title="Title" class="block text-sm text-white">Follow</a>
                    </button>
                </div>
            </div>
        </div>
 "#;

    #[test]
    fn sanitize_content_test() {
        let result = sanitize_content(CONTENT);
        assert_eq!("User Follow", result);
    }
}
