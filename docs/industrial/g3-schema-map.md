# Industrial Module Schema Map (Gate G3)

**Module Token:** `industrialConfig`  
**Governing Document:** `docs/industrial/MEGAPLAN_MUSE_API_3D_V2.md` (§11, §33 G3)  
**Database Schema:** `public` (PostgreSQL 16)  
**Migration:** `Migration20261003211048.ts`

---

## 1. Architectural Principles & Ownership

1. **Table Ownership (§11.1):**
   - The `industrial-config` module owns snapshots, assets, configurations, revisions, evaluations, presentation receipts, quotes, quote lines, idempotency records, jobs, and audit events.
   - Core commerce tables (`product`, `product_variant`, `price_set`, etc.) are **never** mutated by raw SQL or direct foreign keys. Variant links are maintained as logical references (`variant_id`) validated at the service boundary.
2. **Append-Only Revisions (§11.3):**
   - Published snapshots and configuration revisions are strictly append-only. No in-place `UPDATE` of substantive content is permitted once published.
3. **Compound Unique Constraints (§11.2, §11.4):**
   - Database-level compound UNIQUE indexes prevent duplicate revisions, concurrent idempotency collisions, and variant duplicate active entries.
4. **Tenant Isolation (§11.2):**
   - Tenant scoping is enforced on `owner_id`. Foreign tenant queries return `404 Not Found` without disclosing resource existence.
5. **Exact Integer/Minor Currency Representation (§11.3, §20):**
   - `total_minor` and `subtotal_minor` use `numeric` (or string wire representations of exact minor units, e.g. integer cents in USD) avoiding IEEE-754 floating-point inaccuracies.

---

## 2. Comprehensive Table Definitions

### 2.1 `industrial_technical_snapshot`
Stores immutable, reviewed technical snapshots of industrial equipment variants.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `snp_...`) |
| `variant_id` | `text` | NO | — | Logical link to Medusa `product_variant.id` |
| `revision` | `integer` | NO | `1` | 1-based sequential revision |
| `state` | `text` | NO | `'draft'` | Lifecycle state: `draft`, `reviewed`, `published`, `retired` |
| `schema_version` | `text` | NO | `'technical_snapshot/2.0'` | Schema version identifier |
| `content_json` | `jsonb` | NO | — | Typed attributes, ports, mounting, dimensions, and evidence refs |
| `content_sha256` | `text` | NO | — | Canonical 64-char lowercase hex SHA-256 |
| `reviewed_by` | `text` | YES | `NULL` | Responsible technical engineer/operator |
| `published_at` | `timestamptz` | YES | `NULL` | Formal publication timestamp |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_technical_snapshot_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_snapshot_variant_revision_unique`: `UNIQUE (variant_id, revision) WHERE deleted_at IS NULL`
- `IDX_ind_snapshot_variant_state`: `INDEX (variant_id, state) WHERE deleted_at IS NULL`
- `IDX_ind_snapshot_content_sha256`: `INDEX (content_sha256) WHERE deleted_at IS NULL`

---

### 2.2 `industrial_catalog_entry`
Manages technical catalog availability, active snapshot pointer, and operational modes.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `cat_...`) |
| `variant_id` | `text` | NO | — | Logical link to Medusa `product_variant.id` |
| `active_snapshot_id` | `text` | YES | `NULL` | Logical FK to active `industrial_technical_snapshot.id` |
| `enabled` | `boolean` | NO | `true` | Catalog visibility toggle |
| `catalog_mode` | `text` | NO | `'production'` | Operational mode: `production`, `synthetic_demo`, `pilot` |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_catalog_entry_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_catalog_variant_unique`: `UNIQUE (variant_id) WHERE deleted_at IS NULL`
- `IDX_ind_catalog_mode`: `INDEX (catalog_mode) WHERE deleted_at IS NULL`

---

