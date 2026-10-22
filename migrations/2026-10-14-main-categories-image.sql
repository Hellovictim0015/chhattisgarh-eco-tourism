-- Adds an optional image to main categories.
-- Run once on every database (local, staging, production) before deploying the code that uses it.
ALTER TABLE main_categories ADD COLUMN image VARCHAR(500) NULL AFTER slug;
