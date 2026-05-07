# Tech Decision — moyo (모두의요리사)

> 버전: 2.1
> 작성일: 2026-05-03
> 최종 갱신: 2026-05-08 (ALIGN 6차 rewind — API 22개·UNIQUE 제약·Video upsert·URL 파라미터 규약·thumbs 실호출)
> 페이즈: ENGINEER
> 기반: PRD v0.4 + Design Decision Doc v1.1 + dev-dialogue 합의
> dev-gate: T1-T5 전항목 PASS (rewind 재실행)

---

## 1. 메타

| 항목 | 내용 |
|------|------|
| feature | moyo (모두의요리사) |
| appetite | Standard |
| 페이즈 | ENGINEER |
| 이전 페이즈 | DESIGN (D1-D4 전항목 PASS — design-decision v1.1) |
| 다음 페이즈 | ALIGN |

---

## 2. 기술 스택 요약

| Layer | 결정 | 근거 |
|-------|------|------|
| Frontend | Next.js App Router | SSR + 라우팅 + API Route 한 번에 처리 |
| Hosting | Vercel | Next.js 공식 호스팅, 환경변수 관리 |
| Backend/DB | Supabase (Postgres + Auth + Storage) | 신속한 구축, Auth·Storage 번들 |
| Auth | Google OAuth + 화이트리스트 (단일 계정) | 단일 사용자, 최소 인증 복잡도 |
| YouTube API | Next.js API Route 서버 프록시 | API Key 은닉, quota 집중 관리 |
| Quota Cache | Supabase 테이블 `youtube_cache` (24h TTL) | DB 기반 캐시 — 재배포 이후에도 유지 |
| ORM | Drizzle (server-side query·migration) | type-safe SQL, migration 자동화 지원. Auth만 supabase-js 사용 |
| UI Components | 자체 구현 (bottom sheet, dialog, dropdown, toggle, search input, combobox, step input row 등) | 외부 headless 라이브러리 미사용. Apple 디자인 시스템 토큰 + Tailwind CSS |
| Styling | Tailwind CSS + design-system.md 토큰 매핑 | Apple 토큰 직접 매핑 |
| State / Fetching | TanStack Query (서버 상태) + React useState (로컬) | 서버 상태·캐싱·낙관적 업데이트 |
| Form | react-hook-form + zod | 유효성 검증 타입 안전성 |
| Testing | Vitest (단위/컴포넌트) + Playwright (E2E 핵심 흐름 1-2개, 선택) | 자체 컴포넌트 a11y + 정렬 알고리즘 단위 테스트 필수 |
| TypeScript | strict + path alias | 타입 안전성, @/ alias |
| Code Style | ESLint (Next.js 기본) + Prettier | 표준 |
| Env | `.env.local` (개발) / Vercel 환경변수 (배포) | 표준 |
| 분석/이벤트 | 클릭 이벤트 미수집. M1·M2·M3는 DB count. H2·H3는 자기보고로 회고 | 단일 사용자 도구, 수집 오버헤드 불필요 |
| Cron / 정기 작업 | Vercel Cron (또는 Supabase pg_cron) | Attempt 30일 자동 hard delete, youtube_cache 만료 레코드 정리 |

---

## 3. 데이터 스키마 (Drizzle Schema — Postgres)

### 3.1 파일 위치

```
db/
  schema.ts        ← Drizzle 스키마 정의 (단일 파일)
  index.ts         ← DB 커넥션 (drizzle-orm/postgres-js)
  migrations/      ← drizzle-kit generate 산출
drizzle.config.ts  ← drizzle-kit 설정
```

### 3.2 테이블 정의

```typescript
// db/schema.ts
import {
  pgTable, uuid, text, varchar, numeric, date, integer,
  timestamp, boolean, jsonb, index, unique
} from 'drizzle-orm/pg-core';

// 화이트리스트 — 허용된 사용자만 접근
export const allowedUsers = pgTable('allowed_users', {
  id:         uuid('id').primaryKey().defaultRandom(),
  email:      varchar('email', { length: 320 }).notNull().unique(),
  role:       varchar('role', { length: 50 }).notNull().default('user'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Dish (메뉴)
// 삭제 정책: 연결된 Video가 없는 경우만 hard delete. Video 존재 시 deny + 422.
export const dishes = pgTable('dishes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 100 }).notNull(),
  slug:      varchar('slug', { length: 150 }).notNull(),
  userId:    uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUserIdx:   index('dishes_slug_user_idx').on(t.slug, t.userId),
  userIdIdx:     index('dishes_user_id_idx').on(t.userId), // 자동완성 MVP는 user_id 필터만 인덱스 활용
}));

// Video (영상)
// thumbs enum: 'up' | 'down' | null (null = 미설정)
// is_hidden: 사용자 숨김 토글. true면 검색 결과·메뉴 페이지에 노출 안 함.
// is_unavailable_on_youtube: 유튜브에서 정상 접근 불가 (삭제 / 비공개 / removed 모두 포함) 감지 시 true.
// 삭제 정책: Attempt ≥1건이면 hard delete deny → is_hidden 토글로 대체.
// UNIQUE(youtube_video_id, dish_id): Dish 단위 동일 영상 중복 저장 방지 (L46 — ALIGN 6차 rewind).
export const videos = pgTable('videos', {
  id:                       uuid('id').primaryKey().defaultRandom(),
  dishId:                   uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  youtubeVideoId:           varchar('youtube_video_id', { length: 20 }).notNull(),
  title:                    text('title').notNull(),
  channel:                  varchar('channel', { length: 255 }).notNull(),
  thumbnailUrl:             text('thumbnail_url').notNull(),
  publishedAt:              timestamp('published_at', { withTimezone: true }),
  thumbs:                   varchar('thumbs', { length: 4 }),       // 'up' | 'down' | NULL
  isHidden:                 boolean('is_hidden').notNull().default(false),
  isUnavailableOnYoutube:   boolean('is_unavailable_on_youtube').notNull().default(false),
  userId:                   uuid('user_id').notNull(),
  createdAt:                timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dishIdIdx:                    index('videos_dish_id_idx').on(t.dishId),
  // youtubeVideoIdx 일반 인덱스 제거 — UNIQUE 제약이 자동으로 인덱스를 생성하므로 중복 불필요.
  videosYoutubeVideoIdDishUnique: unique('videos_youtube_video_id_dish_unique').on(t.youtubeVideoId, t.dishId),
}));

// Attempt (시도)
// rating: numeric(2,1) — 0.0~5.0, 0.5 단위는 앱 레이어에서 검증
// deleted_at: soft delete 시각. null = 활성. 30일 후 자동 hard delete (Vercel Cron).
export const attempts = pgTable('attempts', {
  id:              uuid('id').primaryKey().defaultRandom(),
  videoId:         uuid('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  rating:          numeric('rating', { precision: 2, scale: 1 }).notNull(), // 0.0~5.0
  changes:         text('changes'),
  improvementNote: text('improvement_note'),
  triedAt:         date('tried_at').notNull(),
  deletedAt:       timestamp('deleted_at', { withTimezone: true }),  // soft delete
  userId:          uuid('user_id').notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  videoIdIdx:    index('attempts_video_id_idx').on(t.videoId),
  userIdIdx:     index('attempts_user_id_idx').on(t.userId),
  deletedAtIdx:  index('attempts_deleted_at_idx').on(t.deletedAt),  // 휴지통 조회 + Cron 최적화
}));

// Step (단계별 기록)
// attempt_id FK ON DELETE CASCADE: Attempt hard delete 시 하위 Step 전체 cascade
// video_timestamp: 초 단위 정수. null 허용 (임베드 차단 시 수동 입력 또는 생략).
// deleted_at: Attempt soft delete 시 함께 처리. 개별 Step 삭제도 가능.
// user_id: RLS·WHERE 필터링용 보안 경계.
export const steps = pgTable('steps', {
  id:             uuid('id').primaryKey().defaultRandom(),
  attemptId:      uuid('attempt_id').notNull().references(() => attempts.id, { onDelete: 'cascade' }),
  note:           text('note').notNull(),
  videoTimestamp: integer('video_timestamp'),  // 초 단위, nullable
  deletedAt:      timestamp('deleted_at', { withTimezone: true }),  // 개별 step soft delete
  userId:         uuid('user_id').notNull(),   // RLS·WHERE 필터링용
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  attemptIdIdx:        index('steps_attempt_id_idx').on(t.attemptId),
  attemptCreatedAtIdx: index('steps_attempt_created_at_idx').on(t.attemptId, t.createdAt),
}));

// YouTube Cache
// cache_key 규칙:
//   검색 캐시   = "search:" + normalized_query (소문자+trim)
//   영상 상세  = "video:" + youtube_video_id
export const youtubeCache = pgTable('youtube_cache', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cacheKey:  text('cache_key').notNull().unique(),
  results:   jsonb('results').notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => ({
  cacheKeyIdx:  index('youtube_cache_cache_key_idx').on(t.cacheKey),
  expiresAtIdx: index('youtube_cache_expires_at_idx').on(t.expiresAt),
}));
```