### 2.3 `industrial_asset`
Stores content-addressed binary assets (3D GLB models, datasheets, diagrams).

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `ast_...`) |
| `variant_id` | `text` | YES | `NULL` | Optional variant reference |
| `snapshot_id` | `text` | YES | `NULL` | Optional technical snapshot reference |
| `kind` | `text` | NO | — | Asset kind: `3d_model`, `datasheet`, `manual`, `diagram` |
| `revision` | `integer` | NO | `1` | Asset revision counter |
| `sha256` | `text` | NO | — | 64-char lowercase hex content hash |
| `bytes` | `integer` | NO | — | Exact binary byte length |
| `mime` | `text` | NO | — | MIME type (`model/gltf-binary`, `application/pdf`) |
| `storage_key` | `text` | NO | — | Server storage path / object store key |
| `visibility` | `text` | NO | `'public'` | Access scope: `public`, `authenticated`, `internal` |
| `state` | `text` | NO | `'active'` | State: `active`, `deprecated`, `draft` |
| `manifest_json` | `jsonb` | YES | `NULL` | Asset manifest (units, bbox, anchors, QA) |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_asset_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_asset_kind_sha256_unique`: `UNIQUE (kind, sha256) WHERE deleted_at IS NULL`
- `IDX_ind_asset_sha256`: `INDEX (sha256) WHERE deleted_at IS NULL`
- `IDX_ind_asset_variant_id`: `INDEX (variant_id) WHERE deleted_at IS NULL`

---

### 2.4 `industrial_asset_binding`
Associates technical snapshots with approved assets by binding role.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `asb_...`) |
| `snapshot_id` | `text` | NO | — | Logical FK to `industrial_technical_snapshot.id` |
| `asset_id` | `text` | NO | — | Logical FK to `industrial_asset.id` |
| `binding_kind` | `text` | NO | — | Role: `primary_3d`, `datasheet`, `wiring_diagram` |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_asset_binding_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_asset_binding_unique`: `UNIQUE (snapshot_id, asset_id, binding_kind) WHERE deleted_at IS NULL`
- `IDX_ind_asset_binding_snapshot`: `INDEX (snapshot_id) WHERE deleted_at IS NULL`
- `IDX_ind_asset_binding_asset`: `INDEX (asset_id) WHERE deleted_at IS NULL`

---

### 2.5 `industrial_configuration`
Top-level configuration envelope owned by a customer tenant or guest operator.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `cfg_...`) |
| `owner_id` | `text` | NO | — | Tenant identifier (e.g. `tenant-alice`, `user_...`) |
| `title` | `text` | NO | — | Human-readable configuration title |
| `current_revision` | `integer` | NO | `1` | Pointer to active revision sequence number |
| `lifecycle` | `text` | NO | `'draft'` | Lifecycle: `draft`, `active`, `archived` |
| `archived_at` | `timestamptz` | YES | `NULL` | Archive timestamp |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_configuration_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_config_owner_updated`: `INDEX (owner_id, updated_at DESC) WHERE deleted_at IS NULL`
- `IDX_ind_config_owner_lifecycle`: `INDEX (owner_id, lifecycle) WHERE deleted_at IS NULL`

---

### 2.6 `industrial_configuration_revision`
Append-only revision snapshots containing circuit graph, requirements, and focus.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `rev_...`) |
| `configuration_id` | `text` | NO | — | Logical FK to `industrial_configuration.id` |
| `revision` | `integer` | NO | — | Sequential revision index (1, 2, 3...) |
| `schema_version` | `text` | NO | `'configuration_revision/2.0'` | Schema version identifier |
| `graph_json` | `jsonb` | YES | `NULL` | Topology: equipment instances and connections |
| `requirements_json`| `jsonb` | YES | `NULL` | Engineering requirements and process parameters |
| `focus_json` | `jsonb` | YES | `NULL` | Primary target component or subsystem |
| `content_sha256` | `text` | NO | — | Canonical SHA-256 of graph/requirements/focus |
| `created_by` | `text` | YES | `NULL` | User or automated agent identifier |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_configuration_revision_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_config_rev_unique`: `UNIQUE (configuration_id, revision) WHERE deleted_at IS NULL`
- `IDX_ind_config_rev_config_id`: `INDEX (configuration_id) WHERE deleted_at IS NULL`

