ALTER TYPE "public"."llm_provider" ADD VALUE 'groq' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."llm_provider" ADD VALUE 'together_ai' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."llm_provider" ADD VALUE 'deepseek' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."llm_provider" ADD VALUE 'perplexity' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."llm_provider" ADD VALUE 'kimi' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."llm_provider" ADD VALUE 'bedrock' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."llm_provider" ADD VALUE 'ollama' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "model_pricing" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"input_micro_per_token" integer NOT NULL,
	"output_micro_per_token" integer NOT NULL,
	"context_window" integer,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "model_pricing_model_unique" UNIQUE("model")
);
--> statement-breakpoint
CREATE INDEX "model_pricing_provider_idx" ON "model_pricing" USING btree ("provider");