### 3.3 인덱스 정책

| 인덱스 | 목적 |
|--------|------|
| `dishes_user_id_idx` | 자동완성 MVP 조회의 user_id 필터 최적화. LIKE leading wildcard 자체는 btree 미활용 |
| `dishes_slug_user_idx` | slug + user_id 복합 조회 |
| `videos_dish_id_idx` | dish 단위 영상 목록 |
| `videos_youtube_video_id_dish_unique` | Dish 단위 동일 영상 중복 방지 UNIQUE 제약. Postgres가 UNIQUE 제약에 자동으로 인덱스 생성 → 영상 중복 체크 + 상세 조회 겸용. (L46 — 기존 `videos_youtube_video_id_dish_idx` 일반 인덱스 대체) |
| `attempts_video_id_idx` | video 단위 시도 이력 |
| `attempts_user_id_idx` | 메인 화면 최근 시도 쿼리 |
| `attempts_deleted_at_idx` | 휴지통 조회 (`WHERE deleted_at IS NOT NULL`) + Vercel Cron hard delete |
| `steps_attempt_id_idx` | attempt 단위 step 목록 |
| `steps_attempt_created_at_idx` | attempt별 step 생성순 정렬 |
| `youtube_cache_cache_key_idx` | cache_key 단일 컬럼 조회 (UNIQUE 보장) |
| `youtube_cache_expires_at_idx` | 만료 캐시 정리 쿼리 최적화 |

### 3.4 파생 필드 계산 방식

파생 필드(`average_rating`, `attempt_count`, `last_tried_at`)는 DB에 저장하지 않는다.
API Route에서 Drizzle SQL을 통해 집계:

```typescript
// 예시: video별 파생 필드 집계 (soft delete된 attempt 제외)
const stats = await db
  .select({
    videoId:      attempts.videoId,
    avgRating:    sql<string>`ROUND(AVG(${attempts.rating}), 1)`,
    attemptCount: sql<number>`COUNT(*)`,
    lastTriedAt:  sql<string>`MAX(${attempts.triedAt})`,
  })
  .from(attempts)
  .where(and(
    eq(attempts.userId, userId),
    isNull(attempts.deletedAt),  // soft delete 제외
  ))
  .groupBy(attempts.videoId);
```

---

## 4. 인증 전략

### 4.1 Google OAuth + 화이트리스트

```
흐름:
1. 사용자 → Google OAuth (supabase-js signInWithOAuth({ provider: 'google' }))
2. Supabase Auth → Google 인증 완료 → session cookie 발급
3. 모든 API Route: session 확인 → allowed_users 테이블에서 이메일 조회
4. 미허가 이메일 → 403 반환
```

- Auth 처리: `supabase-js` 전용 (Google OAuth flow, session 관리)
- DB 쿼리 (Dish/Video/Attempt/Step): Drizzle 전용
- 단일 사용자 운영이므로 `allowed_users`는 초기 1건 수동 삽입

### 4.2 보안 경계 정의

**서버 API(Drizzle direct DATABASE_URL)에서 `WHERE user_id`가 유일한 실질 보안 경계이다.**

- moyo는 모든 DB 쿼리를 server-side Drizzle (`DATABASE_URL` direct connection)로 처리한다.
- Drizzle direct connection은 Supabase Auth JWT context를 자동 주입하지 않는다. 따라서 RLS `auth.uid()`는 서버 API 경로에서 작동하지 않으며 보조 방어선으로도 의존할 수 없다.
- `SUPABASE_SERVICE_ROLE_KEY` 사용 시 RLS는 자동 bypass된다.
- **결론**: RLS는 Supabase client를 직접 쿼리하는 경로에만 의미가 있다. moyo 서버 API 경로에서는 Drizzle `WHERE user_id = currentUser.id`가 단일 보안 경계다.
- **신규 API 추가 시 필수**: 모든 신규 API Route (Steps CRUD, Attempt trash/delete/restore, Video hidden 토글, Dish delete 등) 포함 21개 전 엔드포인트에 `requireAuth()` 적용 + Drizzle 쿼리에 `eq(테이블.userId, userId)` 강제.

**필수 패턴**: 모든 Drizzle 쿼리는 `eq(테이블.user_id, userId)` 형태로 user_id를 명시적으로 강제한다. 누락 방지를 위해 scoped helper 함수 도입을 권장한다.

```typescript
// 예시: scoped query helper
function scopedVideos(userId: string) {
  return db.select().from(videos).where(eq(videos.userId, userId));
}
// 모든 Drizzle 쿼리에서 eq(videos.userId, userId) 형태를 반드시 포함
```

```sql
-- RLS는 현재 Supabase client 직접 쿼리 경로가 없으므로 실질 보안 역할 없음
-- 참고용으로 정의만 유지 (다중 사용자 전환 시 재검토 — U4)
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_isolation" ON dishes
  USING (user_id = auth.uid());
-- videos, attempts, steps 동일 패턴 적용 (현재 비활성 보안 역할)
```

### 4.3 서버 사이드 인증 미들웨어

```typescript
// lib/auth.ts — API Route 공통 유틸
export async function requireAuth(request: NextRequest) {
  const supabase = createServerClient(/* ... */);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new AuthError(401);

  const [user] = await db
    .select()
    .from(allowedUsers)
    .where(eq(allowedUsers.email, session.user.email!))
    .limit(1);

  if (!user) throw new AuthError(403);
  return { session, userId: session.user.id };
}
```

---

## 5. YouTube API 통합 흐름

### 5.1 검색 흐름

