-- Initial additive schema. Compatible with MariaDB 10.11+ and MySQL 8.0+.
-- UTC DATETIME values; local dates are interpreted in America/Argentina/Buenos_Aires.
-- utf8mb4_unicode_ci avoids MySQL 8-specific collations on MariaDB.
CREATE TABLE IF NOT EXISTS application_lock (pk INT NOT NULL PRIMARY KEY) ENGINE=InnoDB;
INSERT IGNORE INTO application_lock (pk) VALUES (1);

CREATE TABLE IF NOT EXISTS `sports` (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL, icon VARCHAR(80) NOT NULL, isActive BOOLEAN NOT NULL,
  INDEX idx_sports_active (isActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `zones` (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  name VARCHAR(10) NOT NULL UNIQUE,
  CHECK (name IN ('CABA', 'SUR', 'NORTE', 'NOROESTE', 'OESTE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `venues` (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL, zoneId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  address VARCHAR(250) NOT NULL, latitude DECIMAL(10,7) NOT NULL, longitude DECIMAL(10,7) NOT NULL,
  description VARCHAR(2000) NOT NULL, whatsappNumber VARCHAR(16) NOT NULL, isActive BOOLEAN NOT NULL,
  FOREIGN KEY (zoneId) REFERENCES zones(id),
  INDEX idx_venues_zone_active (zoneId, isActive),
  CHECK (latitude BETWEEN -90 AND 90), CHECK (longitude BETWEEN -180 AND 180)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `venueSports` (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  venueId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, sportId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, isActive BOOLEAN NOT NULL,
  UNIQUE KEY uq_venue_sport (venueId, sportId),
  FOREIGN KEY (venueId) REFERENCES venues(id), FOREIGN KEY (sportId) REFERENCES sports(id),
  INDEX idx_sport_active_venue (sportId, isActive, venueId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `slots` (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  venueId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, sportId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  startsAt DATETIME(3) NOT NULL, endsAt DATETIME(3) NOT NULL, status VARCHAR(12) NOT NULL,
  FOREIGN KEY (venueId, sportId) REFERENCES venueSports(venueId, sportId),
  CHECK (endsAt > startsAt), CHECK (status IN ('AVAILABLE', 'UNAVAILABLE')),
  INDEX idx_availability (venueId, sportId, status, startsAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `drafts` (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  sportId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL, zoneId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL, venueId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL, slotId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
  renterFirstName VARCHAR(80) NULL, renterLastName VARCHAR(80) NULL, renterPhone VARCHAR(16) NULL,
  date CHAR(10) NULL,
  FOREIGN KEY (sportId) REFERENCES sports(id), FOREIGN KEY (zoneId) REFERENCES zones(id),
  FOREIGN KEY (venueId) REFERENCES venues(id), FOREIGN KEY (slotId) REFERENCES slots(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

