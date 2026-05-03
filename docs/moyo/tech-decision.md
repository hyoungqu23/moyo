# Tech Decision — moyo (모두의요리사)

> 버전: 1.0
> 작성일: 2026-05-03
> 페이즈: ENGINEER
> 기반: PRD v0.2 + Design Decision Doc v1.0 + dev-dialogue 합의
> dev-gate: T1-T5 전항목 PASS

---

## 1. 메타

| 항목 | 내용 |
|------|------|
| feature | moyo (모두의요리사) |
| appetite | Standard |
| 페이즈 | ENGINEER |
| 이전 페이즈 | DESIGN (D1-D4 전항목 PASS) |
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
| UI Components | 자체 구현 (bottom sheet, dialog, dropdown, toggle, search input 등) | 외부 headless 라이브러리 미사용. Apple 디자인 시스템 토큰 + Tailwind CSS |
| Styling | Tailwind CSS + design-system.md 토큰 매핑 | Apple 토큰 직접 매핑 |
| State / Fetching | TanStack Query (서버 상태) + React useState (로컬) | 서버 상태·캐싱·낙관적 업데이트 |
| Form | react-hook-form + zod | 유효성 검증 타입 안전성 |
| Testing | Vitest (단위/컴포넌트) + Playwright (E2E 핵심 흐름 1-2개, 선택) | 자체 컴포넌트 a11y + 정렬 알고리즘 단위 테스트 필수 |
| TypeScript | strict + path alias | 타입 안전성, @/ alias |
| Code Style | ESLint (Next.js 기본) + Prettier | 표준 |
| Env | `.env.local` (개발) / Vercel 환경변수 (배포) | 표준 |
| 분석/이벤트 | 클릭 이벤트 미수집. M1·M2·M3는 DB count. H2·H3는 자기보고로 회고 | 단일 사용자 도구, 수집 오버헤드 불필요 |

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
  pgTable, uuid, text, varchar, numeric, date,
  timestamp, jsonb, index, unique
} from 'drizzle-orm/pg-core';

