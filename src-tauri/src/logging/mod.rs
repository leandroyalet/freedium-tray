use chrono::Local;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

static LOG_FILE: Mutex<Option<PathBuf>> = Mutex::new(None);

pub fn init_logging(app: &AppHandle) -> Result<(), String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let log_path = app_dir.join("error_log");

    let _ = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_path)
        .map_err(|e| e.to_string())?;

    let mut log_file = LOG_FILE.lock().unwrap();
    *log_file = Some(log_path);

    Ok(())
}

#[macro_export]
macro_rules! log_error {
    ($($arg:tt)*) => {
        $crate::logging::log_error_impl(
            format!($($arg)*),
            file!(),
            line!(),
            module_path!()
        );
    };
}

pub fn log_error_impl(message: String, file: &str, line: u32, module_path: &str) {
    if let Ok(guard) = LOG_FILE.lock() {
        if let Some(ref log_path) = *guard {
            let timestamp = Local::now().format("%Y-%m-%d %H:%M:%S");
            let location = format!("{}:{} {}", file, line, module_path);
            let log_entry = format!("[{}] ERROR [{}] {}\n", timestamp, location, message);

            if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
                let _ = file.write_all(log_entry.as_bytes());
            }
        }
    }
}

pub fn setup_panic_handler() {
    std::panic::set_hook(Box::new(|panic_info| {
        let message = if let Some(s) = panic_info.payload().downcast_ref::<&str>() {
            s.to_string()
        } else if let Some(s) = panic_info.payload().downcast_ref::<String>() {
            s.clone()
        } else {
            "Unknown panic".to_string()
        };

        let location = panic_info
            .location()
            .map(|loc| format!("{}:{}:{}", loc.file(), loc.line(), loc.column()))
            .unwrap_or_else(|| "unknown location".to_string());

        log_error_impl(
            format!("PANIC at {}: {}", location, message),
            file!(),
            line!(),
            module_path!(),
        );
    }));
}
