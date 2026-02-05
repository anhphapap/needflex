import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import LazyImage from "./LazyImage";
import { useMovieModal } from "../context/MovieModalContext";
import { useHoverPreview } from "../context/HoverPreviewContext";
import { createPortal } from "react-dom";
import { useTop } from "../context/TopContext";
import Top10Badge from "../assets/images/Top10Badge.svg";
import { useFavorites } from "../context/FavouritesProvider";
import Tooltip from "./Tooltip";
import { toast } from "react-toastify";
import { useWatching } from "../context/WatchingContext";
import { formatSecondsToMinutes, formatTime } from "../utils/data";
import logo_n from "../assets/images/N_logo.png";
import { useEffect, useState } from "react";
export default function HoverPreview() {
  const { hovered, onEnter, onLeave } = useHoverPreview();
  const navigate = useNavigate();
  const location = useLocation();
  const { openModal } = useMovieModal();
  const { topSet } = useTop();
  const { favoriteSlugs, toggleFavorite, loadingFav } = useFavorites();
  const isFavourite = favoriteSlugs.includes(hovered?.item?.slug);
  const { toggleWatching, getWatchingMovie, watchingSlugs } = useWatching();
  const [watchingMovie, setWatchingMovie] = useState(null);

  // Reset watchingMovie khi không hover
  useEffect(() => {
    if (!hovered) {
      setWatchingMovie(null);
    }
  }, [hovered]);

  useEffect(() => {
    if (!hovered?.item?.slug) return;

    if (hovered?.isWatching) {
      setWatchingMovie(hovered?.item);
      return;
    }
    if (watchingSlugs.length === 0) {
      setWatchingMovie(null);
      return;
    }
    setWatchingMovie(getWatchingMovie(hovered?.item?.slug) || null);
  }, [
    watchingSlugs,
    hovered?.item?.slug,
    getWatchingMovie,
    hovered?.isWatching,
  ]);

  const handleToggleFavorite = (e, item) => {
    e.stopPropagation();
    toggleFavorite({
      slug: item.slug,
      poster_url: item.poster_url,
      thumb_url: item.thumb_url,
      name: item.name,
      year: item.year,
      episode_current: item.episode_current,
      quality: item.quality,
      category: item.category,
      tmdb: item.tmdb,
      modified: item.modified,
      addedAt: new Date().toISOString(),
    });
    if (location.pathname === "/yeu-thich") {
      onLeave();
    }
  };
  const handleOpenModal = (slug, tmdb_id, tmdb_type) => {
    openModal(slug, tmdb_id, tmdb_type);
    onLeave();
  };
  const handlePlayMovie = (e, isTrailer = false) => {
    e.stopPropagation();
    // Check cả isWatching VÀ watchingMovie để xử lý "Xem tiếp" cho cả watching carousel và các carousel khác
    if (isWatching || watchingMovie) {
      const movieData = watchingMovie || hovered.item;
      const resumeData = {
        slug: movieData.slug,
        currentTime: movieData.currentTime || 0,
        duration: movieData.duration || 0,
        progress: movieData.progress || 0,
        timestamp: Date.now(),
      };

      localStorage.setItem("resumeVideo", JSON.stringify(resumeData));

      // Navigate trực tiếp - VideoPlayer sẽ xử lý fullscreen
      navigate(
        `/xem-phim/${movieData.slug}?svr=${movieData.svr || 0}&ep=${movieData.episode || 0}`
      );
    } else if (isTrailer) {
      toast.warning("Tính năng đang được phát triển.");
    } else {
      navigate(`/xem-phim/${hovered.item.slug}?svr=${0}&ep=${0}`);
    }
    onLeave();
  };
  if (!hovered || !hovered.rect) return null;
  const { item, rect, index, typeList, firstVisible, lastVisible, isWatching } =
    hovered;

  const content = (
    <AnimatePresence mode="wait">
      <motion.div
        key={item.slug + "hoverpreview" || item._id + "hoverpreview"}
        className="absolute z-[10000] shadow-xl shadow-black/80 rounded hidden lg:block pointer-events-auto"
        style={{
          top: rect.top - rect.height / (typeList === "top" ? 2.75 : 1.25),
          left:
            index === firstVisible
              ? rect.left
              : index === lastVisible
                ? rect.left - rect.width / 2
                : rect.left - rect.width / 4,
          width: rect.width,
        }}
        onMouseEnter={() => onEnter(hovered)}
        onMouseLeave={(e) => {
          const rect = hovered?.rect;
          if (!rect) return onLeave();
          const { clientX, clientY } = e;
          const insideThumb =
            clientX >= rect.left &&
            clientX <= rect.left + rect.width &&
            clientY >= rect.top &&
            clientY <= rect.top + rect.height;

          if (!insideThumb) onLeave();
        }}
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{
          opacity: 0,
          scale: 0.9,
          y: 15,
          transition: { duration: 0.15, ease: "easeInOut" },
        }}
        transition={{
          opacity: { duration: 0.25, ease: "easeOut" },
          scale: { duration: 0.25, ease: "easeOut" },
          y: { duration: 0.25, ease: "easeOut" },
        }}
        onClick={() => handleOpenModal(item.slug, item.tmdb.id, item.tmdb.type)}
      >
        <div className="bg-[#141414] rounded origin-top w-[150%] cursor-pointer overflow-hidden">
          <div className="relative w-full aspect-video rounded-t overflow-hidden">
            <div className="w-full h-full">
              <LazyImage
                src={item.poster_url}
                alt={item.name}
                sizes="24vw"
                mode="blur"
                priority={true}
              />
              {item.sub_docquyen && (
                <img
                  loading="lazy"
                  src={logo_n}
                  alt="Needflex"
                  className="absolute top-3 left-3 w-4"
                />
              )}
              {topSet?.has(item.slug) && (
                <div className="absolute top-0 right-1">
                  <img
                    src={Top10Badge}
                    alt="Top 10"
                    className="w-12 aspect-auto"
                  />
                </div>
              )}
              {new Date().getTime() - new Date(item.modified?.time).getTime() <
                1000 * 60 * 60 * 24 * 3 && (
                  <>
                    {item.episode_current.toLowerCase().includes("hoàn tất") ||
                      item.episode_current.toLowerCase().includes("full") ? (
                      <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-auto bg-[#e50914] py-[2px] px-2 rounded-t text-sm font-semibold text-center shadow-black/80 shadow">
                        Mới thêm
                      </span>
                    ) : item.episode_current.toLowerCase().includes("trailer") ? (
                      <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-black w-auto bg-white py-[2px] px-2 rounded-t text-sm font-semibold text-center shadow-black/80 shadow">
                        Sắp ra mắt
                      </span>
                    ) : (
                      <div className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 flex rounded-t overflow-hidden w-auto">
                        <span className="text-nowrap text-white bg-[#e50914] py-[2px] px-2 text-sm font-semibold text-center shadow-black/80 shadow">
                          Tập mới
                        </span>
                        <span className="text-nowrap text-black bg-white py-[2px] px-2 text-sm font-semibold text-center shadow-black/80 shadow">
                          Xem ngay
                        </span>
                      </div>
                    )}
                  </>
                )}
            </div>
            {/* <div className="bg-gradient-to-t from-[#141414] to-transparent absolute w-full h-[40%] -bottom-[2px] left-0 z-10"></div> */}
          </div>
          <div className="px-4 py-4 flex flex-col gap-2">
            <div className="flex justify-between px-1">
              <div className="flex items-center gap-2">
                <div
                  className={`bg-white rounded-full h-[40px] w-[40px] flex items-center justify-center hover:bg-white/80 cursor-pointer ${item.episode_current.toLowerCase().includes("trailer")
                    ? "pl-0"
                    : "pl-[2px]"
                    }`}
                  onClick={(e) =>
                    handlePlayMovie(
                      e,
                      item.episode_current.toLowerCase().includes("trailer")
                    )
                  }
                >
                  <FontAwesomeIcon
                    icon={`fa-solid ${item.episode_current.toLowerCase().includes("trailer") ||
                      item.episode_current.toLowerCase().includes("tập 0")
                      ? "fa-bell"
                      : "fa-play"
                      }`}
                    size="sm"
                  />
                </div>
                <div
                  className={`relative group/tooltip text-white border-2 cursor-pointer  bg-black/10 rounded-full h-[40px] w-[40px] flex items-center justify-center hover:border-white ${isFavourite
                    ? "border-red-500"
                    : "hover:border-white border-white/40"
                    }`}
                  onClick={(e) => handleToggleFavorite(e, item)}
                >
                  <FontAwesomeIcon
                    icon={
                      loadingFav
                        ? "fa-solid fa-spinner"
                        : `fa-${isFavourite ? "solid" : "regular"} fa-heart`
                    }
                    size="sm"
                    className={`${isFavourite ? "text-red-500" : "text-white"
                      } ${loadingFav ? "animate-spin" : ""}`}
                  />
                  <Tooltip
                    content={isFavourite ? "Bỏ thích" : "Yêu thích"}
                    size="sm"
                  />
                </div>
                {isWatching && (
                  <div
                    className={
                      "relative group/tooltip text-white border-2 cursor-pointer  bg-black/10 rounded-full h-[40px] w-[40px] flex items-center justify-center hover:border-white border-white/40"
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleWatching(watchingMovie || item);
                      setWatchingMovie(null);
                      onLeave();
                    }}
                  >
                    <FontAwesomeIcon
                      icon="fa-solid fa-xmark"
                      size="sm"
                      className="text-white"
                    />
                    <Tooltip content="Xoá khỏi hàng" size="sm" />
                  </div>
                )}
              </div>
              <div
                className={`relative group/tooltip text-white border-2 cursor-pointer border-white/40 bg-black/10 rounded-full h-[40px] w-[40px] flex items-center justify-center hover:border-white hover:bg-white/10"
                `}
              >
                <FontAwesomeIcon icon="fa-solid fa-chevron-down" size="sm" />
                <Tooltip content="Xem thêm" size="sm" />
              </div>
            </div>

            <h3
              className={`font-bold text-base text-white ${isWatching || watchingMovie !== null ? "" : "truncate"
                }`}
            >
              {!(isWatching || watchingMovie !== null)
                ? item.name
                : `${watchingMovie?.name} - Tập ${watchingMovie?.episodeName}`}
            </h3>
            {!(isWatching || watchingMovie !== null) ? (
              <>
                <div className="flex space-x-2 items-center text-white/80 text-sm">
                  <span className="lowercase">{item.year}</span>
                  <span className="hidden lg:block">
                    {item.episode_current.toLowerCase().includes("hoàn tất")
                      ? "Hoàn tất"
                      : item.episode_current}
                  </span>
                  <span className="px-1 border rounded font-bold uppercase h-[20px] flex items-center justify-center">
                    {item.quality}
                  </span>
                </div>
                <div className="text-white/80 text-sm flex items-center gap-2 flex-wrap">
                  {item.category.slice(0, 3).map((cat, idx) => (
                    <span key={cat.name + "category" + item._id} className="flex items-center gap-1">
                      {idx !== 0 && (
                        <FontAwesomeIcon
                          icon="fa-solid fa-circle"
                          size="2xs"
                          className="opacity-50 scale-50"
                        />
                      )}
                      <span>{cat.name}</span>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <div className="h-[3px] bg-[#5b5b5b] w-full">
                  <div
                    className="h-full bg-[#d80f16] transition-all duration-300"
                    style={{ width: `${watchingMovie?.progress || 0}%` }}
                  />
                </div>
                <span className="text-white/80 text-sm whitespace-nowrap text-nowrap font-medium">
                  {formatSecondsToMinutes(watchingMovie?.currentTime || 0)}/
                  {formatSecondsToMinutes(watchingMovie?.duration || 0)}ph
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
