use tauri::State;
use tauri_plugin_http::reqwest;

use crate::db::Repository;
use crate::error::CommandError;
use crate::models::ArticleData;
use crate::scraper;

#[tauri::command(async)]
pub async fn fetch_via_proxy(
    _app: tauri::AppHandle,
    repo: State<'_, Repository>,
    url: String,
    mirror: Option<String>,
) -> Result<ArticleData, CommandError> {
    let mirror_url = mirror.ok_or_else(|| CommandError::bad_request("Mirror URL not configured"))?;
    let proxy_url = format!("{}/{}", mirror_url.trim_end_matches('/'), url);

    let response = reqwest::get(&proxy_url).await.map_err(|e| {
        log_error!("fetch_via_proxy: reqwest get failed: {}", e);
        CommandError::internal(&e.to_string())
    })?;
    let raw_html = response.text().await.map_err(|e| {
        log_error!("fetch_via_proxy: response text failed: {}", e);
        CommandError::internal(&e.to_string())
    })?;

    scraper::validate_html_response(&raw_html)?;

    match scraper::extract_article(&raw_html, url) {
        Some(article) => {
            repo.inner().save_article(&article).map_err(|e| {
                log_error!("fetch_via_proxy: save_article failed: {}", e);
                CommandError::internal(&e.to_string())
            })?;
            Ok(article)
        },
        None => {
            let err = "Failed to extract article content";
            log_error!("fetch_via_proxy: {}", err);
            Err(CommandError::internal(err))
        },
    }
}

#[tauri::command(async)]
pub async fn get_article_by_slug(
    repo: State<'_, Repository>,
    slug: String,
) -> Result<ArticleData, CommandError> {
    repo.inner().get_article_by_slug(&slug).map_err(|e| {
        log_error!("get_article_by_slug: {}", e);
        CommandError::internal(&e)
    })?.ok_or_else(|| CommandError::not_found("Article not found"))
}

#[tauri::command(async)]
pub async fn delete_article(repo: State<'_, Repository>, slug: String) -> Result<(), CommandError> {
    repo.inner().delete_article(&slug).map_err(|e| {
        log_error!("delete_article: {}", e);
        CommandError::internal(&e.to_string())
    })
}