```
클라이언트 (TanStack Query)
  → GET /api/youtube/search?q={menu}&dish_id={id}
  → [API Route]
      1. requireAuth()
      2. youtube_cache 조회 (Drizzle):
         WHERE cache_key = "search:" + normalized_query(q) AND expires_at > NOW()
         → HIT: 캐시 데이터 반환
         → MISS:
           a. YouTube Data API v3 search.list 호출
              (type=video, q='{menu} 레시피', maxResults=20, order=date)
           b. 결과를 youtube_cache에 upsert (cache_key = "search:" + normalized_query, expires_at = NOW() + 24h)
           c. 결과 반환
      3. videos 테이블 JOIN — 각 youtube_video_id별 thumbs + 파생 필드 집계
         (isHidden = false, isUnavailableOnYoutube = false 조건 포함)
      4. 정렬 데이터 포함 응답.
         이미 저장된 영상(videos 테이블에 존재)의 경우 `video.id` (UUID)를 byYoutubeId map attach로
         응답에 포함. 클라이언트가 video_id를 URL 파라미터로 VideoDetailClient에 전달하는 데 사용.
  → 클라이언트: 정렬 알고리즘 적용 후 렌더링
```

### 5.4 Video upsert 정책 (L46 — ALIGN 6차 rewind)

`POST /api/videos`는 DB 레벨 UNIQUE(youtube_video_id, dish_id) 제약에 의해 충돌 가능.
충돌 시 `onConflictDoUpdate`로 메타데이터 갱신:

```typescript
await db
  .insert(videos)
  .values({ ...input, publishedAt: input.publishedAt ? new Date(input.publishedAt) : null, userId })
  .onConflictDoUpdate({
    target: [videos.youtubeVideoId, videos.dishId],
    set: {
      title:        sql`EXCLUDED.title`,
      channel:      sql`EXCLUDED.channel`,
      thumbnailUrl: sql`EXCLUDED.thumbnail_url`,
      publishedAt:  sql`EXCLUDED.published_at`,
    },
  })
  .returning();
// thumbs, isHidden, isUnavailableOnYoutube는 갱신하지 않음 — 사용자 설정값 보존.
```

### 5.2 영상 상세 흐름

```
클라이언트
  → GET /api/youtube/video/{youtube_video_id}
  → [API Route]
      1. requireAuth()
      2. youtube_cache 조회 (cache_key = "video:" + youtube_video_id)
         → HIT: 반환
         → MISS:
           a. videos.list (snippet: description, contentDetails, status)
              ※ status.embeddable 확인 → false면 임베드 차단 추정
              ※ items[] 비어있으면 → 유튜브 정상 접근 불가 → is_unavailable_on_youtube = true 갱신
           b. commentThreads.list (order=relevance, maxResults=1)
              → 상위 댓글 1개 (best-effort, 고정 댓글 포함 가능성 있으나 API상 보장 X)
              → 403 commentsDisabled catch 시: 댓글 영역 미표시 (폴백: description만 노출)
           c. items[] 비어있으면 → 유튜브 정상 접근 불가 (삭제/비공개/removed 포함)
              → is_unavailable_on_youtube = true 갱신
              (YouTube IFrame API error 100도 동일 처리 — 삭제 또는 비공개로 removed)
           d. 결과 캐시 저장 (24h TTL)
           e. 반환
```

### 5.3 Quota 관리

| API 호출 | quota 비용 | 비고 |
|----------|-----------|------|
| search.list | 100 units/call | 캐시 HIT 시 0 소모 |
| videos.list | 1 unit/call | 캐시 HIT 시 0 소모 |
| commentThreads.list | 1 unit/call | 캐시 HIT 시 0 소모 |
| 일일 한도 | 10,000 units | 캐시 적중률이 핵심 |

- 캐시 키: `youtube_cache.cache_key` TEXT UNIQUE 단일 컬럼. `"search:" + normalized_query` (소문자+trim) 또는 `"video:" + youtube_video_id`
- TTL: 24h (기본값). 단, 추후 72h 또는 7일 연장 검토 가능 (후속 결정 U2)
- Quota 초과 시: `/api/youtube/search` → 429 응답 → 클라이언트 Empty 상태 표시 ("잠시 후 다시 시도해주세요")

---

## 6. 검색 정렬 알고리즘 구현

### 6.1 흐름

```
1단계 — API Route에서 YouTube 검색 결과 수신 (publishedAt 포함)

2단계 — DB JOIN (Drizzle)
  videos 테이블에서 dish_id + youtube_video_id 기준으로
  thumbs 상태, AVG(rating), COUNT(attempts), MAX(tried_at) 집계하여 합산
  isHidden = false AND isUnavailableOnYoutube = false 조건 추가

3단계 — 클라이언트 정렬 (deterministic 순서 보장)

  [thumbs up 영역]
    - 조건: thumbs = 'up' 인 video가 1개 이상일 때만 섹션 표시
    - 정렬: average_rating DESC, attempt_count DESC (동률 처리)

  [일반 영역]
    - thumbs up 영상 제외한 나머지
    - 정렬: publishedAt DESC
    - thumbs down 영상: 동일 영역 포함, opacity 40% + grayscale(100%) 처리
```

### 6.2 정렬 함수 (단위 테스트 대상)

```typescript
// lib/sort-videos.ts
export function sortVideoResults(videos: VideoWithStats[]): SortedVideoResult {
  const thumbsUp = videos
    .filter(v => v.thumbs === 'up')
    .sort((a, b) => {
      const ratingDiff = (b.averageRating ?? 0) - (a.averageRating ?? 0);
      if (ratingDiff !== 0) return ratingDiff;
      return b.attemptCount - a.attemptCount;
    });

  const rest = videos
    .filter(v => v.thumbs !== 'up')
    .sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  return { thumbsUpSection: thumbsUp, generalSection: rest };
}
```

---

## 7. YouTube IFrame Player API 통합

### 7.1 클라이언트 구현 (영상 상세 화면)

```typescript
// 동적 로드 (공식 스크립트)
// src: https://www.youtube.com/iframe_api

// player 인스턴스 생성
const player = new YT.Player(elementId, {
  videoId,
  events: {
    onReady: (event) => { /* player 준비 완료 */ },
    onError: (event) => {
      // 에러 코드 101 또는 150: 임베드 차단
      if (event.data === 101 || event.data === 150) {
        setEmbedBlocked(true);  // IFrame 영역 미표시, "지금 시간 기록" 버튼 비활성
      }
    },
  },
});

// timestamp 캡처
function captureTimestamp(): number {
  return Math.floor(player.getCurrentTime());  // float → int (초 단위)
}
```

### 7.2 Server-side 임베드 폴백 확인

- `GET /api/youtube/video/{youtube_video_id}` 응답에 `embeddable` 필드 포함
- `videos.list` 응답의 `status.embeddable === false` → 임베드 차단 추정
- 클라이언트는 이 필드를 확인해 IFrame 시도 없이 외부 링크 + 수동 timestamp 입력만 노출
- `items[]` 비어있으면 `is_unavailable_on_youtube = true` 갱신 (삭제·비공개·removed 구분 불가 — "사용할 수 없는 영상"으로 통합)

### 7.3 Step.video_timestamp 검증 (OQ6 해소)

- 앱 레이어(zod schema)에서 `video_timestamp`는 0 이상의 정수 또는 null만 허용
- 영상 실제 길이 초과 여부는 **허용** (초과 값도 사용자 기록으로 보존)
- 단, 음수 값은 거부 (400 Bad Request)

---

## 8. 메인 화면 쿼리 명세

### 8.1 최근 시도 영상 5개

