use anyhow::Result;
use tauri::utils::{config::WindowEffectsConfig, WindowEffect, WindowEffectState};
use tauri::{TitleBarStyle, WebviewUrl, WebviewWindowBuilder};

use crate::config::JS_INIT_SCRIPT;

pub fn create_main_window(
    app: &tauri::App,
    initial_url: Option<&str>,
) -> Result<(), Box<dyn std::error::Error>> {
    let url = match initial_url {
        Some(url) => {
            let encoded = url::form_urlencoded::byte_serialize(url.as_bytes()).collect::<String>();
            format!("index.html#/article?url={}", encoded)
        }
        None => "index.html".to_string(),
    };

    let win_builder = WebviewWindowBuilder::new(app, "main", WebviewUrl::App(url.into()))
        .title("Freedium Tray")
        .min_inner_size(585.00, 550.00)
        .inner_size(800.0, 600.0)
        .resizable(true)
        .decorations(true)
        .fullscreen(false)
        .initialization_script(JS_INIT_SCRIPT)
        .visible(false)
        .accept_first_mouse(true)
        .center();

    #[cfg(target_os = "macos")]
    let win_builder = win_builder
        .hidden_title(true)
        .transparent(true)
        .title_bar_style(TitleBarStyle::Overlay)
        .effects(setup_window_effects());

    win_builder.build()?;

    Ok(())
}

#[cfg(target_os = "macos")]
fn setup_window_effects() -> WindowEffectsConfig {
    WindowEffectsConfig {
        radius: Some(10.0),
        effects: vec![
            WindowEffect::ContentBackground,
            WindowEffect::FullScreenUI,
            WindowEffect::HeaderView,
            WindowEffect::HudWindow,
            WindowEffect::Menu,
            WindowEffect::Popover,
            WindowEffect::Selection,
            WindowEffect::Sheet,
            WindowEffect::Sidebar,
            WindowEffect::Titlebar,
            WindowEffect::Tooltip,
            WindowEffect::UnderPageBackground,
            WindowEffect::UnderWindowBackground,
            WindowEffect::WindowBackground,
        ],
        state: Some(WindowEffectState::FollowsWindowActiveState),
        color: None,
    }
}
