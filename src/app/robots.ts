import type { MetadataRoute } from "next";

/**
 * 1인 사용 도구라 검색엔진 색인 차단.
 * Phase 2(가구/멀티유저)에서 공개 페이지가 생기면 정책 재검토.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
