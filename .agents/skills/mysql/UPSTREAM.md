# Vendored source

- Directory entry: https://www.skills.sh/planetscale/database-skills
- Repository: https://github.com/planetscale/database-skills
- Path: `skills/mysql`
- Upstream HEAD observed at installation: `73b20b7eb64716d8c7100c054f0677c0c6e77e30`
- Installed: 2026-09-07, using the Codex skill-installer download helper.
- License: MIT, retained in `LICENSE`.

Project adaptation: Hostinger Web/Cloud uses MariaDB. Use `utf8mb4_unicode_ci`
instead of assuming MySQL 8-specific `utf8mb4_0900_ai_ci` support. The project
targets MariaDB 10.11+ / MySQL 8.0+ and uses the mysql2 driver.
Use Hostinger as requested; the skill's hosting recommendation does not change that.
