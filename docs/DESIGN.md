# System Design Answers - Round 2 (Low-Level) & Round 3 (High-Level)

This document answers the two interview-style rounds for the
**Instagram-Style Photo & Short Video Platform** and explains how each answer
is (or would be) implemented in this repository.

---

# PART 1 - ROUND 2: LOW-LEVEL DESIGN (30 marks)

## Task 1 & 2 - REST APIs with HTTP method and URI

| # | Purpose | Method | URI | Request | Response |
|---|---------|--------|-----|---------|----------|
| 1 | Upload media (create post) | **POST** | `/api/posts` | `multipart/form-data`: `file`, `caption`, `userId` | `201` + post JSON |
| 2 | Get post details | **GET** | `/api/posts/{id}` | query `userId` (optional, to know if *I* liked it) | `200` + post JSON |
| 3 | Follow user | **POST** | `/api/users/{id}/follow` | query `followerId` | `201` + message |
| 4 | Like post | **POST** | `/api/posts/{id}/likes` | query `userId` | `201` + message |
| 5 | Add comment | **POST** | `/api/posts/{id}/comments` | JSON `{ "userId", "text" }` | `201` + comment JSON |

Supporting endpoints: `POST/GET /api/users`, `GET /api/users/{id}`,
`GET /api/posts` (feed), `DELETE /api/posts/{id}/likes` (unlike),
`DELETE /api/users/{id}/follow` (unfollow),
`GET /api/posts/{id}/comments` (list comments).

Design notes:

* Nouns, plural, nested resources (`/posts/{id}/comments`) - standard REST.
* HTTP verbs carry the meaning: `POST` create, `GET` read, `DELETE` undo.
* Server-side state-changing calls take the acting user id explicitly
  (`userId` / `followerId`) because this project has no login; in production
  it would come from the authenticated JWT/session instead.

## Task 3 - Upload Media API (request & response)

**Request**

```http
POST /api/posts HTTP/1.1
Host: localhost:8080
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="beach.jpg"
Content-Type: image/jpeg

<binary bytes>
------WebKitFormBoundary
Content-Disposition: form-data; name="caption"

Summer vibes
------WebKitFormBoundary
Content-Disposition: form-data; name="userId"

1
------WebKitFormBoundary--
```

**Success response - `201 Created`**

```json
{
  "id": 7,
  "user": { "id": 1, "username": "alice", "profileImage": null },
  "caption": "Summer vibes",
  "mediaUrl": "/uploads/8f3c1d4e-4a2b-4c6d-9e10-abcdef012345.jpg",
  "mediaType": "IMAGE",
  "createdAt": "2026-10-12T14:30:00",
  "likeCount": 0,
  "commentCount": 0,
  "likedByCurrentUser": false
}
```

**Failure response - `400 Bad Request`**

```json
{
  "timestamp": "2026-10-12T14:30:00",
  "status": 400,
  "error": "Bad Request",
  "message": "unsupported file type: image/tiff (allowed: jpg, png, gif, webp, mp4, webm, mov)",
  "path": "/api/posts"
}
```

Rules enforced by the service: file present, content type in the allow-list,
size <= 50 MB, user exists. Only `mediaUrl` (a path) is stored in MySQL - the
bytes live in `uploads/`.

## Task 4 - HTTP status codes

| Code | When | Example |
|------|------|---------|
| **200 OK** | Read succeeded or a delete/undo succeeded | `GET /api/posts`, `DELETE .../likes` |
| **201 Created** | A new resource was created | create user, upload post, like, follow, comment |
| **400 Bad Request** | Client-side validation failed | duplicate username, duplicate like, wrong file type, empty comment, self-follow |
| **404 Not Found** | Resource id does not exist | `GET /api/posts/999` |
| **500 Internal Server Error** | Unexpected server/disk failure | cannot write to `uploads/` |
| 401/403 | (Reserved) would be used once authentication exists | - |
| 409 Conflict | (Reserved) alternative for duplicates; this project uses 400 for simplicity | - |
| 413 Payload Too Large | (Reserved) if the multipart limit is exceeded | - |

