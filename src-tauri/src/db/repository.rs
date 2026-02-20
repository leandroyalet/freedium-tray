use rusqlite::Connection;

use crate::db::articles;
use crate::db::history;
use crate::db::DbPool;
use crate::ArticleData;
use crate::ArticleSummary;

#[derive(Clone)]
pub struct Repository {
    pool: DbPool,
}

type DbConn = Connection;

impl Repository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn with_conn<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&DbConn) -> Result<T, rusqlite::Error>,
    {
        let conn = self.pool.get().map_err(|e| {
            log_error!("get connection failed: {}", e);
            e.to_string()
        })?;
        f(&conn).map_err(|e| {
            log_error!("database operation failed: {}", e);
            e.to_string()
        })
    }

    fn with_conn_mut<T, F>(&self, f: F) -> Result<T, String>
    where
        F: FnOnce(&mut DbConn) -> Result<T, rusqlite::Error>,
    {
        let mut conn = self.pool.get().map_err(|e| {
            log_error!("get connection failed: {}", e);
            e.to_string()
        })?;

        f(&mut conn).map_err(|e| {
            log_error!("database operation failed: {}", e);
            e.to_string()
        })
    }

    pub fn save_article(&self, article: &ArticleData) -> Result<(), String> {
        self.with_conn_mut(|conn| articles::save_article(conn, article))
    }

    pub fn get_recent_articles(
        &self,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ArticleSummary>, String> {
        self.with_conn(|conn| articles::get_recent_articles(conn, limit, offset))
    }

    pub fn search_articles(
        &self,
        query: &str,
        limit: i64,
        offset: i64,
    ) -> Result<Vec<ArticleSummary>, String> {
        self.with_conn(|conn| articles::search_articles(conn, query, limit, offset))
    }

    pub fn get_article_by_slug(&self, slug: &str) -> Result<Option<ArticleData>, String> {
        self.with_conn(|conn| match articles::get_article_by_slug(conn, slug) {
            Ok(article) => Ok(Some(article)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        })
    }

    pub fn get_all_urls(&self) -> Result<Vec<String>, String> {
        self.with_conn(articles::get_all_urls)
    }

    pub fn get_article_count(&self) -> Result<i64, String> {
        self.with_conn(articles::get_article_count)
    }

    pub fn url_exists(&self, url: &str) -> Result<bool, String> {
        self.with_conn(|conn| articles::url_exists(conn, url))
    }

    pub fn get_popular_tags(&self, limit: i64) -> Result<Vec<articles::TagCount>, String> {
        self.with_conn(|conn| articles::get_popular_tags(conn, limit))
    }

    pub fn search_articles_count(&self, query: &str) -> Result<i64, String> {
        self.with_conn(|conn| articles::search_articles_count(conn, query))
    }

    pub fn add_to_history(&self, article_url: &str) -> Result<i64, String> {
        self.with_conn(|conn| history::add_to_history(conn, article_url))
    }

    pub fn get_reading_history(&self) -> Result<Vec<history::HistoryEntryData>, String> {
        self.with_conn(history::get_reading_history)
    }

    pub fn clear_history(&self) -> Result<(), String> {
        self.with_conn(history::clear_history)
    }

    pub fn delete_article(&self, slug: &str) -> Result<(), String> {
        self.with_conn_mut(|conn| articles::delete_article(conn, slug))
    }
}