```typescript
// GET /api/home → 최근 시도 영상 5개
const recentAttempts = await db
  .select({
    video: videos,
    attempt: attempts,
  })
  .from(attempts)
  .innerJoin(videos, eq(attempts.videoId, videos.id))
  .where(and(
    eq(attempts.userId, currentUserId),
    isNull(attempts.deletedAt),        // soft delete 제외
    eq(videos.isHidden, false),        // 숨김 영상 제외
  ))
  .orderBy(desc(attempts.triedAt))
  .limit(5);
```

`is_unavailable_on_youtube = true` 영상은 최근 시도에 포함 (시도 기록 보존 원칙 — PRD 4.9).
단, 클라이언트에서 `DeletedVideoAlert` 컴포넌트로 카드에 라벨 표시.

### 8.2 자주 만든 Dish Top 3

```typescript
// GET /api/home → 자주 만든 Dish Top 3
const topDishes = await db
  .select({
    dish: dishes,
    attemptCount: count(attempts.id).as('attempt_count'),
  })
  .from(dishes)
  .innerJoin(videos, eq(videos.dishId, dishes.id))
  .innerJoin(attempts, eq(attempts.videoId, videos.id))
  .where(and(
    eq(dishes.userId, currentUserId),
    isNull(attempts.deletedAt),        // soft delete된 attempt 제외
  ))
  .groupBy(dishes.id)
  .orderBy(desc(count(attempts.id)))
  .limit(3);
```

### 8.3 URL 파라미터 전달 규약 (L47 — ALIGN 6차 rewind)

메인 화면·메뉴 페이지에서 영상 카드 클릭 시 `/video/{youtubeVideoId}?dish_id={dishId}&video_id={videoUuid}` 형태로 라우팅한다.

- `dish_id`: VideoDetailClient에서 `upsertVideo()` 호출(Attempt 생성 선행 단계) 시 필수. 없으면 "기록하기" 기능 사용 불가.
- `video_id`: thumbs 토글 시 `PATCH /api/videos/{video_id}/thumbs` 실호출 대상 식별. 없으면 로컬 상태만 변경.
- 검색 화면(`/api/youtube/search` 응답)에서는 이미 저장된 영상에 한해 `video.id`를 `byYoutubeId` map attach로 포함하여 반환.

### 8.4 성능 고려 (기존 §8.3)

- 두 쿼리를 단일 `/api/home` 엔드포인트에서 병렬 실행 (`Promise.all`)
- TanStack Query staleTime: 5분 (홈 진입 시 캐시 유지)
- `attempts_user_id_idx` + `attempts_deleted_at_idx` 인덱스 활용

---

## 9. 자동완성 LIKE 쿼리

### 9.1 쿼리 명세

```typescript
// GET /api/dishes/autocomplete?q={prefix}
export async function getAutocompleteDishes(userId: string, query: string) {
  return db
    .select()
    .from(dishes)
    .where(and(
      eq(dishes.userId, userId),
      sql`LOWER(${dishes.name}) LIKE LOWER(${'%' + query + '%'})`,
    ))
    .limit(8);  // design-decision: 최대 5개 표시이나 DB에서 8개까지 조회
}
```

- 한글 형태소 미적용 (Phase 2 OQ5/U7)
- 디바운스 300ms: 클라이언트 측 SearchInput 컴포넌트에 적용
- SQL injection 방지: Drizzle 파라미터 바인딩으로 자동 처리 (`${'%' + query + '%'}`)
- LIKE 앞뒤 `%` 와일드카드는 사용자 입력이 아닌 서버 코드에서 조합

**인덱스 정책 (LIKE leading wildcard 처리):**
- `LOWER(name) LIKE LOWER('%' || query || '%')` 는 leading wildcard이므로 btree index 미활용 (sequential scan 발생).
- MVP: sequential scan 허용. Dish 데이터는 1인 사용자 기준 매우 적어 (예: 50~200 row) 성능 부담 없음.
- 인덱스: `dishes_user_id_idx` (btree, user_id 단일 컬럼) 등록 — user_id 필터 최적화 용도. LIKE 자체는 인덱스 미활용.
- Phase 2 최적화: 사용자 Dish 수가 1,000+ 도달 시 또는 자동완성 응답 지연 발생 시 pg_trgm GIN index 도입 (`CREATE INDEX dishes_name_trgm_idx ON dishes USING gin (LOWER(name) gin_trgm_ops);`).
- U7 (자동완성 한국어 매칭 정확도) 미결과 함께 추적.

### 9.2 Combobox a11y 테스트 (RM7 연계)

- `Combobox` 컴포넌트: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-activedescendant`. dropdown: `role="listbox"`. 각 항목: `role="option"`, `aria-selected`.
- Vitest + @testing-library로 키보드 네비게이션(↑↓Enter ESC Tab) 테스트 필수
- 크로스 브라우저 keyboard nav 검증 필요 (RM7 리스크)

---

## 10. 삭제 정책 구현

### 10.1 Attempt soft delete

```typescript
// DELETE /api/attempts/{id} → soft delete
await db
  .update(attempts)
  .set({ deletedAt: new Date() })
  .where(and(
    eq(attempts.id, attemptId),
    eq(attempts.userId, userId),
  ));

// Step은 Attempt ON DELETE CASCADE로 DB 레벨에서 처리.
// 단, Attempt soft delete 시 하위 Step도 논리적으로 숨김 처리:
// API 레이어에서 steps 조회 시 WHERE attempt.deleted_at IS NULL 조건으로 필터링.
```

**30일 자동 hard delete (Vercel Cron 또는 Supabase pg_cron):**
```sql
-- 일일 실행 (cron: "0 2 * * *" — UTC 02:00)
DELETE FROM attempts
WHERE deleted_at < NOW() - INTERVAL '30 days';
-- steps는 ON DELETE CASCADE로 함께 삭제
```

**휴지통 조회:**
```typescript
// GET /api/attempts/trash
await db
  .select()
  .from(attempts)
  .where(and(
    eq(attempts.userId, userId),
    isNotNull(attempts.deletedAt),
    gt(attempts.deletedAt, sql`NOW() - INTERVAL '30 days'`),
  ))
  .orderBy(desc(attempts.deletedAt));
```

**복구:**
```typescript
// POST /api/attempts/{id}/restore
await db
  .update(attempts)
  .set({ deletedAt: null })
  .where(and(
    eq(attempts.id, attemptId),
    eq(attempts.userId, userId),
  ));
```

**영구 삭제:**
```typescript
// DELETE /api/attempts/{id}/permanent
await db
  .delete(attempts)
  .where(and(
    eq(attempts.id, attemptId),
    eq(attempts.userId, userId),
  ));
// steps ON DELETE CASCADE로 함께 삭제
```

### 10.2 Video 숨김 / hard delete

```typescript
// PATCH /api/videos/{id}/hidden → is_hidden 토글
// 시도 기록 존재 확인 (휴지통 포함 전체 카운트 — deleted_at 조건 제거):
const [{ attemptExists }] = await db
  .select({ attemptExists: sql<number>`COUNT(*)` })
  .from(attempts)
  .where(and(
    eq(attempts.videoId, videoId),
    eq(attempts.userId, currentUser.id),  // 보안 경계 — user_id 필터 필수
    // deleted_at IS NULL 조건 제거:
    // 휴지통(soft delete)에 있는 attempt가 카운트에서 빠지면
    // Video hard delete 가능 → cascade로 휴지통 attempt 함께 삭제 → 30일 복구 정책 위반
  ));

