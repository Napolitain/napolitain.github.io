---
title: "Idempotency and Retries (Without Multiplying Load)"
description: "Build a retry stack that survives crashes, duplicate delivery, and partial completion without turning transient failure into write amplification and data corruption."
date: 2026-04-27
tags: ["idempotency", "retries", "exactly-once", "backoff", "outbox", "deduplication"]
draft: false
family: "reliability"
kind: "building-block"
difficulty: "advanced"
prerequisites: []
related: ["designing-a-rate-limiter", "circuit-breakers", "load-shedding"]
enables: ["circuit-breakers"]
---

## Problem

The naive story is:

> if a request fails, retry it

The production story is:

> retries are a distributed write amplifier unless duplicate work is explicitly made safe

This matters anywhere a timeout can race with real execution:

- payment creation
- order placement
- webhook delivery
- job scheduling
- message consumption
- cross-region failover

A staff-level design answer starts by recognizing that **timeouts do not imply non-execution**. A client can time out after the server has already committed state. Without idempotency, a retry is not recovery. It is a second write.

## What idempotency actually means

An operation is idempotent if re-applying the *same logical request* produces the same durable effect.

That is not the same as:

- "the endpoint uses `PUT`"
- "the client sends the same JSON twice"
- "we de-duplicate in memory"

You need a stable definition of **request identity**.

The usual contract is:

```text
idempotency_key = client-generated unique key scoped to one logical operation
```

Examples:

- `payment:create:tenant123:01JV...`
- `checkout:confirm:user456:cart789:v3`

The key must be paired with:

- operation type
- tenant / account scope
- canonicalized request fingerprint

If the same key comes back with a different payload, that is a client bug or abuse attempt, not a valid retry.

## Core invariant

For a given `(scope, operation_type, idempotency_key)`:

1. at most one execution is allowed to commit the primary side effect
2. later duplicates must either:
   - return the already committed result, or
   - return "still in progress", or
   - return a deterministic terminal failure

That implies persistent coordination, not just local process state.

## State model

Use a durable idempotency record with a small state machine:

```text
ABSENT
  -> IN_PROGRESS
  -> SUCCEEDED
  -> FAILED_RETRYABLE
  -> FAILED_FINAL
```

Each record stores:

```text
scope
operation_type
idempotency_key
request_hash
status
owner_execution_id
response_code
response_body_reference
started_at
updated_at
expires_at
```

`owner_execution_id` matters because the holder can crash, time out, or be fenced off by a newer attempt.

## Storage choice

The idempotency table wants:

- atomic create-if-absent
- conditional updates
- TTL or retention management
- durable reads after restart

Good fits:

- Postgres with unique constraint and row-level compare/update
- Spanner / Cockroach / FoundationDB for globally visible workflows
- DynamoDB / Cassandra if the access pattern is narrow and conditional writes are supported cleanly

Bad fit:

- process memory
- Redis alone for operations whose side effect must survive Redis loss

If the business effect is durable, the idempotency record usually needs durability of the same class.

## Request flow

### Step 1: reserve the key

Atomically insert:

```text
status = IN_PROGRESS
owner_execution_id = UUID
request_hash = H(payload)
```

If insert succeeds, this execution owns the logical operation.

If the key already exists:

1. verify `request_hash` matches
2. branch on status

### Step 2: execute the side effect

This could mean:

- write to the primary database
- call a payment processor
- enqueue a downstream job

The execution must be careful not to finalize the idempotency record before the true business effect is durable.

### Step 3: finalize the record

Conditionally update:

```text
WHERE owner_execution_id = current_execution_id
```

and set:

```text
status = SUCCEEDED
response metadata = ...
```

That compare-and-set is what prevents a stale worker from overwriting a newer owner.

## Why request hash validation is mandatory

If you only key on `idempotency_key`, then clients can accidentally or maliciously reuse a key for a different request.

Example:

1. client sends `charge $10` with key `K`
2. request times out
3. client later sends `charge $1000` with the same key `K`

Without request-hash validation, the system may replay or return the wrong logical result.

A safe rule is:

```text
same key + different request hash => 409 Conflict
```

## Returning cached results

Once a request is `SUCCEEDED`, future duplicates should usually return the original response shape.

Two common approaches:

### Inline result storage

Store response code and compact response body directly in the idempotency row.

Good when:

- response payload is small
- retention window is short

### Response reference

Store a pointer to the durable business object:

```text
resource_type = "payment"
resource_id = "pay_123"
```

and reconstruct the response from source of truth.

Good when:

- responses are large
- object identity matters more than exact byte-for-byte replay

## Handling `IN_PROGRESS`

Duplicates arriving while the first attempt is still running are common.

Do **not** let them all execute.

Reasonable behaviors:

1. return `202 Accepted` / `409 In Progress`
2. block briefly waiting for completion if latency budget allows
3. redirect client to poll operation status

