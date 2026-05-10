const cache = new Map();

const CACHE_TTL = 1000 * 60 * 10;
const API_SEARCH =
  process.env.API_SEARCH || "https://ophim1.com/v1/api/tim-kiem?";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "public, s-maxage=300");

  try {
    const { type = "movie", time = "day" } = req.query;

    const cacheKey = `mobile_${type}_${time}`;

    // cache
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.status(200).json(cached.data);
    }

    // tmdb
    const tmdbRes = await fetch(
      `https://api.themoviedb.org/3/trending/${type}/${time}?api_key=${process.env.TMDB_KEY}&language=vi-VN`,
    );

    if (!tmdbRes.ok) {
      console.error(`❌ TMDB API error: ${tmdbRes.status}`);
      throw new Error("TMDB fetch failed");
    }

    const tmdbData = await tmdbRes.json();
    console.log(
      `[MOBILE TRENDING] TMDB API response status: ${tmdbRes.status}`,
    );

    const topItems = (tmdbData.results || []).slice(0, 20);

    console.log(`[MOBILE TRENDING] TMDB returned ${topItems.length} items`);

    // convert -> ophim
    const mapped = await Promise.allSettled(
      topItems.map(async (item) => {
        try {
          console.log(
            `[OPHIM MAP] Processing TMDB ID: ${item.id} (${item.name || item.original_title})`,
          );

          const ophimRes = await fetch(`${API_SEARCH}keyword=${item.id}`);

          if (!ophimRes.ok) {
            console.warn(
              `[OPHIM MAP] ❌ API search failed for TMDB ${item.id}: ${ophimRes.status}`,
            );
            return null;
          }

          const ophimData = await ophimRes.json();

          const total = ophimData?.data?.params?.pagination?.totalItems || 0;

          if (total === 0) {
            console.warn(`[OPHIM MAP] ⚠️ No results found for TMDB ${item.id}`);
            return null;
          }

          const movie = ophimData?.data?.items?.[0];

          if (!movie?.tmdb?.id) {
            console.warn(
              `[OPHIM MAP] ⚠️ Movie found but missing tmdb ID for TMDB ${item.id}`,
            );
            return null;
          }

          if (String(movie.tmdb.id) !== String(item.id)) {
            console.warn(
              `[OPHIM MAP] ⚠️ TMDB ID mismatch: expected ${item.id}, got ${movie.tmdb.id}`,
            );
            return null;
          }

          console.log(
            `[OPHIM MAP] ✅ Success: TMDB ${item.id} → Ophim ${movie._id}`,
          );

          return {
            _id: movie._id,
            name: movie.name,
            origin_name: movie.origin_name,
            slug: movie.slug,
            poster_url: movie.poster_url,
            thumb_url: movie.thumb_url,
            quality: movie.quality,
            lang: movie.lang,
            year: movie.year,
            episode_current: movie.episode_current,
            category: movie.category,
            country: movie.country,
            tmdb: movie.tmdb,
          };
        } catch (err) {
          console.error(
            `[OPHIM MAP] ❌ Exception for TMDB ${item.id}:`,
            err.message,
          );
          return null;
        }
      }),
    );

    const movies = mapped
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean)
      .slice(0, 10);

    const successCount = mapped.filter(
      (r) => r.status === "fulfilled" && r.value,
    ).length;
    const failureCount = mapped.length - successCount;

    console.log(
      `[MOBILE TRENDING] Mapping results: ${successCount} ✅ / ${failureCount} ❌ out of ${mapped.length}`,
    );
    console.log(
      `[MOBILE TRENDING] Mapped ${mapped.length} → Filtered ${movies.length}`,
    );
    if (movies.length === 0) {
      console.warn(
        `[MOBILE TRENDING] 0 movies after filtering! API_SEARCH=${API_SEARCH} | TMDB_KEY=${process.env.TMDB_KEY ? "✅" : "❌"}`,
      );
    }

    const response = {
      results: movies,
      total: movies.length,
      updatedAt: Date.now(),
    };

    // save cache
    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: response,
    });

    return res.status(200).json(response);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      results: [],
      total: 0,
      error: err.message,
    });
  }
}
