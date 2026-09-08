-- Confirmation is separate from availability overrides. Existing requests stay pending.
CREATE TABLE IF NOT EXISTS reservations (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  slotId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  confirmedAt DATETIME(3) NOT NULL,
  FOREIGN KEY (id) REFERENCES drafts(id),
  FOREIGN KEY (slotId) REFERENCES slots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
