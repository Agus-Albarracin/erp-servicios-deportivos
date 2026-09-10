-- Manual acknowledgement of payments made outside the platform.
-- Existing confirmations retain their state; no total payment is inferred.
CREATE TABLE IF NOT EXISTS reservationPayments (
  id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  totalPaidAt DATETIME(3) NOT NULL,
  FOREIGN KEY (id) REFERENCES reservations(id)
) ENGINE=InnoDB;