if (Number(attemptExists) > 0) {
  // Attempt 있으면 (활성 + 휴지통 포함): is_hidden 토글만 허용
  await db.update(videos).set({ isHidden: true }).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
} else {
  // Attempt 0건이면: hard delete 가능 (또는 is_hidden 토글)
  // DELETE /api/videos/{id}
  await db.delete(videos).where(and(eq(videos.id, videoId), eq(videos.userId, userId)));
}
// 휴지통 attempt의 30일 자동 hard delete 시점에 Video도 삭제 가능 조건이 자연스럽게 충족됨
```

### 10.3 Dish hard delete

```typescript
// DELETE /api/dishes/{id}
// 연결된 Video 확인 (user_id 보안 경계 포함):
const [{ videoCount }] = await db
  .select({ videoCount: sql<number>`COUNT(*)` })
  .from(videos)
  .where(and(
    eq(videos.dishId, dishId),
    eq(videos.userId, userId),  // 보안 경계 — user_id 필터 필수
  ));

if (Number(videoCount) > 0) {
  return Response.json(
    { error: '먼저 영상을 정리해주세요' },
    { status: 422 }  // 422 Unprocessable Entity
  );
}
await db.delete(dishes).where(and(eq(dishes.id, dishId), eq(dishes.userId, userId)));
```

---

## 11. 영상 유튜브 삭제 감지 (Lazy Check 패턴)

### 11.1 Lazy check (기본 전략)

```typescript
// 영상 상세 조회 시 (GET /api/youtube/video/{youtube_video_id})
const ytResponse = await fetch(
  `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,status&key=${YOUTUBE_API_KEY}`
);
const data = await ytResponse.json();

if (data.items.length === 0) {
  // 유튜브 정상 접근 불가 (삭제 / 비공개 / removed 포함)
  // YouTube search.list 빈 응답도 삭제·비공개 구분 불가 — 동일 처리
  // YouTube IFrame API error 100도 동일 의미 (removed or private)
  await db
    .update(videos)
    .set({ isUnavailableOnYoutube: true })
    .where(and(eq(videos.youtubeVideoId, videoId), eq(videos.userId, userId)));
}
```

### 11.2 검색 결과 필터링

```typescript
// 검색 결과 조회 시 is_unavailable_on_youtube = true 영상 제외
.where(and(
  eq(videos.dishId, dishId),
  eq(videos.isHidden, false),
  eq(videos.isUnavailableOnYoutube, false),  // 검색 결과에서 비노출
))
```

메인 화면 "최근 시도" 및 메뉴 페이지에서는 `isUnavailableOnYoutube = true` 영상 포함
(시도 기록 보존 원칙 — PRD 4.9). 단, 클라이언트에서 `DeletedVideoAlert` 컴포넌트로 라벨 표시.

### 11.3 Optional 주기적 체크 (U8 — MVP 미포함)

Vercel Cron 주 1회: 최근 검사 30일 초과 video 중 `videos.list` 일괄 호출 (50개 단위) → not found이면 갱신.
실사용 후 lazy check만으로 충분한지 확인 후 결정.

---

## 12. API Contract (22개 엔드포인트)

### 기존 API (PRD v0.2 기준)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/youtube/search?q={menu}&dish_id={id}` | YouTube 영상 검색 (캐시 포함) |
| `GET` | `/api/youtube/video/{youtube_video_id}` | 영상 상세 (description + 상위 댓글 1개) |
| `GET` | `/api/dishes` | Dish 목록 |
| `POST` | `/api/dishes` | Dish 생성 |
| `GET` | `/api/dishes/{id}/videos` | Dish 단위 Video 목록 |
| `GET` | `/api/dishes/{id}/attempts` | Dish 단위 활성 Attempt 이력 (Step 포함) — L45 신규 |
| `POST` | `/api/videos` | Video 저장 (upsert — UNIQUE 제약 onConflictDoUpdate) |
| `PATCH` | `/api/videos/{id}/thumbs` | thumbs 상태 변경 (up/down/미설정) |
| `POST` | `/api/attempts` | Attempt 생성 |
| `PATCH` | `/api/attempts/{id}` | Attempt 수정 |

### 신규 API (PRD v0.4 보강)

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET` | `/api/home` | 메인 화면 데이터 (최근 시도 5 + Dish Top 3) |
| `GET` | `/api/dishes/autocomplete?q={prefix}` | 자동완성 결과 (LIKE 매칭, max 8) |
| `DELETE` | `/api/dishes/{id}` | Dish hard delete (Video 없는 경우만, 그 외 422) |
| `PATCH` | `/api/videos/{id}/hidden` | is_hidden 토글 |
| `DELETE` | `/api/videos/{id}` | Video hard delete (Attempt 없는 경우만, 그 외 422) |
| `POST` | `/api/attempts/{id}/steps` | Step 추가 |
| `PATCH` | `/api/attempts/{id}/steps/{step_id}` | Step 수정 |
| `DELETE` | `/api/attempts/{id}/steps/{step_id}` | Step 삭제 (soft delete) |
| `GET` | `/api/attempts/trash` | Attempt 휴지통 목록 조회 |
| `DELETE` | `/api/attempts/{id}` | Attempt soft delete |
| `POST` | `/api/attempts/{id}/restore` | 휴지통에서 Attempt 복구 |
| `DELETE` | `/api/attempts/{id}/permanent` | Attempt 영구 삭제 |

**공통 보안 원칙**: 22개 전 엔드포인트에 `requireAuth()` 적용 + Drizzle 쿼리에 `WHERE user_id = userId` 강제. T6 엔티티 검증: Step 추가/수정 시 `attempt_id`가 요청 user의 attempt인지 상위 where 절로 검증. `GET /api/dishes/{id}/attempts`는 Dish 소유 검증 + Video isHidden=false + Attempt deletedAt IS NULL 조건 필수.

---

## 13. 컴포넌트 라이브러리 — 자체 구현

### 13.1 Tailwind 토큰 등록

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'primary':           '#0066cc',
        'primary-focus':     '#0071e3',
        'primary-on-dark':   '#2997ff',
        'canvas':            '#ffffff',
        'canvas-parchment':  '#f5f5f7',
        'surface-pearl':     '#fafafc',
        'surface-tile-1':    '#272729',
        'surface-black':     '#000000',
        'ink':               '#1d1d1f',
        'body-on-dark':      '#ffffff',
        'body-muted':        '#cccccc',
        'ink-muted-48':      '#7a7a7a',
        'hairline':          '#e0e0e0',
        'divider-subtle':    'rgba(0, 0, 0, 0.08)',  // DESIGN-GAP-1 해결
        // danger 컬러 — Apple 시스템에 없으나 destructive action 명확화 위해 도입.
        // 사용처: 영구 삭제 버튼 텍스트 (typography.caption-strong). 이 1개 컬러만 추가 허용.
        'danger':            'rgb(220, 38, 38)',
        'danger-foreground': '#ffffff',
      },
      borderRadius: {
        'none':   '0px',
        'xs':     '5px',
        'sm':     '8px',
        'md':     '11px',
        'lg':     '18px',
        'pill':   '9999px',
        'full':   '9999px',
      },
      spacing: {
        'xxs':     '4px',
        'xs':      '8px',
        'sm':      '12px',
        'md':      '17px',
        'lg':      '24px',
        'xl':      '32px',
        'xxl':     '48px',
        'section': '80px',
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'sans-serif',
        ],
      },
      boxShadow: {
        'product': 'rgba(0, 0, 0, 0.22) 3px 5px 30px 0px',
      },
    },
  },
};
```

