use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandError {
    pub status_code: u16,
    pub error: String,
    pub message: String,
}

impl CommandError {
    pub fn not_found(message: &str) -> Self {
        Self {
            status_code: 404,
            error: "Not Found".to_string(),
            message: message.to_string(),
        }
    }

    pub fn bad_request(message: &str) -> Self {
        Self {
            status_code: 400,
            error: "Bad Request".to_string(),
            message: message.to_string(),
        }
    }

    pub fn internal(message: &str) -> Self {
        Self {
            status_code: 500,
            error: "Internal Server Error".to_string(),
            message: message.to_string(),
        }
    }
}