## Task 5 - Sequence: upload -> process -> publish -> feed

```text
User        Mobile/Web UI      API (Spring Boot)     Storage (uploads/)     MySQL        Media Processor        Feed Service
 |               |                    |                     |                 |                |                     |
 | 1 Select media|                    |                     |                 |                |                     |
 |-------------->|                    |                     |                 |                |                     |
 | 2 Choose file + caption            |                     |                 |                |                     |
 |-------------->|                    |                     |                 |                |                     |
 |               | 3 POST /api/posts  |                     |                 |                |                     |
 |               |  (multipart)       |                     |                 |                |                     |
 |               |------------------->| 4 validate type/size/user             |                |                     |
 |               |                    |------------------X (400 on failure)   |                |                     |
 |               |                    | 5 save file bytes  |                 |                |                     |
 |               |                    |------------------->|                 |                |                     |
 |               |                    | 6 "media.uploaded" event             |                |                     |
 |               |                    |------------------------------------->| (queue)        |                     |
 |               |                    |                     |                 | 7 transcode /  |                     |
 |               |                    |                     |                 |    thumbnail   |                     |
 |               |                    |                     |                 |<---------------|                     |
 |               |                    | 8 save post row (userId, caption, mediaUrl, mediaType)                     |
 |               |                    |------------------------------------->|                |                     |
 |               | 9 201 Created + post JSON                                 |                |                     |
 |               |<-------------------|                     |                 |                |                     |
 |               |                    | 10 "post.published" event            |                |                     |
 |               |                    |------------------------------------->|                | update caches /     |
 |               |                    |                     |                 |                | notify followers    |
 | 11 Open home  |  GET /api/posts    |                     |                 |                |<--------------------|
 |<--------------|------------------->| read (cache first)  |                 |                |                     |
 |               | 12 200 feed JSON   |                     |                 |                |                     |
 |<--------------|<-------------------|                     |                 |                |                     |
```

In this beginner project steps 6-8 and 10 run **inside the same request**
(`PostService.processMedia(...)` is a synchronous placeholder); the rest of the
flow is implemented exactly as drawn.

## Task 6 - Add Comment API

```http
POST /api/posts/{id}/comments
Content-Type: application/json

{ "userId": 2, "text": "Great shot!" }
```

* `201 Created` -> returns the created comment, e.g.

```json
{
  "id": 12,
  "user": { "id": 2, "username": "bob", "profileImage": null },
  "postId": 7,
  "text": "Great shot!",
  "createdAt": "2026-10-12T14:35:00"
}
```

