use tauri::State;

use crate::db::{self, Repository};
use crate::error::CommandError;

#[tauri::command]
pub fn add_to_history(
    repo: State<'_, Repository>,
    article_url: String,
) -> Result<i64, CommandError> {
    repo.inner().add_to_history(&article_url).map_err(|e| {
        log_error!("add_to_history: {}", e);
        CommandError::internal(&e.to_string())
    })
}

#[tauri::command]
pub fn get_reading_history(
    repo: State<'_, Repository>,
    limit: i64,
    offset: i64,
) -> Result<Vec<db::history::HistoryEntryData>, CommandError> {
    repo.inner()
        .get_reading_history(limit, offset)
        .map_err(|e| {
            log_error!("get_reading_history: {}", e);
            CommandError::internal(&e)
        })
}

#[tauri::command]
pub fn clear_history(repo: State<'_, Repository>) -> Result<(), CommandError> {
    repo.inner().clear_history().map_err(|e| {
        log_error!("clear_history: {}", e);
        CommandError::internal(&e.to_string())
    })
}