---

### 2.7 `industrial_evaluation`
Caches evaluation verdicts against immutable snapshot sets and rule versions.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `eval_...`) |
| `configuration_id` | `text` | YES | `NULL` | Optional configuration reference |
| `config_revision` | `integer` | YES | `NULL` | Optional configuration revision number |
| `input_sha256` | `text` | NO | — | Hash of evaluated requirements |
| `snapshot_set_json`| `jsonb` | YES | `NULL` | Pinned snapshot IDs & revisions used |
| `rules_version` | `text` | NO | — | Evaluator engine rule version identifier |
| `result_json` | `jsonb` | NO | — | Detailed satisfaction results and citations |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_evaluation_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_eval_config_rev`: `INDEX (configuration_id, config_revision) WHERE deleted_at IS NULL`
- `IDX_ind_eval_input_rules`: `INDEX (input_sha256, rules_version) WHERE deleted_at IS NULL`

---

### 2.8 `industrial_presentation_receipt`
Audit receipts for 3D engineering scene representations assembled for Meta Muse.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `rcpt_...`) |
| `owner_id` | `text` | NO | — | Tenant identifier |
| `configuration_id` | `text` | NO | — | Reference to evaluated configuration |
| `revision` | `integer` | NO | — | Evaluated revision index |
| `bundle_sha256` | `text` | NO | — | Cryptographic bundle checksum |
| `artifact_ref` | `text` | YES | `NULL` | Generated package reference |
| `assets_used_json` | `jsonb` | YES | `NULL` | List of GLB assets and anchors incorporated |
| `layout_json` | `jsonb` | YES | `NULL` | 3D placement coordinates and orientations |
| `validation_json` | `jsonb` | YES | `NULL` | Geometric boundary validation report |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_presentation_receipt_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_receipt_config_rev`: `INDEX (configuration_id, revision) WHERE deleted_at IS NULL`
- `IDX_ind_receipt_owner`: `INDEX (owner_id) WHERE deleted_at IS NULL`

---

### 2.9 `industrial_quote`
Correlated multi-item B2B commercial quotes linked to engineering configurations.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `quote_...`) |
| `owner_id` | `text` | NO | — | Tenant identifier |
| `config_id` | `text` | YES | `NULL` | Optional configuration reference |
| `config_revision` | `integer` | YES | `NULL` | Optional configuration revision number |
| `state` | `text` | NO | `'draft'` | State: `draft`, `issued`, `accepted`, `expired` |
| `currency` | `text` | NO | `'USD'` | ISO 4217 3-letter currency code |
| `scale` | `integer` | NO | `2` | Currency minor unit scale (2 for cents) |
| `total_minor` | `numeric` | YES | `NULL` | Exact integer minor unit total ($890.00 -> 89000) |
| `snapshot_json` | `jsonb` | YES | `NULL` | Complete commercial & technical snapshot |
| `expires_at` | `timestamptz` | YES | `NULL` | Quote validity expiration timestamp |
| `idempotency_id` | `text` | YES | `NULL` | Client-provided idempotency key |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_quote_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_quote_owner_created`: `INDEX (owner_id, created_at DESC) WHERE deleted_at IS NULL`
- `IDX_ind_quote_idempotency`: `INDEX (idempotency_id) WHERE deleted_at IS NULL`

---

### 2.10 `industrial_quote_line`
Individual variant line items within a correlated industrial quote.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `qline_...`) |
| `quote_id` | `text` | NO | — | Logical FK to `industrial_quote.id` |
| `line_number` | `integer` | NO | — | 1-based sequential line item position |
| `variant_id` | `text` | NO | — | Logical link to Medusa `product_variant.id` |
| `quantity` | `integer` | NO | — | Item count (strictly >= 1) |
| `snapshot_json` | `jsonb` | YES | `NULL` | Per-variant pricing and technical facts |
| `subtotal_minor` | `numeric` | YES | `NULL` | Exact subtotal in integer minor units |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_quote_line_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_quote_line_unique`: `UNIQUE (quote_id, line_number) WHERE deleted_at IS NULL`
- `IDX_ind_quote_line_quote_id`: `INDEX (quote_id) WHERE deleted_at IS NULL`