* `400` - empty or > 500 character text / unknown user.
* `404` - post id does not exist.
* Companion read endpoint `GET /api/posts/{id}/comments` -> `200` with a
  newest-last list of comments (each carries its author's username).

---

# PART 2 - ROUND 3: HIGH-LEVEL SYSTEM DESIGN (25 marks)

## Task 1 - System architecture

```text
                         +---------------------------+
      Mobile app ------> |                           |
      (iOS/Android)      |   API layer / gateway     |  - TLS, rate limiting,
                         |  (REST + JSON, auth JWT)  |    caching, load balancing
      Web app (Next.js)->|                           |
                         +-------------+-------------+
                                       |
        +--------------+--------------+--------------+--------------+
        |              |              |              |              |
   +----v----+   +-----v-----+  +-----v-----+  +-----v-----+  +-----v------+
   |  User   |   |   Media   |  |   Post    |  |   Feed    |  |Notification|
   | service |   |  upload   |  |  service  |  |  service  |  |   service  |
   | profile,|   |  service  |  | posts,    |  | timelines,|  | push,      |
   | follow  |   | pre-signed|  | likes,    |  | ranking   |  | in-app,    |
   |         |   | URL,      |  | comments  |  |           |  | email      |
   +----+----+   +-----+-----+  +-----+-----+  +-----+-----+  +-----+------+
        |              |              |              |              |
        |              v              |              |              |
        |      +---------------+      |              |              |
        |      | Media         |      |              |              |
        |      | processing    |      |              |              |
        |      | workers       |      |              |              |
        |      | (transcode,   |      |              |              |
        |      |  thumbnails)  |      |              |              |
        |      +---------------+      |              |              |
        |              |              |              |              |
   +----v--------------v--------------v--------------v--------------v----+
   |                     Data & infrastructure layer                      |
   |  MySQL (primary + read replicas)   Redis (cache, sessions, counters) |
   |  Object storage (S3) + CDN         Message queue (Kafka / RabbitMQ)  |
   +----------------------------------------------------------------------+
```

Responsibilities:

| Service | Responsibility |
|---|---|
| User service | profiles, follow/unfollow, follower graphs |
| Media upload service | accepts bytes (or issues pre-signed upload URLs), validates, writes to object storage, emits `media.uploaded` |
| Media processing workers | consume `media.uploaded`: image resize, video transcoding (mp4 -> HLS), thumbnails, virus scan; emit `media.ready` |
| Post service | creates/reads posts, likes, comments; publishes `post.published` |
| Feed service | builds and serves timelines (fan-out on post, fan-out on read) |
| Notification service | consumes like/comment/follow events, sends push/in-app notifications |

**In this repository all of these live in one Spring Boot app**
(`controller` + `service` + `repository` + MySQL) as required by Part 7 - the
boundaries above map to the service classes, so a later split into real
microservices is mechanical.

## Task 2 - REST API communication (client <-> backend)

```text
Next.js / mobile app
   |  fetch("http://localhost:8080/api/posts")   JSON over HTTP/1.1
   v
Spring Boot  ----  CORS header Access-Control-Allow-Origin: http://localhost:3000
   |  JDBC
   v
 MySQL

Rules used here:
 * JSON bodies for ordinary data, multipart/form-data for uploads.
 * One configuration file holds the base URL (lib/api.js / API_BASE_URL).
 * Errors return the proper status code + { message } so the UI can show it.
 * In production: HTTPS only, JWT in the Authorization header, API gateway
   in front of the services, HTTP/2 + gzip.
```

## Task 3 - Database selection

| Data | Store | Why | Scale-out path |
|---|---|---|---|
| Users, profiles | **MySQL** (`users`) | small, relational, transactional | read replica for profile reads |
| Posts metadata | **MySQL** (`posts`) | joins with users, transactional writes | shard by `userId`, or wide-column store for very hot feeds |
| Media bytes | **Local `uploads/` folder** here | simplest for learning | S3/GCS object storage + CDN |
| Followers | **MySQL** (`follows`, unique pair) | simple graph, one hop | graph DB only if multi-hop queries dominate |
| Interactions (likes, comments) | **MySQL** (`likes`, `comments`) | unique constraints stop duplicates, easy counts | append-only stores + analytics warehouse |
| Feed/timeline cache | *(not used yet)* | - | Redis sorted sets per user |
| Search / recommendations | *(out of scope)* | - | Elasticsearch |

Why a relational DB and not a NoSQL store: the data is strongly relational,
volume in the learning project is small, and JPA + MySQL gives transactions,
unique constraints and joins for free. When read volume grows, the same schema
moves to a primary + read-replica MySQL pair without changing the code.

## Task 4 - Caching

Skip Redis now (Part 7.4). Planned layers and invalidation:

| What | Where | Key / structure | TTL | Invalidation |
|---|---|---|---|---|
| Popular posts | Redis | `post:{id}` -> post JSON | 5 - 15 min | on like/comment/caption update, delete `post:{id}` |
| User profile | Redis | `user:{id}` -> profile + counts | 5 min | on new post / follow change, delete key |
| Home feed | Redis | `feed:{userId}` -> sorted set of post ids (ZSET by createdAt) | 1 - 10 min | on `post.published` by a followed user, `ZADD` the id into each follower's feed |
| Like/comment counters | Redis `INCR` | `post:{id}:likes` | none (write-through) | async flush to MySQL |
| HTTP layer | CDN / browser | `GET /uploads/*`, `GET /api/posts` | short | cache-busting on publish |

In this beginner build the equivalent is simply a fast indexed MySQL query
(`findAllByOrderByCreatedAtDesc`) plus browser caching of the images; adding
`spring-boot-starter-data-redis` and a `@Cacheable` annotation on the service
methods would switch the caching on with almost no code change.

## Task 5 - Messaging

No Kafka/RabbitMQ installed now - media processing is a method call
(`PostService.processMedia`). The future queue-based design:

| Event | Producer | Topic / queue | Consumer | Work done |
|---|---|---|---|---|
| `media.uploaded` | upload service | `media.uploaded` | media workers | transcode, thumbnails, validation |
| `post.published` | post service | `post.published` | feed service, notification service | fan-out to followers, cache warm-up |
| `post.liked` | post service | `post.liked` | notification service, counter service | notify author, bump counters |
| `comment.created` | post service | `comment.created` | notification service | notify author + parent commenter |
| `user.followed` | user service | `user.followed` | notification service, feed service | notify, extend fan-out |

Design rules: events are small JSON payloads with an id (idempotent
consumers), topics are partitioned by `postId`/`userId` so ordering per entity
holds, and dead-letter queues capture failures. Migration path in this code
base: replace the `processMedia` body with a `kafkaTemplate.send(...)` call,
then run a separate worker application that consumes it.

## Task 6 - Scalability

**Many media uploads**

1. Keep API instances stateless - any instance can accept any upload -> add
   instances behind a load balancer.
2. Move bytes out of the app: direct-to-object-storage pre-signed URLs (S3)
   instead of proxying multipart through the JVM; the API only stores metadata.
3. Decouple with a queue: uploads ack in milliseconds, workers process at
   their own pace (smooths traffic spikes, retries are free).
4. Async processing: image resize and video transcoding on autoscaled worker
   pools with horizontal pod autoscaling.
5. CDN for delivery so reads never hit the app; multipart limits and rate
   limiting protect single users from saturating bandwidth.

**Many concurrent feed reads**

1. Cache-first reads (Redis feed + post cache) - the hot path never touches
   MySQL; in-process cache/Caffeine in front if needed.
2. Read replicas: scale `GET /api/posts` reads horizontally.
3. Fan-out on post: at publish time push the new post id into the timelines
   of followers (Redis ZSET), so a feed read is one `ZSETRANGE`.
   For celebrity accounts (millions of followers) switch to fan-out on read:
   merge the pre-computed recent posts of the people you follow while serving.
4. Pagination always (`?page=&size=` or cursor by `createdAt,id`) - never
   return an unbounded feed.
5. CDN + HTTP caching for media bytes and ETags for API responses; stateless
   servers allow autoscaling under load spikes; MySQL connection pool (Hikari)
   bounds database pressure.

**Consistency notes**: likes and follows are unique-constrained in MySQL, so
duplicate events (queue redelivery) are harmless; counters are eventually
consistent (cache first, DB async) which is acceptable for a social feed.

---

## How each requirement maps to this repository

| Round 3 concept | Implemented here | Later (documented, not built) |
|---|---|---|
| Services | `UserService`, `PostService`, `CommentService` | split services + gateway |
| REST communication | `fetch()` in `lib/api.js`, CORS in `WebConfig` | JWT, HTTP/2, gateway |
| Databases | MySQL (5 tables) + `uploads/` folder | replicas, S3, Redis |
| Caching | none (fast queries) | Redis `@Cacheable` + CDN |
| Messaging | synchronous `processMedia(...)` | Kafka/RabbitMQ workers |
| Notifications | not built (out of scope) | notification service on events |
| Scalability | pagination-free demo, single instance | the six levers listed above |
