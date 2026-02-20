use chrono::NaiveDate;
use regex::Regex;
use scraper::{Html, Selector};
use url::Url;

use crate::error::CommandError;
use crate::models::{ArticleData, AuthorData};

pub mod selectors;

fn parse_dates(date_str: &str) -> (Option<String>, Option<String>) {
    let date_str = date_str.trim();
    if date_str.is_empty() {
        return (None, None);
    }

    let updated_regex = Regex::new(r"\(Updated:\s*([^)]+)\)").ok();

    let updated_date = updated_regex
        .as_ref()
        .and_then(|re| re.captures(date_str))
        .and_then(|caps| caps.get(1))
        .and_then(|m| parse_single_date(m.as_str()))
        .flatten();

    let published_part = updated_regex
        .as_ref()
        .and_then(|re| re.split(date_str).next())
        .unwrap_or(date_str);

    let published_date = parse_single_date(published_part.trim()).flatten();

    (published_date, updated_date)
}

fn parse_single_date(date_str: &str) -> Option<Option<String>> {
    let formats = ["%B %d, %Y", "%b %d, %Y", "%B %d %Y", "%b %d %Y"];

    for fmt in formats {
        if let Ok(date) = NaiveDate::parse_from_str(date_str, fmt) {
            return Some(Some(date.format("%Y-%m-%d").to_string()));
        }
    }
    None
}

pub fn extract_slug(article_url: &str) -> String {
    let parsed = Url::parse(article_url).expect("URL should be validated before");

    parsed
        .path_segments()
        .and_then(|segments| segments.filter(|s| !s.is_empty()).last())
        .expect("Slug must exist for validated Medium URL")
        .to_string()
}

pub fn extract_article(html: &str, url: String) -> Option<ArticleData> {
    let slug = extract_slug(&url);
    let document = Html::parse_document(html);

    let title_sel = Selector::parse(selectors::TITLE).unwrap();
    let title = document
        .select(&title_sel)
        .next()?
        .text()
        .collect::<Vec<_>>()
        .join("")
        .trim()
        .to_string();

    let subtitle_sel = Selector::parse(selectors::SUBTITLE).unwrap();
    let subtitle = document
        .select(&subtitle_sel)
        .next()?
        .text()
        .collect::<Vec<_>>()
        .join("")
        .trim()
        .to_string();

    let cover_sel = Selector::parse(selectors::COVER_IMAGE).unwrap();
    let cover_image = document
        .select(&cover_sel)
        .next()
        .and_then(|img| img.value().attr("src"))
        .map(|s| s.to_string());

    let author_block_sel = Selector::parse(selectors::AUTHOR_BLOCK).unwrap();
    let author_link_sel = Selector::parse(selectors::AUTHOR_LINK).unwrap();
    let author_img_sel = Selector::parse(selectors::AUTHOR_IMAGE).unwrap();

    let mut author_name = String::new();
    let mut author_image = String::new();
    let mut author_profile = String::new();

    if let Some(author_block) = document.select(&author_block_sel).next() {
        if let Some(link) = author_block.select(&author_link_sel).next() {
            author_name = link.text().collect::<Vec<_>>().join("").trim().to_string();
            author_profile = link.value().attr("href").unwrap_or("").to_string();
        }

        if let Some(img) = author_block.select(&author_img_sel).next() {
            author_image = img.value().attr("src").unwrap_or("").to_string();
        }
    }

    let meta_sel = Selector::parse(selectors::META_BLOCK).unwrap();
    let span_sel = Selector::parse(selectors::META_SPAN).unwrap();

    let mut published_date_raw: Option<String> = None;
    let mut reading_time: Option<String> = None;

    if let Some(meta_block) = document.select(&meta_sel).next() {
        for span in meta_block.select(&span_sel) {
            let text = span.text().collect::<Vec<_>>().join("").trim().to_string();

            if text.is_empty() || text == "·" {
                continue;
            }

            if text.contains("min read") {
                reading_time = Some(text.replace("~", ""));
            } else if !text.contains("Free:") {
                published_date_raw = Some(text);
            }
        }
    }

    let (published_date, updated_date) = published_date_raw
        .as_ref()
        .map(|d| parse_dates(d))
        .unwrap_or((None, None));

    let content_sel = Selector::parse(selectors::CONTENT).unwrap();
    let content = document
        .select(&content_sel)
        .next()
        .map(|c| c.inner_html())
        .unwrap_or_default();

    let tag_sel = Selector::parse(selectors::TAG_LINK).unwrap();

    let tags: Vec<String> = document
        .select(&tag_sel)
        .map(|a| {
            a.text()
                .collect::<Vec<_>>()
                .join("")
                .trim()
                .trim_start_matches('#')
                .to_string()
        })
        .collect();

    Some(ArticleData {
        slug,
        url,
        title,
        subtitle,
        cover_image,
        author: AuthorData {
            name: author_name,
            avatar: author_image,
            profile_url: author_profile,
        },
        reading_time,
        published_date,
        updated_date,
        content,
        tags,
    })
}

pub fn validate_html_response(html: &str) -> Result<(), CommandError> {
    if html.contains("Unable to identify the Medium article URL") {
        return Err(CommandError::not_found("Article not found"));
    }

    if html.contains("You sure that this is a valid Medium.com URL") {
        return Err(CommandError::bad_request("Invalid Medium URL"));
    }

    Ok(())
}
