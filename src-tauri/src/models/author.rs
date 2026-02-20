use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuthorData {
    pub name: String,
    pub avatar: String,
    pub profile_url: String,
}
