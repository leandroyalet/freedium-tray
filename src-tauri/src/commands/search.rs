use tauri::State;

use crate::db::{self, Repository};
use crate::error::CommandError;
use crate::models::{ArticleSummary, SearchResult};

#[tauri::command(async)]
pub async fn get_recent_articles(
    repo: State<'_, Repository>,
    limit: i64,
    offset: i64,
) -> Result<Vec<ArticleSummary>, CommandError> {
    repo.inner()
        .get_recent_articles(limit, offset)
        .map_err(|e| {
            log_error!("get_recent_articles: {}", e);
            CommandError::internal(&e.to_string())
        })
}

#[tauri::command(async)]
pub async fn search_articles(
    repo: State<'_, Repository>,
    query: String,
    limit: i64,
    offset: i64,
) -> Result<SearchResult, CommandError> {
    let articles = repo
        .inner()
        .search_articles(&query, limit, offset)
        .map_err(|e| {
            log_error!("search_articles: {}", e);
            CommandError::internal(&e.to_string())
        })?;

    let count = repo.inner().search_articles_count(&query).map_err(|e| {
        log_error!("search_articles_count: {}", e);
        CommandError::internal(&e.to_string())
    })?;

    Ok(SearchResult { articles, count })
}

#[tauri::command(async)]
pub async fn get_article_count(repo: State<'_, Repository>) -> Result<i64, CommandError> {
    repo.inner().get_article_count().map_err(|e| {
        log_error!("get_article_count: {}", e);
        CommandError::internal(&e.to_string())
    })
}

#[tauri::command(async)]
pub fn get_popular_tags(
    repo: State<'_, Repository>,
    limit: i64,
) -> Result<Vec<db::articles::TagCount>, CommandError> {
    repo.inner().get_popular_tags(limit).map_err(|e| {
        log_error!("get_popular_tags: {}", e);
        CommandError::internal(&e.to_string())
    })
}

#[tauri::command(async)]
pub async fn search_tags(
    repo: State<'_, Repository>,
    prefix: String,
    limit: i64,
) -> Result<Vec<String>, CommandError> {
    repo.inner().search_tags(&prefix, limit).map_err(|e| {
        log_error!("search_tags: {}", e);
        CommandError::internal(&e.to_string())
    })
}
