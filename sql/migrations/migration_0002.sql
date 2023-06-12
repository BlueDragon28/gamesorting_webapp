-- Migration 0002
-- Add ReverseOrder column to listSorting table

ALTER TABLE listSorting ADD COLUMN IF NOT EXISTS ReverseOrder BOOLEAN DEFAULT FALSE;
