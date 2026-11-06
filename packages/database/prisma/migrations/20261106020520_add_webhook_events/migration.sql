-- CreateTable
CREATE TABLE "webhook_events" (
    "id" UUID NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMPTZ(3),
    "error" VARCHAR(500),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_events_processed_created_at_idx" ON "webhook_events"("processed", "created_at");
