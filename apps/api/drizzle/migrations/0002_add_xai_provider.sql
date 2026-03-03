-- Migration: add 'xai' to llm_provider enum
-- PostgreSQL requires ALTER TYPE ... ADD VALUE for enum extensions.
-- This is safe and non-destructive — existing rows are unaffected.

ALTER TYPE llm_provider ADD VALUE IF NOT EXISTS 'xai';