**danger 컬러 도입 근거**: design-decision v1.1 D2 WARN 해소. `rgba(220, 38, 38, 1)` — destructive action (영구 삭제) 시각 명확화. 텍스트 한정 사용, 별도 배경 없음. 단일 accent 원칙 예외이나 설계 의도 명시 조건으로 조건부 PASS.

### 13.2 자체 구현 컴포넌트 목록 및 a11y 책임

| 컴포넌트 | 위치 | a11y 구현 책임 |
|----------|------|----------------|
| `BottomSheet` | `components/ui/bottom-sheet.tsx` | focus trap, ESC 닫기, body scroll lock, drag-to-dismiss (touch), `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| `Dialog` | `components/ui/dialog.tsx` | focus trap, ESC 닫기, backdrop 클릭 닫기, body scroll lock, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| `Dropdown` | `components/ui/dropdown.tsx` | 화살표 키 navigation (ArrowUp/Down), Enter 선택, ESC 닫기, `role="listbox"`, `aria-expanded` |
| `ToggleGroup` | `components/ui/toggle-group.tsx` | thumbs up/down. `aria-pressed="true/false"`, Space/Enter 토글, `aria-label="좋아요"` / `"싫어요"` |
| `StarRating` | `components/ui/star-rating.tsx` | 0~5, 0.5단위. ArrowLeft/Right 키보드 입력, `role="slider"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="5"` |
| `SearchInput` | `components/ui/search-input.tsx` | 자동완성 dropdown 미첨부 시: `aria-label="메뉴 검색"`, `role="searchbox"`. 자동완성 dropdown 첨부 시: `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete="list"`, debounce 300ms |
| `Card` | `components/ui/card.tsx` | Apple store-utility-card 변형. `{colors.hairline}` border, `{rounded.lg}` |
| `Button` | `components/ui/button.tsx` | primary / secondary-pill / danger variant. focus ring 2px solid `{colors.primary-focus}`. danger variant: `text-danger` 텍스트 |
| `Toast` | `components/ui/toast.tsx` | 저장 성공/실패 알림. `role="status"` (성공) / `role="alert"` (실패), `aria-live` |
| `Skeleton` | `components/ui/skeleton.tsx` | shimmer animation. `aria-hidden="true"` |
| `EmptyState` | `components/ui/empty-state.tsx` | `{colors.canvas-parchment}` 배경, `{spacing.section}` padding |
| `Combobox` | `components/ui/combobox.tsx` | 자동완성 dropdown. `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`, `aria-haspopup="listbox"`, `aria-activedescendant`. dropdown: `role="listbox"`. 항목: `role="option"`, `aria-selected`. 키보드: ↑↓Enter ESC Tab |
| `StepInputRow` | `components/ui/step-input-row.tsx` | step 입력 행 (note textarea + timestamp + 삭제). 삭제 버튼: `aria-label="이 단계 삭제"`. "지금 시간 기록" 버튼: `aria-label="현재 재생 시간 기록"`. 비활성 시 `aria-disabled="true"` |
| `DeletedVideoAlert` | `components/ui/deleted-video-alert.tsx` | "이 영상은 더 이상 유튜브에서 사용할 수 없습니다" 인라인 안내. `role="alert"`. 카드 `aria-label`에 "사용할 수 없는 영상: {제목}" 포함 |

### 13.3 focus trap 구현

외부 라이브러리 없이 직접 구현. 핵심 로직:
1. 모달 마운트 시 focusable elements 수집
2. 첫 번째 요소로 `focus()` 이동
3. Tab / Shift+Tab 이벤트에서 first/last 경계에서 순환
4. 언마운트 시 트리거 버튼으로 포커스 복귀

### 13.4 body scroll lock 구현

```typescript
// hooks/use-body-scroll-lock.ts
export function useBodyScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isLocked]);
}
```

---

## 14. 환경변수 / 시크릿 관리

| 변수명 | 위치 | 설명 |
|--------|------|------|
| `DATABASE_URL` | server-side only | Supabase Postgres direct connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | 클라이언트 노출 가능 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 클라이언트 노출 가능 | Supabase anon key (RLS 적용) |
| `SUPABASE_SERVICE_ROLE_KEY` | server-side only | 관리 목적. API Route에서만 사용 |
| `YOUTUBE_API_KEY` | server-side only | YouTube Data API v3 키. 클라이언트 미노출 |

- `.env.local`: 로컬 개발 (`.gitignore` 등록 필수)
- Vercel 환경변수: 배포 시 Vercel 대시보드에서 관리
- `NEXT_PUBLIC_` prefix가 없는 변수는 API Route / Server Component에서만 접근

---

## 15. 테스팅 전략

### 15.1 Vitest — 단위/컴포넌트

**자체 구현 컴포넌트 a11y 테스트 (필수)**
- `BottomSheet`: focus trap 동작, ESC 닫기, aria-modal 속성
- `Dialog`: 동일 패턴 + backdrop 클릭 닫기
- `ToggleGroup`: aria-pressed 상태 전환, 키보드 토글
- `StarRating`: aria-valuenow 갱신, 키보드 입력
- `SearchInput`: aria-label 존재 여부, debounce 동작
- `Combobox`: ↑↓ 키 aria-activedescendant 이동, Enter 선택, ESC 닫기, Tab 이동 (RM7 연계)
- `StepInputRow`: "지금 시간 기록" 버튼 aria-disabled 상태 전환

**검색 정렬 알고리즘 단위 테스트 (필수)**
- `sortVideoResults()`: thumbs up 섹션 평점 DESC, 일반 섹션 publishedAt DESC
- thumbs down 영상 일반 섹션 포함 여부
- thumbs up 0개 시 섹션 미생성

**Drizzle 쿼리 단위 테스트**
- 파생 필드 집계 정확성 (AVG rating, COUNT, MAX tried_at)
- soft delete 제외 조건 (`isNull(attempts.deletedAt)`) 동작

### 15.2 Playwright — E2E (선택, 핵심 흐름 1-2개)

```
흐름 1: 검색 → thumbs up → 정렬 반영 확인
  1. 메뉴 검색 입력
  2. 영상 카드 thumbs up 클릭
  3. 검색 결과 재조회 후 thumbs up 영역에 해당 영상 노출 확인

흐름 2: 영상 상세 → 시도 기록 (Step 포함) → 파생 필드 갱신
  1. 영상 카드 클릭 → 상세 화면 진입
  2. "기록하기" → Bottom Sheet / Dialog 열림
  3. rating, tried_at 입력 + Step 추가 (note + timestamp 자동 캡처 또는 수동)
  4. 저장 후 attempt_count +1, average_rating 갱신 확인
