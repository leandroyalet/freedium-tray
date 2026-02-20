use tauri::State;
use tauri_plugin_http::reqwest;

use crate::db::Repository;
use crate::error::CommandError;
use crate::scraper;

#[tauri::command]
pub async fn import_article_urls(
    _app: tauri::AppHandle,
    repo: State<'_, Repository>,
    file_path: String,
    mirror: Option<String>,
) -> Result<i64, CommandError> {
    let mirror_url = mirror.ok_or_else(|| CommandError::bad_request("Mirror URL not configured"))?;

    let content = std::fs::read_to_string(&file_path).map_err(|e| {
        log_error!("import_article_urls: read file failed: {}", e);
        CommandError::internal(&e.to_string())
    })?;

    let urls: Vec<String> = content
        .lines()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect();

    if urls.is_empty() {
        return Ok(0);
    }

    let repo = repo.inner().clone();
    let mut imported = 0i64;

    for url in urls {
        let mirror_url = mirror_url.clone();
        let repo = repo.clone();

        let result = fetch_and_save_article(&repo, &url, &mirror_url).await;

        match result {
            Ok(_) => imported += 1,
            Err(e) => {
                if !e.contains("URL already exists") {
                    log_error!("import_article_urls: failed to import {}: {}", url, e);
                }
            }
        }
    }

    Ok(imported)
}

async fn fetch_and_save_article(repo: &Repository, url: &str, mirror_url: &str) -> Result<(), String> {
    let url = url.to_string();

    let exists = tokio::task::spawn_blocking({
        let url = url.clone();
        let repo = repo.clone();
        move || repo.url_exists(&url)
    })
    .await
    .map_err(|e| e.to_string())??;

    if exists {
        return Err("URL already exists".to_string());
    }

    let proxy_url = format!("{}/{}", mirror_url.trim_end_matches('/'), url);

    let response = reqwest::get(&proxy_url).await.map_err(|e| e.to_string())?;
    let raw_html = response.text().await.map_err(|e| e.to_string())?;

    if let Err(e) = scraper::validate_html_response(&raw_html) {
        return Err(format!("{:?}", e));
    }

    let article = scraper::extract_article(&raw_html, url.clone())
        .ok_or_else(|| "Failed to extract article".to_string())?;

    tokio::task::spawn_blocking({
        let repo = repo.clone();
        let article = article.clone();
        move || repo.save_article(&article)
    })
    .await
    .map_err(|e| e.to_string())??;

    Ok(())
}
