import { fetchTrending } from "./fetchTrending";

const TTL = 1000 * 60 * 10; // 10 phút - giảm từ 30 phút để cập nhật nhanh hơn

export async function warmTmdbCache() {
  await Promise.all([
    getTmdbCached("movie", "day"),
    getTmdbCached("tv", "day"),
  ]);
}

export async function getTmdbCached(type = "movie", timeWindow = "day") {
  const key = `tmdb_${type}_${timeWindow}`;
  const cached = sessionStorage.getItem(key);
  const cachedTime = sessionStorage.getItem(`${key}_time`);

  // Chỉ dùng cache nếu còn hạn VÀ dữ liệu không rỗng
  if (cached && cachedTime && Date.now() - parseInt(cachedTime) < TTL) {
    try {
      const parsedCache = JSON.parse(cached);
      // Kiểm tra cache có dữ liệu hợp lệ không
      if (Array.isArray(parsedCache) && parsedCache.length > 0) {
return parsedCache;
      } else {
        console.warn(`⚠️ Invalid cache for ${type}, clearing...`);
        sessionStorage.removeItem(key);
        sessionStorage.removeItem(`${key}_time`);
      }
    } catch (err) {
      console.error(`❌ Error parsing cache for ${type}:`, err);
      sessionStorage.removeItem(key);
      sessionStorage.removeItem(`${key}_time`);
    }
  } else if (cachedTime) {

  }

  // Fetch fresh data

  const fresh = await fetchTrending(type, timeWindow);

  // Chỉ cache nếu có dữ liệu hợp lệ
  if (Array.isArray(fresh) && fresh.length > 0) {
    sessionStorage.setItem(key, JSON.stringify(fresh));
    sessionStorage.setItem(`${key}_time`, Date.now().toString());
    sessionStorage.setItem("selected_movie", Math.floor(Math.random() * 10));

  } else {
    console.warn(`⚠️ No valid data to cache for ${type}`);
  }

  return fresh;
}

// Helper function để force clear cache (dùng khi cần refresh thủ công)
export function clearTmdbCache() {
  ["tmdb_movie_day", "tmdb_tv_day"].forEach((key) => {
    sessionStorage.removeItem(key);
    sessionStorage.removeItem(`${key}_time`);
  });

}

// Debug function để xem cache status
export function getTmdbCacheInfo() {
  const keys = ["tmdb_movie_day", "tmdb_tv_day"];
  const info = {};

  keys.forEach((key) => {
    const cached = sessionStorage.getItem(key);
    const cachedTime = sessionStorage.getItem(`${key}_time`);

    if (cached && cachedTime) {
      const age = Date.now() - parseInt(cachedTime);
      const ageMinutes = Math.floor(age / 1000 / 60);
      const remaining = TTL - age;
      const remainingMinutes = Math.floor(remaining / 1000 / 60);
      const data = JSON.parse(cached);

      info[key] = {
        itemCount: data.length,
        ageMinutes: ageMinutes,
        remainingMinutes: Math.max(0, remainingMinutes),
        expired: age >= TTL,
        cachedAt: new Date(parseInt(cachedTime)).toLocaleString("vi-VN"),
      };
    } else {
      info[key] = { status: "No cache" };
    }
  });

  console.table(info);
  return info;
}

// Thêm vào window object để dễ debug từ console
if (typeof window !== "undefined") {
  window.clearTmdbCache = clearTmdbCache;
  window.getTmdbCacheInfo = getTmdbCacheInfo;
}
