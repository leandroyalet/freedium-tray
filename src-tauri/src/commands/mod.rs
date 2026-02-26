pub mod article;
pub mod search;
pub mod history;
pub mod export;
pub mod import;

pub use article::*;
pub use search::*;
pub use history::*;
pub use export::*;
pub use import::*;

pub fn all_commands() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool {
    tauri::generate_handler![
        fetch_via_proxy,
        get_recent_articles,
        search_articles,
        get_article_by_slug,
        export_article_urls,
        import_article_urls,
        get_article_count,
        get_popular_tags,
        search_tags,
        add_to_history,
        get_reading_history,
        clear_history,
        delete_article
    ]
}
