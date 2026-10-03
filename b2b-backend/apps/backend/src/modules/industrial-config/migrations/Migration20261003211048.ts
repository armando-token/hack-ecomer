import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261003211048 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "industrial_technical_snapshot" drop constraint if exists "ind_snapshot_variant_revision_unique";`);
    this.addSql(`alter table if exists "industrial_quote_line" drop constraint if exists "ind_quote_line_unique";`);
    this.addSql(`alter table if exists "industrial_idempotency" drop constraint if exists "ind_idempotency_unique";`);
    this.addSql(`alter table if exists "industrial_configuration_revision" drop constraint if exists "ind_config_rev_unique";`);
    this.addSql(`alter table if exists "industrial_catalog_entry" drop constraint if exists "ind_catalog_variant_unique";`);
    this.addSql(`alter table if exists "industrial_catalog_entry" drop constraint if exists "industrial_catalog_entry_variant_id_unique";`);
    this.addSql(`alter table if exists "industrial_asset_binding" drop constraint if exists "ind_asset_binding_unique";`);
    this.addSql(`alter table if exists "industrial_asset" drop constraint if exists "ind_asset_kind_sha256_unique";`);
    this.addSql(`create table if not exists "industrial_asset" ("id" text not null, "variant_id" text null, "snapshot_id" text null, "kind" text not null, "revision" integer not null default 1, "sha256" text not null, "bytes" integer not null, "mime" text not null, "storage_key" text not null, "visibility" text not null default 'public', "state" text not null default 'active', "manifest_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_asset_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_asset_deleted_at" ON "industrial_asset" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_asset_kind_sha256_unique" ON "industrial_asset" ("kind", "sha256") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_asset_sha256" ON "industrial_asset" ("sha256") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_asset_variant_id" ON "industrial_asset" ("variant_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_asset_binding" ("id" text not null, "snapshot_id" text not null, "asset_id" text not null, "binding_kind" text not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_asset_binding_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_asset_binding_deleted_at" ON "industrial_asset_binding" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_asset_binding_unique" ON "industrial_asset_binding" ("snapshot_id", "asset_id", "binding_kind") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_asset_binding_snapshot" ON "industrial_asset_binding" ("snapshot_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_asset_binding_asset" ON "industrial_asset_binding" ("asset_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_audit_event" ("id" text not null, "owner_id" text null, "actor_id" text not null, "action" text not null, "resource_type" text not null, "resource_id" text not null, "request_id" text null, "details_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_audit_event_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_audit_event_deleted_at" ON "industrial_audit_event" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_audit_resource" ON "industrial_audit_event" ("resource_type", "resource_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_audit_created" ON "industrial_audit_event" ("created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_audit_owner" ON "industrial_audit_event" ("owner_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_catalog_entry" ("id" text not null, "variant_id" text not null, "active_snapshot_id" text null, "enabled" boolean not null default true, "catalog_mode" text not null default 'production', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_catalog_entry_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_industrial_catalog_entry_variant_id_unique" ON "industrial_catalog_entry" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_catalog_entry_deleted_at" ON "industrial_catalog_entry" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_catalog_variant_unique" ON "industrial_catalog_entry" ("variant_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_catalog_mode" ON "industrial_catalog_entry" ("catalog_mode") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_configuration" ("id" text not null, "owner_id" text not null, "title" text not null, "current_revision" integer not null default 1, "lifecycle" text not null default 'draft', "archived_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_configuration_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_configuration_deleted_at" ON "industrial_configuration" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_config_owner_updated" ON "industrial_configuration" ("owner_id", "updated_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_config_owner_lifecycle" ON "industrial_configuration" ("owner_id", "lifecycle") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_configuration_revision" ("id" text not null, "configuration_id" text not null, "revision" integer not null, "schema_version" text not null default 'configuration_revision/2.0', "graph_json" jsonb null, "requirements_json" jsonb null, "focus_json" jsonb null, "content_sha256" text not null, "created_by" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_configuration_revision_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_configuration_revision_deleted_at" ON "industrial_configuration_revision" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_config_rev_unique" ON "industrial_configuration_revision" ("configuration_id", "revision") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_config_rev_config_id" ON "industrial_configuration_revision" ("configuration_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_evaluation" ("id" text not null, "configuration_id" text null, "config_revision" integer null, "input_sha256" text not null, "snapshot_set_json" jsonb null, "rules_version" text not null, "result_json" jsonb not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_evaluation_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_evaluation_deleted_at" ON "industrial_evaluation" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_eval_config_rev" ON "industrial_evaluation" ("configuration_id", "config_revision") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_eval_input_rules" ON "industrial_evaluation" ("input_sha256", "rules_version") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_idempotency" ("id" text not null, "owner_id" text not null, "operation" text not null, "key_hash" text not null, "body_hash" text not null, "state" text not null default 'pending', "resource_id" text null, "lease_expires_at" timestamptz null, "response_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_idempotency_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_idempotency_deleted_at" ON "industrial_idempotency" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_idempotency_unique" ON "industrial_idempotency" ("owner_id", "operation", "key_hash") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_idempotency_lease" ON "industrial_idempotency" ("state", "lease_expires_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_job" ("id" text not null, "owner_id" text not null, "kind" text not null, "state" text not null default 'pending', "attempt" integer not null default 0, "lease_owner" text null, "lease_expires_at" timestamptz null, "payload_ref" text null, "error_code" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_job_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_job_deleted_at" ON "industrial_job" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_job_state_created" ON "industrial_job" ("state", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_job_owner" ON "industrial_job" ("owner_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_presentation_receipt" ("id" text not null, "owner_id" text not null, "configuration_id" text not null, "revision" integer not null, "bundle_sha256" text not null, "artifact_ref" text null, "assets_used_json" jsonb null, "layout_json" jsonb null, "validation_json" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_presentation_receipt_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_presentation_receipt_deleted_at" ON "industrial_presentation_receipt" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_receipt_config_rev" ON "industrial_presentation_receipt" ("configuration_id", "revision") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_receipt_owner" ON "industrial_presentation_receipt" ("owner_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_quote" ("id" text not null, "owner_id" text not null, "config_id" text null, "config_revision" integer null, "state" text not null default 'draft', "currency" text not null default 'USD', "scale" integer not null default 2, "total_minor" numeric null, "snapshot_json" jsonb null, "expires_at" timestamptz null, "idempotency_id" text null, "raw_total_minor" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_quote_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_quote_deleted_at" ON "industrial_quote" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_quote_owner_created" ON "industrial_quote" ("owner_id", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_quote_idempotency" ON "industrial_quote" ("idempotency_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_quote_line" ("id" text not null, "quote_id" text not null, "line_number" integer not null, "variant_id" text not null, "quantity" integer not null, "snapshot_json" jsonb null, "subtotal_minor" numeric null, "raw_subtotal_minor" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_quote_line_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_quote_line_deleted_at" ON "industrial_quote_line" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_quote_line_unique" ON "industrial_quote_line" ("quote_id", "line_number") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_quote_line_quote_id" ON "industrial_quote_line" ("quote_id") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "industrial_technical_snapshot" ("id" text not null, "variant_id" text not null, "revision" integer not null default 1, "state" text not null default 'draft', "schema_version" text not null default 'technical_snapshot/2.0', "content_json" jsonb not null, "content_sha256" text not null, "reviewed_by" text null, "published_at" timestamptz null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "industrial_technical_snapshot_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_industrial_technical_snapshot_deleted_at" ON "industrial_technical_snapshot" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_ind_snapshot_variant_revision_unique" ON "industrial_technical_snapshot" ("variant_id", "revision") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_snapshot_variant_state" ON "industrial_technical_snapshot" ("variant_id", "state") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_ind_snapshot_content_sha256" ON "industrial_technical_snapshot" ("content_sha256") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "industrial_asset" cascade;`);

    this.addSql(`drop table if exists "industrial_asset_binding" cascade;`);

    this.addSql(`drop table if exists "industrial_audit_event" cascade;`);

    this.addSql(`drop table if exists "industrial_catalog_entry" cascade;`);

    this.addSql(`drop table if exists "industrial_configuration" cascade;`);

    this.addSql(`drop table if exists "industrial_configuration_revision" cascade;`);

    this.addSql(`drop table if exists "industrial_evaluation" cascade;`);

    this.addSql(`drop table if exists "industrial_idempotency" cascade;`);

    this.addSql(`drop table if exists "industrial_job" cascade;`);

    this.addSql(`drop table if exists "industrial_presentation_receipt" cascade;`);

    this.addSql(`drop table if exists "industrial_quote" cascade;`);

    this.addSql(`drop table if exists "industrial_quote_line" cascade;`);

    this.addSql(`drop table if exists "industrial_technical_snapshot" cascade;`);
  }

}