---

### 2.11 `industrial_idempotency`
Guarantees at-most-once execution for mutating requests and allows safe replay.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `idemp_...`) |
| `owner_id` | `text` | NO | — | Tenant identifier scoping the key |
| `operation` | `text` | NO | — | Operation code (e.g. `issue_quote`, `create_config`) |
| `key_hash` | `text` | NO | — | SHA-256 of client Idempotency-Key header |
| `body_hash` | `text` | NO | — | Canonical SHA-256 of request payload |
| `state` | `text` | NO | `'pending'` | State: `pending`, `in_progress`, `completed`, `failed` |
| `resource_id` | `text` | YES | `NULL` | Resulting created/updated entity identifier |
| `lease_expires_at`| `timestamptz` | YES | `NULL` | Lease expiration for concurrency control |
| `response_json` | `jsonb` | YES | `NULL` | Serialized cached response for replay |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_idempotency_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_idempotency_unique`: `UNIQUE (owner_id, operation, key_hash) WHERE deleted_at IS NULL`
- `IDX_ind_idempotency_lease`: `INDEX (state, lease_expires_at) WHERE deleted_at IS NULL`

---

### 2.12 `industrial_job`
Asynchronous job tracking for long-running processes (PDF compilation, thermal simulation).

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `job_...`) |
| `owner_id` | `text` | NO | — | Tenant identifier |
| `kind` | `text` | NO | — | Job type: `pdf_generation`, `thermal_simulation` |
| `state` | `text` | NO | `'pending'` | State: `pending`, `processing`, `completed`, `failed` |
| `attempt` | `integer` | NO | `0` | Execution attempt counter |
| `lease_owner` | `text` | YES | `NULL` | Worker instance hostname / worker ID |
| `lease_expires_at`| `timestamptz` | YES | `NULL` | Worker heartbeat expiration |
| `payload_ref` | `text` | YES | `NULL` | Reference to input configuration / parameters |
| `error_code` | `text` | YES | `NULL` | Error code if job failed |
| `created_at` | `timestamptz` | NO | `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_job_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_job_state_created`: `INDEX (state, created_at) WHERE deleted_at IS NULL`
- `IDX_ind_job_owner`: `INDEX (owner_id) WHERE deleted_at IS NULL`

---

### 2.13 `industrial_audit_event`
Tamper-evident audit trail for security and regulatory inspection.

| Column | PostgreSQL Type | Nullable | Default | Description / Constraint |
|---|---|---|---|---|
| `id` | `text` | NO | — | Primary key (e.g. `aud_...`) |
| `owner_id` | `text` | YES | `NULL` | Scoped tenant ID (if applicable) |
| `actor_id` | `text` | NO | — | Actor principal (user, service account, system) |
| `action` | `text` | NO | — | Action verb: `create`, `update_cas`, `publish`, `quote` |
| `resource_type` | `text` | NO | — | Target entity name (`configuration`, `snapshot`) |
| `resource_id` | `text` | NO | — | Identifier of modified entity |
| `request_id` | `text` | YES | `NULL` | Trace request ID |
| `details_json` | `jsonb` | YES | `NULL` | Sanitized delta or operation metadata |
| `created_at` | `timestamptz` | NO | `now()` | Event occurrence timestamp |
| `updated_at` | `timestamptz` | NO | `now()` | Last modification timestamp |
| `deleted_at` | `timestamptz` | YES | `NULL` | Soft deletion timestamp |

**Indexes & Constraints:**
- `industrial_audit_event_pkey`: `PRIMARY KEY (id)`
- `IDX_ind_audit_resource`: `INDEX (resource_type, resource_id) WHERE deleted_at IS NULL`
- `IDX_ind_audit_created`: `INDEX (created_at) WHERE deleted_at IS NULL`
- `IDX_ind_audit_owner`: `INDEX (owner_id) WHERE deleted_at IS NULL`
