/*
  # Add pro bono field to lawyers

  1. Changes
    - Add `pro_bono` boolean column to lawyers table with default false
    - Add check constraint to ensure value is not null
*/

ALTER TABLE lawyers
ADD COLUMN pro_bono boolean NOT NULL DEFAULT false;