```

---

## 16. 시각 품질 계획 (VQ)

design-decision.md VQ1~VQ5 기반. 자체 구현 컴포넌트에 적용.

| 기준 | 구현 방식 | 관련 컴포넌트 |
|------|---------|------------|
| VQ1 인터랙션 상태 | Tailwind hover:/focus:/disabled: 유틸리티 클래스. `transform: scale(0.95)` active 상태. 포커스 링 2px solid `{colors.primary-focus}`. Video 숨김 토글: `aria-pressed` + `{colors.primary}`. "지금 시간 기록" 버튼 비활성: `aria-disabled="true"` + opacity 50% | Button, ToggleGroup, Card, SearchInput, Combobox, StepInputRow |
| VQ2 빈/로딩/에러 | Skeleton 컴포넌트 (shimmer animation). EmptyState 컴포넌트 공통화. ErrorBoundary 적용. 휴지통 빈 상태: "삭제된 기록이 없어요" EmptyState | Skeleton, EmptyState, 영상 카드 영역, 휴지통 화면 |
| VQ3 트랜지션 | BottomSheet: `transition: transform 300ms ease-out`. Dialog: backdrop `transition: opacity 200ms`. "더보기" 인라인 확장: `transition: max-height 250ms ease-in-out`. 자동완성 dropdown: `transition: opacity 150ms, transform 100ms ease-out`. "지금 시간 기록" → timestamp fade-in: `opacity 0 → 1, 150ms ease-out`. 최대 300ms 준수 | BottomSheet, Dialog, "더보기" 확장, Combobox, StepInputRow |
| VQ4 레이아웃 | `{spacing.xl}` 32px 좌우 여백 (모바일). `{spacing.section}` 80px 섹션 vertical padding. `max-w-[1440px]` 콘텐츠 너비 잠금. Dialog 2컬럼 (≥834px, IFrame 가능): 영상 임베드 60% / 폼 40%, 폼 최소 너비 320px | 전체 페이지 레이아웃, Dialog |
| VQ5 포커스·aria | 자체 구현 focus trap (useBodyScrollLock + 포커스 순환 로직). BottomSheet/Dialog 열림 시 첫 필드(rating 선택기)로 포커스. 닫힘 시 트리거 복귀. ESC 즉시 닫기. 삭제 Confirmation Dialog: 초기 포커스 "취소" 버튼. 자동완성 dropdown: 포커스 search-input 유지, aria-activedescendant로 항목 포커스 표현 | BottomSheet, Dialog, Combobox, 삭제 Confirmation Dialog |

---

## 17. Drizzle + Supabase 통합 상세

### 17.1 DB 연결

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### 17.2 drizzle-kit 설정

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

### 17.3 Migration 워크플로우

```bash
# 스키마 변경 후
pnpm drizzle-kit generate   # migration 파일 생성
pnpm drizzle-kit migrate    # DB 적용

