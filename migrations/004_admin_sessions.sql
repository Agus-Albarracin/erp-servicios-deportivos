-- Shared administrative sessions; store only hashes of random cookie identifiers.
CREATE TABLE IF NOT EXISTS admin_sessions (
  tokenHash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  expiresAt BIGINT UNSIGNED NOT NULL,
  INDEX admin_sessions_expiry (expiresAt)
) ENGINE=InnoDB;
