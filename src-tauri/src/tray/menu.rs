use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::Runtime;

pub fn create_tray_menu<R: Runtime>(app: &tauri::App<R>) -> tauri::Result<Menu<R>> {
    // Add tray menu items
    let open = MenuItem::with_id(app, "open", "Open", true, None::<&str>)?;
    //let settings = MenuItem::with_id(app, "settings", "Settings", true, Some("CmdOrCtrl+,"))?;
    //let about = MenuItem::with_id(app, "about", "About", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app.handle())?;
    let quit = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;

    // Create menu with items
    Menu::with_items(
        app,
      //  &[&open, &separator, &settings, &about, &separator, &quit],
        &[&open, &separator, &quit],
    )
}
