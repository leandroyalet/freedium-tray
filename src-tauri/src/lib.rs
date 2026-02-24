#[macro_use]
mod logging;

mod commands;
mod config;
mod db;
mod error;
mod models;
mod scraper;
mod tray;
mod window;

use std::env;

use tauri::Manager;
use tray::{setup_tray};
use window::create_main_window;

#[allow(unused_imports)]
pub use error::CommandError;
#[allow(unused_imports)]
pub use models::{ArticleData, ArticleSummary, AuthorData};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    logging::setup_panic_handler();

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(commands::all_commands())
        .setup(|app| {
            logging::init_logging(app.handle())?;

            let pool = db::init_db_pool(app.handle())?;
            let repo = db::Repository::new(pool);
            app.manage(repo);

            let args: Vec<String> = env::args().collect();

            let initial_url = args.get(1).map(|url| url.as_str());

            create_main_window(app, initial_url)?;
            setup_tray(app)?;

            if initial_url.is_some() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                window.hide().unwrap();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
