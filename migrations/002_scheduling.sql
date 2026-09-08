-- Additive, re-runnable tables. Existing slots and drafts are preserved.
CREATE TABLE IF NOT EXISTS calendarSettings (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  calendarEnabled BOOLEAN NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS availabilitySchedules (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  venueId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  sportId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  isActive BOOLEAN NOT NULL, weekdays INT NOT NULL,
  opensAt CHAR(5) NOT NULL, closesAt CHAR(5) NOT NULL,
  durationMinutes INT NOT NULL, horizonDays INT NOT NULL,
  UNIQUE KEY uq_schedule_pair (venueId, sportId),
  FOREIGN KEY (venueId, sportId) REFERENCES venueSports(venueId, sportId),
  CHECK (weekdays BETWEEN 1 AND 127),
  CHECK (durationMinutes BETWEEN 15 AND 720),
  CHECK (horizonDays BETWEEN 1 AND 365)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS blockedDays (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  venueId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  date CHAR(10) NOT NULL, reason VARCHAR(120) NOT NULL,
  UNIQUE KEY uq_blocked_venue_date (venueId, date),
  FOREIGN KEY (venueId) REFERENCES venues(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE TABLE IF NOT EXISTS generatedSlots (
  pk BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL UNIQUE,
  scheduleId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  FOREIGN KEY (id) REFERENCES slots(id),
  FOREIGN KEY (scheduleId) REFERENCES availabilitySchedules(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