// 화이트리스트 — 허용된 사용자만 접근
export const allowedUsers = pgTable('allowed_users', {
  id:         uuid('id').primaryKey().defaultRandom(),
  email:      varchar('email', { length: 320 }).notNull().unique(),
  role:       varchar('role', { length: 50 }).notNull().default('user'),
  createdAt:  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// Dish (메뉴)
export const dishes = pgTable('dishes', {
  id:        uuid('id').primaryKey().defaultRandom(),
  name:      varchar('name', { length: 100 }).notNull(),
  slug:      varchar('slug', { length: 150 }).notNull(),
  userId:    uuid('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  slugUserIdx:  index('dishes_slug_user_idx').on(t.slug, t.userId),
  nameSearchIdx: index('dishes_name_search_idx').on(t.name), // lower(name) btree or gin_trgm_ops
}));

// Video (영상)
// thumbs enum: 'up' | 'down' | null (null = 미설정)
export const videos = pgTable('videos', {
  id:             uuid('id').primaryKey().defaultRandom(),
  dishId:         uuid('dish_id').notNull().references(() => dishes.id, { onDelete: 'cascade' }),
  youtubeVideoId: varchar('youtube_video_id', { length: 20 }).notNull(),
  title:          text('title').notNull(),
  channel:        varchar('channel', { length: 255 }).notNull(),
  thumbnailUrl:   text('thumbnail_url').notNull(),
  publishedAt:    timestamp('published_at', { withTimezone: true }),
  thumbs:         varchar('thumbs', { length: 4 }),  // 'up' | 'down' | NULL
  userId:         uuid('user_id').notNull(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  dishIdIdx:        index('videos_dish_id_idx').on(t.dishId),
  youtubeVideoIdx:  index('videos_youtube_video_id_dish_idx').on(t.youtubeVideoId, t.dishId),
}));

// Attempt (시도)
// rating: numeric(2,1) — 0.0~5.0, 0.5 단위는 앱 레이어에서 검증
export const attempts = pgTable('attempts', {
  id:              uuid('id').primaryKey().defaultRandom(),
  videoId:         uuid('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  rating:          numeric('rating', { precision: 2, scale: 1 }).notNull(), // 0.0~5.0
  changes:         text('changes'),
  improvementNote: text('improvement_note'),
  triedAt:         date('tried_at').notNull(),
  userId:          uuid('user_id').notNull(),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  videoIdIdx: index('attempts_video_id_idx').on(t.videoId),
  userIdIdx:  index('attempts_user_id_idx').on(t.userId),
}));

// YouTube Cache
// cache_key 규칙: 검색 캐시 = "search:" + normalized_query (소문자+trim), 영상 상세 = "video:" + youtube_video_id
export const youtubeCache = pgTable('youtube_cache', {
  id:        uuid('id').primaryKey().defaultRandom(),
  cacheKey:  text('cache_key').notNull().unique(),  // "search:{normalized_query}" | "video:{youtube_video_id}"
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
| `dishes_name_search_idx` | 메뉴명 검색. 한글 trigram 지원 필요 시 `pg_trgm` 확장 후 GIN index 전환 (후속 결정) |
| `dishes_slug_user_idx` | slug + user_id 복합 조회 |
| `videos_dish_id_idx` | dish 단위 영상 목록 |
| `videos_youtube_video_id_dish_idx` | 영상 중복 체크 + 상세 조회 |
| `attempts_video_id_idx` | video 단위 시도 이력 |
| `youtube_cache_cache_key_idx` | cache_key 단일 컬럼 조회 (UNIQUE 보장) |
| `youtube_cache_expires_at_idx` | 만료 캐시 정리 쿼리 최적화 |

### 3.4 파생 필드 계산 방식

파생 필드(`average_rating`, `attempt_count`, `last_tried_at`)는 DB에 저장하지 않는다.
API Route에서 Drizzle SQL을 통해 집계:

```typescript
// 예시: video별 파생 필드 집계
const stats = await db
  .select({
    videoId:       attempts.videoId,
    avgRating:     sql<string>`ROUND(AVG(${attempts.rating}), 1)`,
    attemptCount:  sql<number>`COUNT(*)`,
    lastTriedAt:   sql<string>`MAX(${attempts.triedAt})`,
  })
  .from(attempts)
  .where(eq(attempts.userId, userId))
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
- DB 쿼리 (Dish/Video/Attempt): Drizzle 전용
- 단일 사용자 운영이므로 `allowed_users`는 초기 1건 수동 삽입

### 4.2 보안 경계 정의

**서버 API(Drizzle direct DATABASE_URL)에서 `WHERE user_id`가 유일한 실질 보안 경계이다.**

- moyo는 모든 DB 쿼리를 server-side Drizzle (`DATABASE_URL` direct connection)로 처리한다.
- Drizzle direct connection은 Supabase Auth JWT context를 자동 주입하지 않는다. 따라서 RLS `auth.uid()`는 서버 API 경로에서 작동하지 않으며 보조 방어선으로도 의존할 수 없다.
- `SUPABASE_SERVICE_ROLE_KEY` 사용 시 RLS는 자동 bypass된다.
- **결론**: RLS는 Supabase client를 직접 쿼리하는 경로에만 의미가 있다. moyo 서버 API 경로에서는 Drizzle `WHERE user_id = currentUser.id`가 단일 보안 경계다.

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
-- videos, attempts 동일 패턴 적용 (현재 비활성 보안 역할)
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
      4. 정렬 데이터 포함 응답
  → 클라이언트: 정렬 알고리즘 적용 후 렌더링
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
           a. videos.list (snippet: description, contentDetails)
           b. commentThreads.list (order=relevance, maxResults=1)
              → 상위 댓글 1개 (best-effort, 고정 댓글 포함 가능성 있으나 API상 보장 X)
              → 403 commentsDisabled catch 시: 댓글 영역 미표시 (폴백: description만 노출)
           c. 결과 캐시 저장 (24h TTL)
           d. 반환
```

### 5.3 Quota 관리

| API 호출 | quota 비용 | 비고 |
|----------|-----------|------|
| search.list | 100 units/call | 캐시 HIT 시 0 소모 |
| videos.list | 1 unit/call | 캐시 HIT 시 0 소모 |
| commentThreads.list | 1 unit/call | 캐시 HIT 시 0 소모 |
| 일일 한도 | 10,000 units | 캐시 적중률이 핵심 |

- 캐시 키: `youtube_cache.cache_key` TEXT UNIQUE 단일 컬럼. `"search:" + normalized_query` (소문자+trim) 또는 `"video:" + youtube_video_id`
- TTL: 24h (기본값). 단, 추후 72h 또는 7일 연장 검토 가능 (후속 결정)
- Quota 초과 시: `/api/youtube/search` → 429 응답 → 클라이언트 Empty 상태 표시 ("잠시 후 다시 시도해주세요")

---

## 6. 검색 정렬 알고리즘 구현

### 6.1 흐름

```
1단계 — API Route에서 YouTube 검색 결과 수신 (publishedAt 포함)

2단계 — DB JOIN (Drizzle)
  videos 테이블에서 dish_id + youtube_video_id 기준으로
  thumbs 상태, AVG(rating), COUNT(attempts), MAX(tried_at) 집계하여 합산

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

## 7. 컴포넌트 라이브러리 — 자체 구현

### 7.1 Tailwind 토큰 등록

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

### 7.2 자체 구현 컴포넌트 목록 및 a11y 책임

| 컴포넌트 | 위치 | a11y 구현 책임 |
|----------|------|----------------|
| `BottomSheet` | `components/ui/bottom-sheet.tsx` | focus trap, ESC 닫기, body scroll lock, drag-to-dismiss (touch), `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| `Dialog` | `components/ui/dialog.tsx` | focus trap, ESC 닫기, backdrop 클릭 닫기, body scroll lock, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| `Dropdown` | `components/ui/dropdown.tsx` | 화살표 키 navigation (ArrowUp/Down), Enter 선택, ESC 닫기, `role="listbox"`, `aria-expanded` |
| `ToggleGroup` | `components/ui/toggle-group.tsx` | thumbs up/down. `aria-pressed="true/false"`, Space/Enter 토글, `aria-label="좋아요"` / `"싫어요"` |
| `StarRating` | `components/ui/star-rating.tsx` | 0~5, 0.5단위. ArrowLeft/Right 키보드 입력, `role="slider"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="5"` |
| `SearchInput` | `components/ui/search-input.tsx` | `aria-label="메뉴 검색"`, `role="searchbox"`, debounce 300ms |
| `Card` | `components/ui/card.tsx` | Apple store-utility-card 변형. `{colors.hairline}` border, `{rounded.lg}` |
| `Button` | `components/ui/button.tsx` | primary / secondary-pill variant. focus ring 2px solid `{colors.primary-focus}` |
| `Toast` | `components/ui/toast.tsx` | 저장 성공/실패 알림. `role="status"` (성공) / `role="alert"` (실패), `aria-live` |
| `Skeleton` | `components/ui/skeleton.tsx` | shimmer animation. `aria-hidden="true"` |
| `EmptyState` | `components/ui/empty-state.tsx` | `{colors.canvas-parchment}` 배경, `{spacing.section}` padding |

### 7.3 focus trap 구현

외부 라이브러리 없이 직접 구현. 핵심 로직:
1. 모달 마운트 시 focusable elements 수집
2. 첫 번째 요소로 `focus()` 이동
3. Tab / Shift+Tab 이벤트에서 first/last 경계에서 순환
4. 언마운트 시 트리거 버튼으로 포커스 복귀

### 7.4 body scroll lock 구현

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

## 8. 환경변수 / 시크릿 관리

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

## 9. 테스팅 전략

### 9.1 Vitest — 단위/컴포넌트

**자체 구현 컴포넌트 a11y 테스트 (필수)**
- `BottomSheet`: focus trap 동작, ESC 닫기, aria-modal 속성
- `Dialog`: 동일 패턴 + backdrop 클릭 닫기
- `ToggleGroup`: aria-pressed 상태 전환, 키보드 토글
- `StarRating`: aria-valuenow 갱신, 키보드 입력
- `SearchInput`: aria-label 존재 여부, debounce 동작

**검색 정렬 알고리즘 단위 테스트 (필수)**
- `sortVideoResults()`: thumbs up 섹션 평점 DESC, 일반 섹션 publishedAt DESC
- thumbs down 영상 일반 섹션 포함 여부
- thumbs up 0개 시 섹션 미생성

**Drizzle 쿼리 단위 테스트**
- 파생 필드 집계 정확성 (AVG rating, COUNT, MAX tried_at)

### 9.2 Playwright — E2E (선택, 핵심 흐름 1-2개)

```
흐름 1: 검색 → thumbs up → 정렬 반영 확인
  1. 메뉴 검색 입력
  2. 영상 카드 thumbs up 클릭
  3. 검색 결과 재조회 후 thumbs up 영역에 해당 영상 노출 확인

흐름 2: 영상 상세 → 시도 기록 → 파생 필드 갱신
  1. 영상 카드 클릭 → 상세 화면 진입
  2. "기록하기" → Bottom Sheet / Dialog 열림
  3. rating, tried_at 입력 → 저장
  4. 영상 카드에 attempt_count +1, average_rating 갱신 확인
```

---

## 10. 시각 품질 계획 (VQ)

design-decision.md VQ1~VQ5 기반. 자체 구현 컴포넌트에 적용.

| 기준 | 구현 방식 | 관련 컴포넌트 |
|------|---------|------------|
| VQ1 인터랙션 상태 | Tailwind hover:/focus:/disabled: 유틸리티 클래스. `transform: scale(0.95)` active 상태. 포커스 링 2px solid `{colors.primary-focus}` | Button, ToggleGroup, Card, SearchInput |
| VQ2 빈/로딩/에러 | Skeleton 컴포넌트 (shimmer animation). EmptyState 컴포넌트 공통화. ErrorBoundary 적용 | Skeleton, EmptyState, 영상 카드 영역 |
| VQ3 트랜지션 | BottomSheet: `transition: transform 300ms ease-out`. Dialog: backdrop `transition: opacity 200ms`. "더보기" 인라인 확장: `transition: max-height 250ms ease-in-out`. 최대 300ms 준수 | BottomSheet, Dialog, "더보기" 확장 |
| VQ4 레이아웃 | `{spacing.xl}` 32px 좌우 여백 (모바일). `{spacing.section}` 80px 섹션 vertical padding. `max-w-[1440px]` 콘텐츠 너비 잠금 | 전체 페이지 레이아웃 |
| VQ5 포커스·aria | 자체 구현 focus trap (useBodyScrollLock + 포커스 순환 로직). BottomSheet/Dialog 열림 시 첫 필드 포커스. 닫힘 시 트리거 복귀. ESC 즉시 닫기 | BottomSheet, Dialog |

---

## 11. Drizzle + Supabase 통합 상세

### 11.1 DB 연결

```typescript
// db/index.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(client, { schema });
```

### 11.2 drizzle-kit 설정

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

### 11.3 Migration 워크플로우

```bash
# 스키마 변경 후
pnpm drizzle-kit generate   # migration 파일 생성
pnpm drizzle-kit migrate    # DB 적용

# 개발 중 직접 push (migration 파일 없이)
pnpm drizzle-kit push
```

---

## 12. design-decision.md 미해결 흡수 결과

| design-decision 미해결 | tech-decision 결정 |
|---|---|
| Right Drawer vs Dialog | Radix UI Dialog 폐기 → 자체 구현 Dialog (centered modal). 데스크톱(≥834px) 시도 기록 입력 UX로 사용. |
| Bottom Sheet 라이브러리 | Vaul 폐기 → 자체 구현 BottomSheet. 모바일(≤833px) 시도 기록 입력 UX로 사용. |
| rgba(0,0,0,0.08) 토큰화 | `divider-subtle` 토큰 등록 (`tailwind.config.ts`). 폼 입력 border에 적용. DESIGN-GAP-1 해결. |
| H2·H3 클릭 이벤트 수집 | 수집 안 함 (1차). M1·M2·M3는 DB count로 측정. H2·H3는 자기보고로 회고. |

---

## 13. 미해결 / 후속 결정

| ID | 항목 | 현재 결정 | 후속 검토 시점 |
|----|------|----------|-------------|
| U1 | 한글 메뉴명 검색 인덱싱 정밀도 | `lower(name)` btree index (기본). trigram 필요 시 `pg_trgm` 확장 후 GIN index | 실사용 후 검색 정확도 확인 |
| U2 | youtube_cache TTL | 24h (기본값) | API quota 소진율 모니터링 후 72h/7d 연장 검토 |
| U3 | Drizzle migration 자동화 | 수동 (`drizzle-kit migrate` 수동 실행) | Vercel 배포 훅 연동 또는 별도 script 자동화 검토 |
| U4 | RLS 정책 세부 | 기본 user_id 비교 정책. Drizzle WHERE 절을 주 보안 경계로 사용 | 다중 사용자 전환 시 재검토 |
| U5 | Playwright E2E 선택 여부 | "선택" 상태 — 자체 컴포넌트 구현 완료 후 판단 | BottomSheet/Dialog 구현 완료 후 |
| U6 | youtube_cache 만료 레코드 정리 | 수동 또는 Postgres cron. 별도 처리 없으면 영구 누적 | 1개월 운영 후 row count 확인 |

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
| TC-09 | BottomSheet a11y | 열릴 때 첫 필드 포커스 이동 | 자동화 | Vitest + @testing-library |
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