# 개발 중 직접 push (migration 파일 없이)
pnpm drizzle-kit push
```

---

## 18. design-decision.md 미해결 흡수 결과

| design-decision 미해결 | tech-decision 결정 |
|---|---|
| Right Drawer vs Dialog | Radix UI Dialog 폐기 → 자체 구현 Dialog (centered modal). 데스크톱(≥834px) 시도 기록 입력 UX로 사용. |
| Bottom Sheet 라이브러리 | Vaul 폐기 → 자체 구현 BottomSheet. 모바일(≤833px) 시도 기록 입력 UX로 사용. |
| rgba(0,0,0,0.08) 토큰화 | `divider-subtle` 토큰 등록 (`tailwind.config.ts`). 폼 입력 border에 적용. DESIGN-GAP-1 해결. |
| H2·H3 클릭 이벤트 수집 | 수집 안 함 (1차). M1·M2·M3는 DB count로 측정. H2·H3는 자기보고로 회고. |
| danger 컬러 (D2 WARN) | `tailwind.config.ts`에 `danger: rgb(220,38,38)` 등록. 사용처: 영구 삭제 버튼 텍스트 한정. design-system.md 주석 추가 권장. |
| Combobox/Autocomplete 구현 | 자체 구현 `Combobox` 컴포넌트. WCAG keyboard nav + aria roles 완비. RM7 리스크 유지. |
| StepInputRow 구현 | 자체 구현. note textarea + video_timestamp 캡처/수동 + 삭제 버튼 조합. |
| DeletedVideoAlert 구현 | 자체 구현. "이 영상은 더 이상 유튜브에 없습니다" 인라인 안내. `role="alert"`. |
| Step.video_timestamp 검증 (OQ6) | 앱 레이어(zod)에서 0 이상 정수 또는 null만 허용. 영상 길이 초과는 허용 (사용자 기록 보존). 음수 거부. |

---

## 19. 미해결 / 후속 결정

| ID | 항목 | 현재 결정 | 후속 검토 시점 |
|----|------|----------|-------------|
| U1 | 한글 메뉴명 검색 인덱싱 정밀도 | MVP는 `user_id` btree 필터 + `LOWER(name) LIKE '%query%'` sequential scan 허용. 성능·정확도 필요 시 `pg_trgm` GIN index 도입 | 실사용 후 검색 정확도 확인 |
| U2 | youtube_cache TTL | 24h (기본값) | API quota 소진율 모니터링 후 72h/7d 연장 검토 |
| U3 | Drizzle migration 자동화 | 수동 (`drizzle-kit migrate` 수동 실행) | Vercel 배포 훅 연동 또는 별도 script 자동화 검토 |
| U4 | RLS 정책 세부 | 기본 user_id 비교 정책. Drizzle WHERE 절을 주 보안 경계로 사용 | 다중 사용자 전환 시 재검토 |
| U5 | Playwright E2E 선택 여부 | "선택" 상태 — 자체 컴포넌트 구현 완료 후 판단 | BottomSheet/Dialog 구현 완료 후 |
| U6 | youtube_cache 만료 레코드 정리 | 수동 또는 Postgres cron. 별도 처리 없으면 영구 누적 | 1개월 운영 후 row count 확인 |
| U7 | 자동완성 한국어 매칭 정확도 (OQ5) | `lower(name) LIKE lower('%query%')` 기본. 부정확 빈발 시 `pg_trgm` GIN index 도입 | 실사용 후 검색 정확도 확인 |
| U8 | 유튜브 삭제 주기적 체크 | MVP 미포함 (lazy check만). 실사용 후 필요 시 Vercel Cron 주 1회 batch 검토 | 실사용 후 결정 |

---

## 테스트 케이스 명세서

| TC# | 대상 AC | 시나리오 | 유형 | 비고 |
|-----|--------|--------|------|------|
| TC-01 | 검색 정렬 (AC #4.2) | thumbs up ≥1개 — 평점 DESC 정렬 후 thumbs up 섹션 상단 표시 | 자동화 | sortVideoResults() 단위 테스트 |
| TC-02 | 검색 정렬 (AC #4.2) | thumbs up 0개 — thumbs up 섹션 미생성 | 자동화 | sortVideoResults() 단위 테스트 |
| TC-03 | 검색 정렬 (AC #4.2) | thumbs down 영상 — 일반 영역 포함, 별도 플래그 포함 여부 | 자동화 | sortVideoResults() 단위 테스트 |
| TC-04 | 일반 노출 (AC #4.2) | thumbs down 없는 영상 — publishedAt DESC 정렬 | 자동화 | sortVideoResults() 단위 테스트 |
| TC-05 | 시도 기록 (AC #4.3) | 정상 저장 — rating, tried_at 입력 후 attempt 생성 확인 | 자동화 | API Route 단위 테스트 |
| TC-06 | 시도 기록 (AC #4.3) | 엣지 케이스 — rating 0.0, tried_at 오늘 (최소값) 저장 | 자동화 | |
| TC-07 | 파생 필드 (AC #3.2) | attempt 추가 후 average_rating 재계산 정확성 | 자동화 | Drizzle 쿼리 단위 테스트 |
| TC-08 | 파생 필드 (AC #3.2) | attempt 0개 video의 파생 필드 null 처리 | 자동화 | |
| TC-09 | BottomSheet a11y | 열릴 때 첫 필드(rating) 포커스 이동 | 자동화 | Vitest + @testing-library |
| TC-10 | BottomSheet a11y | ESC 키 → 닫힘 + 트리거 버튼으로 포커스 복귀 | 자동화 | |
| TC-11 | BottomSheet a11y | focus trap — Sheet 외부 요소 포커스 차단 | 자동화 | |
| TC-12 | Dialog a11y | TC-09~11 동일 패턴 (데스크톱) | 자동화 | |
| TC-13 | ToggleGroup a11y | aria-pressed 상태 전환 (up → 미설정 → down) | 자동화 | |
| TC-14 | StarRating a11y | ArrowRight 키 → aria-valuenow +0.5 | 자동화 | |
| TC-15 | 캐시 (AC #4.1) | 캐시 HIT — DB 조회 후 YouTube API 미호출 | 자동화 | Mock YouTube API |
| TC-16 | 캐시 (AC #4.1) | 캐시 MISS + 만료 — YouTube API 호출 + 캐시 갱신 | 자동화 | |
| TC-17 | Quota 초과 | YouTube API 429 → 클라이언트 Empty 상태 표시 | 자동화 | Mock 429 응답 |
| TC-18 | 상위 댓글 폴백 (AC #4.5) | 댓글 비활성화 영상 (403 commentsDisabled) — 댓글 영역 미표시, description만 노출, 에러 없음 | 자동화 | |
| TC-19 | E2E 검색 → thumbs → 정렬 | 메뉴 검색 → thumbs up → 재검색 후 thumbs up 섹션 노출 확인 | 수동 QA (또는 Playwright) | |
| TC-20 | E2E 기록 저장 | 영상 상세 → 기록하기 → 저장 → attempt_count +1 확인 | 수동 QA (또는 Playwright) | |
| TC-21 | Step timestamp (AC #4.3) | IFrame ready → "지금 시간 기록" 클릭 → getCurrentTime() → step.video_timestamp 저장 | 자동화 | Mock YT.Player |
| TC-22 | 임베드 차단 폴백 (AC #4.3) | status.embeddable=false → "지금 시간 기록" 버튼 비활성(aria-disabled) → 수동 mm:ss 입력 수락 | 자동화 | |
| TC-23 | 자동완성 (AC #4.1) | 한글 부분 일치 — "제육" 입력 시 "제육볶음" 포함 반환, max 8개 limit | 자동화 | LIKE 쿼리 단위 테스트 |
| TC-24 | 메인 화면 쿼리 (AC #4.7) | 최근 시도 5개 정렬(tried_at DESC) / Dish Top 3 정렬(count DESC) / 신규 사용자 빈 상태 반환 | 자동화 | Drizzle 쿼리 단위 테스트 |
| TC-25 | 삭제 정책 (AC #4.8) | Attempt soft delete → 휴지통 조회 → 복구 → 목록 복귀 / Video hard delete deny (Attempt 존재) + is_hidden 토글 / Dish hard delete deny (Video 존재) → 422 / 빈 Dish hard delete 성공 | 자동화 | API Route 단위 테스트 |
| TC-26 | 유튜브 접근불가 감지 (AC #4.9) | videos.list items[] 빈 응답 → is_unavailable_on_youtube=true 갱신, 검색 결과 비노출, 메뉴 페이지 DeletedVideoAlert "사용할 수 없는 영상" 라벨 표시 | 자동화 | Mock YouTube API (빈 items 응답) |

---

## 합의 이력

| 날짜 | 항목 | 내용 |
|------|------|------|
| 2026-05-03 | ORM 결정 | Drizzle 채택. Auth만 supabase-js 사용. |
| 2026-05-03 | UI 컴포넌트 결정 | 자체 구현 (Vaul·Radix UI Dialog 폐기). a11y 책임 명시. |
| 2026-05-03 | 환경변수 구조 | DATABASE_URL + SUPABASE_URL/KEY + YOUTUBE_API_KEY. server-side 격리. |
| 2026-05-03 | 이벤트 수집 미결정 해소 | 클릭 이벤트 미수집. M1·M2·M3 DB count. |
| 2026-05-03 | divider-subtle 토큰 | rgba(0,0,0,0.08) → Tailwind 커스텀 토큰 등록. DESIGN-GAP-1 해결. |
| 2026-05-03 | 검색 정렬 책임 | API Route: DB 집계 + YouTube 캐시. 클라이언트: 최종 정렬 분리. |
| 2026-05-03 | 상위 댓글 API 제약 | commentThreads.list order=relevance, maxResults=1 = best-effort. 고정 댓글 API 보장 없음. 403 commentsDisabled catch 시 댓글 영역 미표시. (ALIGN rewind 1차) |
| 2026-05-03 | 보안 경계 재정의 | Drizzle direct DATABASE_URL 경로에서 RLS auth.uid() 미작동 확인. WHERE user_id가 단일 보안 경계. RLS는 server 경로 미적용. (ALIGN rewind 1차) |
| 2026-05-03 | 캐시 키 통일 | youtube_cache.cache_key TEXT UNIQUE 단일 컬럼. "search:"+normalized_query / "video:"+youtube_video_id prefix 규칙. 기존 query 컬럼 표현 제거. (ALIGN rewind 1차) |
| 2026-05-03 | PRD v0.4 + design-decision v1.1 후속 보강 (Hephaestus rewind) | Step 엔티티 신규 (steps 테이블 + deleted_at + user_id). Video 스키마 확장 (is_hidden, is_unavailable_on_youtube). Attempt deleted_at 추가. YouTube IFrame Player API 통합 명세. 메인 화면 쿼리 명세. 자동완성 LIKE 쿼리. 삭제 정책 구현 (Vercel Cron). 유튜브 접근불가 lazy check. Combobox/StepInputRow/DeletedVideoAlert 자체 구현 추가. danger 컬러 토큰 등록 (D2 WARN 해소). API contract 9 → 21개 확장. TC-21~TC-26 추가. OQ6 해소 (video_timestamp 검증: 0+ 허용, 음수 거부). |
| 2026-05-08 | ALIGN 5차 rewind (Codex 외부 검토 후 정합성 재정리) | API 개수 19→21 정합 (`GET /api/attempts/trash` 포함, 엔드포인트 직접 카운트 기준). Video 삭제 count 쿼리: deleted_at IS NULL 제거(휴지통 attempt 보호) + user_id 보안 경계 추가. Dish count 쿼리: user_id 보안 경계 추가. is_deleted_on_youtube → is_unavailable_on_youtube rename (YouTube error 100 = 삭제·비공개 구분 불가). Attempt soft delete 중 Step 숨김·복구, hard delete 시 FK cascade로 의미 명확화. 자동완성 인덱스 정책 명세 보강 (MVP sequential scan 허용, Phase 2 pg_trgm GIN 조건 명시). 검색 input role="searchbox" → combobox 통일. |
| 2026-05-08 | ALIGN 6차 rewind — BUILD 후 갭 4건 확정 | API 21→22 (`GET /api/dishes/{id}/attempts` 신규). §3.2 videos UNIQUE(youtube_video_id, dish_id) + 기존 일반 인덱스 제거. §3.3 인덱스 정책 갱신. §5.4 Video upsert onConflictDoUpdate 정책 신규. §8.3 URL 파라미터 전달 규약 신규. §5.1 검색 응답에 video.id 포함 명시. |