For expensive operations, polling is usually cleaner than holding open large numbers of waiting connections.

## Crash recovery

Now the hard part:

> what if the worker dies after doing the side effect but before marking `SUCCEEDED`?

This is why idempotency alone is not enough. You need it combined with a durable business record or an outbox/inbox pattern.

### Pattern: business write plus idempotency finalize in one transaction

If the business effect lives in the same database, the cleanest design is:

1. reserve key
2. execute business write
3. mark idempotency success

inside one transaction.

Then crash recovery is easy because either both happened or neither did.

### Pattern: outbox for external effects

If the side effect targets an external system:

1. write local business intent and outbox event transactionally
2. asynchronously deliver to external system
3. use consumer-side idempotency as well

That is how you avoid pretending "exactly once" exists over unreliable networks.

## Retrying external calls

Retries must be policy-based, not reflex-based.

Classify failures into:

- **retryable transient**: timeout, 503, network reset
- **retryable overload-aware**: 429 with retry budget and backoff
- **non-retryable**: validation error, auth failure, semantic conflict

The retry policy should include:

- max attempts
- total time budget
- exponential backoff
- full jitter
- per-call timeout smaller than overall deadline

Example:

```text
attempt 1: immediate
attempt 2: 100-200 ms
attempt 3: 300-600 ms
attempt 4: 700-1400 ms
```

Without jitter, a fleet will synchronize and hammer the same recovering dependency.

## Retry budgets

A powerful production technique is a **retry budget**.

Instead of allowing unlimited local retry logic, bound retries as a fraction of successful traffic:

```text
retry_budget <= 20% of baseline request volume
```

Why this matters:

- during dependency failure, retries can exceed original traffic
- the system starts spending capacity on repeated work instead of useful work

Budgets are a better control surface than "3 retries everywhere".

## Interaction with circuit breakers

Retries without a circuit breaker extend outages.

The correct layering is:

1. short timeout
2. bounded retries with jitter
3. circuit breaker around repeated dependency failure
4. optional fallback path

If the dependency is already known unhealthy, the breaker should reject early instead of letting every request consume its whole retry plan.

## Interaction with load shedding

Retries are not free.

When the local system is saturated:

- stop retrying low-priority work
- reduce retry attempts
- widen backoff
- reject speculative background retries first

Otherwise a service under stress can self-amplify into collapse.

## Message consumers and idempotency

The same problem appears in queues and streams because delivery is often at-least-once.

Consumer rule:

```text
record message_id / business key before applying side effect
```

Then on duplicate delivery:

- detect prior completion
- skip duplicate mutation

This is the same design, just moved from HTTP request handling to asynchronous consumption.

## Schema example

```sql
CREATE TABLE idempotency_records (
  scope TEXT NOT NULL,
  operation_type TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash BYTEA NOT NULL,
  status TEXT NOT NULL,
  owner_execution_id UUID NOT NULL,
  response_code INT,
  response_ref_type TEXT,
  response_ref_id TEXT,
  started_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (scope, operation_type, idempotency_key)
);
```

Important indexes often include:

- primary key for point lookup
- expiration index for cleanup
- optional status index for operational recovery tooling

## Cleanup and retention

Idempotency state cannot live forever.

Retention should reflect:

- client retry horizon
- payment / billing reconciliation needs
- storage cost

Examples:

- 24 hours for public API dedupe
- 7 days for financial workflows

Deleting too early is effectively removing the safety guarantee while clients may still retry.

## Common failure cases

### 1. side effect commits before dedupe record

Then crash recovery can double-apply work.

### 2. dedupe record stored in weaker durability than business effect

Then after failover the system forgets prior execution.

### 3. same idempotency key shared across tenants

This causes cross-tenant contamination unless scope is part of the key space.

### 4. replaying stale `IN_PROGRESS` forever

You need ownership, expiry, and fencing, not a permanent stuck state.

### 5. retrying validation failures

This wastes load and obscures client bugs.

## What the senior answer sounds like

> I would model retries and idempotency as one reliability subsystem. Clients send an idempotency key, the server stores a durable idempotency record keyed by tenant plus operation plus key, and validates a request hash so the same key cannot represent different intents. The first execution atomically reserves the key, performs the business effect, and then conditionally finalizes the record with the original response or a reference to the created object. Retries use exponential backoff with full jitter and a retry budget so transient failure does not multiply load. If the operation spans external systems, I would pair the idempotency record with an outbox or consumer-side dedupe rather than claiming exactly-once delivery. The core design goal is not more retries. It is safe duplicate suppression under crash and timeout races.

## Key takeaways

- Retries without idempotency create duplicate writes.
- Idempotency is about **logical operation identity**, not HTTP verbs.
- Validate **request hash** so one key cannot be reused for a different intent.
- Use durable compare-and-set ownership so stale executions cannot finalize the wrong result.
- Pair retries with **timeouts, jitter, retry budgets, circuit breakers, and load shedding**.
