use r2d2::{Pool, PooledConnection};
use r2d2_sqlite::SqliteConnectionManager;
use tauri::{AppHandle, Manager};

pub mod articles;
pub mod history;
pub mod repository;
mod schema;

pub type DbPool = Pool<SqliteConnectionManager>;
#[allow(dead_code)]
pub type DbConnection = PooledConnection<SqliteConnectionManager>;

pub use repository::Repository;

pub fn init_db_pool(app: &AppHandle) -> Result<DbPool, String> {
    let app_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    let db_path = app_dir.join("store.db");
    let manager = SqliteConnectionManager::file(&db_path);

    let pool = Pool::builder()
        .max_size(10)
        .build(manager)
        .map_err(|e| e.to_string())?;

    let conn = pool.get().map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|e| e.to_string())?;

    schema::create_tables(&*conn)?;

    Ok(pool)
}
