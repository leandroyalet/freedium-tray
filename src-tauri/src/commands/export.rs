use tauri::State;

use crate::db::Repository;
use crate::error::CommandError;

#[tauri::command]
pub fn export_article_urls(repo: State<'_, Repository>) -> Result<String, CommandError> {
    let urls = repo.inner().get_all_urls().map_err(|e| {
        log_error!("export_article_urls: get_all_urls failed: {}", e);
        CommandError::internal(&e.to_string())
    })?;

    let content = urls.join("\n");

    let downloads_dir = dirs::download_dir()
        .ok_or_else(|| CommandError::internal("Could not find Downloads directory"))?;
    let file_path = downloads_dir.join("articles.txt");

    std::fs::write(&file_path, &content).map_err(|e| {
        log_error!("export_article_urls: write file failed: {}", e);
        CommandError::internal(&e.to_string())
    })?;

    Ok(file_path.to_string_lossy().to_string())
}
