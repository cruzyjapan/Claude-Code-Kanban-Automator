-- Migration: Add custom_prompt_instructions column to user_settings table
-- Date: 2025-01-18

-- Add the custom_prompt_instructions column if it doesn't exist
ALTER TABLE user_settings ADD COLUMN custom_prompt_instructions TEXT DEFAULT '';