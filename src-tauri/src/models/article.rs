use serde::{Deserialize, Serialize};

use super::author::AuthorData;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleSummary {
    pub slug: String,
    pub url: String,
    pub title: String,
    pub subtitle: String,
    pub cover_image: Option<String>,
    pub author: AuthorData,
    pub reading_time: Option<String>,
    pub published_date: Option<String>,
    pub updated_date: Option<String>,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArticleData {
    pub slug: String,
    pub url: String,
    pub title: String,
    pub subtitle: String,
    pub cover_image: Option<String>,
    pub author: AuthorData,
    pub reading_time: Option<String>,
    pub published_date: Option<String>,
    pub updated_date: Option<String>,
    pub content: String,
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
    pub articles: Vec<ArticleSummary>,
    pub count: i64,
}
