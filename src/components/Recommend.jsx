import React, { useState, useEffect } from "react";
import LazyImage from "./LazyImage";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tooltip from "./Tooltip";
import axios from "axios";
import { useFavorites } from "../context/FavouritesProvider";
import { useNavigate } from "react-router-dom";
import { Play } from "lucide-react";
export default function Recommend({
  type = "phim-moi-cap-nhat",
  sort_field = "_id",
  country = "",
  category = "",
  totalPage = 3,
  slug = "",
}) {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const { favoriteSlugs, toggleFavorite, loadingFav } = useFavorites();
  const isFavourite = (slug) => favoriteSlugs.includes(slug);
  const navigate = useNavigate();

  const handleToggleFavorite = (e, movie) => {
    e.stopPropagation();
    toggleFavorite({
      slug: movie.slug,
      poster_url: movie.poster_url,
      thumb_url: movie.thumb_url,
      name: movie.name,
      year: movie.year,
      episode_current: movie.episode_current,
      quality: movie.quality,
      category: movie.category,
      tmdb: movie.tmdb,
      modified: movie.modified,
      addedAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
  }, [type, sort_field, country, category, slug]);

  useEffect(() => {
    let isMounted = true;

    const fetchMovies = async () => {
      try {
        if (!hasMore) return;
        setLoading(true);
        const api = `${
          import.meta.env.VITE_API_LIST
        }${type}?sort_field=${sort_field}&category=${category}&country=${country}&page=${page}&limit=8`;
        const res = await axios.get(api);
        const items = res.data.data.items || [];

        if (isMounted) {
          setMovies((prev) => [...prev, ...items]);
          if (items.length < 8) setHasMore(false);
          else setHasMore(page < totalPage);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchMovies();

    return () => {
      isMounted = false;
    };
  }, [page, type, sort_field, country, category, hasMore, totalPage]);

  const visibleMovies = movies.filter(
    (m) => slug && m.slug !== slug && m.episode_current !== "Trailer"
  );

  return (
    <>
      {visibleMovies.length > 0 && (
        <div className="text-white relative py-6">
          <h2 className="text-xl lg:text-2xl font-bold">Nội dung tương tự</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-5">
            {visibleMovies.map((movie) => (
              <div
                key={movie._id + "recommend"}
                className="flex flex-col bg-[#2f2f2f] rounded overflow-hidden group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/xem-phim/${movie.slug}?svr=0&ep=0`);
                }}
              >
                <div className="relative w-full aspect-video overflow-hidden group/nextEpisode">
                  <LazyImage
                    src={movie.poster_url}
                    alt={movie.name}
                    sizes="(max-width: 768px) 45vw,(max-width: 1280px) 28vw, 20vw"
                    quality={65}
                  />
                  <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b to-transparent from-[#141414]/50"></div>
                  <span className="absolute top-1 right-2 text-white text-sm">
                    {movie.episode_current.toLowerCase().includes("hoàn tất")
                      ? "Hoàn tất"
                      : movie.episode_current}
                  </span>
                  <div className="absolute bottom-0 right-0 w-full h-full flex items-center justify-center rounded-sm cursor-pointer opacity-0 group-hover/nextEpisode:opacity-100 transition-all ease-linear duration-100 delay-100">
                    <button
                      className="group relative border-[1px] border-white/80 rounded-full p-1 sm:p-2 bg-black/50 "
                      aria-label="Phát video"
                    >
                      <Play
                        size={36}
                        className="text-white fill-white drop-shadow-2xl"
                        strokeWidth={2}
                        fill="white"
                      />
                      <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                    </button>
                  </div>
                </div>
                <div className="flex space-x-2 items-center justify-between text-white/80 text-sm p-3 sm:p-4">
                  <div className="flex gap-x-2 gap-y-1  items-center flex-wrap">
                    {movie.imdb?.vote_count > 0 ? (
                      <a
                        className="flex items-center space-x-1 text-xs border-[1px] border-yellow-500 rounded leading-[14px] px-1 py-[2px] bg-yellow-500/10 hover:bg-yellow-500/20 transition-all ease-linear"
                        href={`https://www.imdb.com/title/${movie.imdb.id}`}
                        target="_blank"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-yellow-500">IMDb</span>
                        <span className="font-bold">
                          {movie.imdb.vote_average.toFixed(1)}
                        </span>
                      </a>
                    ) : (
                      movie.tmdb?.vote_count > 0 && (
                        <a
                          className="flex items-center space-x-1 text-xs border-[1px] border-[#01b4e4] rounded leading-[14px] px-1 py-[2px] bg-[#01b4e4]/10 hover:bg-[#01b4e4]/20 transition-all ease-linear"
                          href={`https://www.themoviedb.org/${
                            movie.type == "single" ? "movie" : "tv"
                          }/${movie.tmdb.id}`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="text-[#01b4e4]">TMDB</span>
                          <span className="font-bold">
                            {movie.tmdb.vote_average.toFixed(1)}
                          </span>
                        </a>
                      )
                    )}
                    <span className="text-xs leading-[14px] px-1 py-0 border-[0.5px] rounded uppercase flex items-center justify-center">
                      {movie.quality}
                    </span>
                    <span className="lowercase">{movie.year}</span>
                  </div>
                  <div
                    className={`relative group/tooltip aspect-square text-white border-2 cursor-pointer bg-black/10 rounded-full h-[40px] w-[40px] flex items-center justify-center hover:border-white ${
                      isFavourite(movie.slug)
                        ? "border-red-500"
                        : "border-white/40"
                    }`}
                    onClick={(e) => handleToggleFavorite(e, movie)}
                  >
                    <FontAwesomeIcon
                      icon={
                        loadingFav
                          ? "fa-solid fa-spinner"
                          : `fa-${
                              isFavourite(movie.slug) ? "solid" : "regular"
                            } fa-heart`
                      }
                      size="sm"
                      className={`${
                        isFavourite(movie.slug) ? "text-red-500" : "text-white"
                      } ${loadingFav ? "animate-spin" : ""}`}
                    />
                    <Tooltip
                      content={
                        isFavourite(movie.slug) ? "Bỏ thích" : "Yêu thích"
                      }
                      size="sm"
                    />
                  </div>
                </div>
                <h2 className="text-white text-sm sm:text-base font-bold truncate p-3 sm:p-4 !pt-0">
                  {movie.name}
                </h2>
              </div>
            ))}
            {loading &&
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="w-full h-full bg-gray-700 rounded aspect-square"></div>
                </div>
              ))}
          </div>
          {hasMore ? (
            <div className="absolute bottom-4 left-0 border-b-[1.6px] border-white/20 w-full bg-gradient-to-t from-[#181818] to-transparent h-12">
              <button
                onClick={() => setPage(page + 1)}
                className="absolute group/tooltip bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 aspect-square px-[10px] py-[1px] rounded-full bg-[#181818]/50 border-white/60 border-[1.4px] text-white hover:border-white transition-all ease-linear"
              >
                <FontAwesomeIcon icon="fa-solid fa-chevron-down" size="xs" />
                <Tooltip content={"Xem thêm"} />
              </button>
            </div>
          ) : (
            <div className="h-6 border-b-[1.6px] border-white/20 w-full "></div>
          )}
        </div>
      )}
    </>
  );
}
