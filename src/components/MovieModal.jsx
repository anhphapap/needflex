import React, { useEffect, useState } from "react";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { UserAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import Tooltip from "./Tooltip";
import { formatSecondsToMinutes, getYoutubeId } from "../utils/data";
import YouTube from "react-youtube";
import LazyImage from "./LazyImage";
import Top10Icon from "../assets/images/Top10Icon.svg";
import { useTop } from "../context/TopContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Captions, ChevronDown, Info, Server } from "lucide-react";
import { useFavorites } from "../context/FavouritesProvider";
import { useWatching } from "../context/WatchingContext";
import { useSEOManager } from "../context/SEOManagerContext";
import logo_n from "../assets/images/N_logo.png";
import Recommend from "./Recommend";
const customStyles = {
  content: {
    position: "absolute",
    left: "50%",
    bottom: "auto",
    transform: "translate(-50%)",
    backgroundColor: "transparent",
    boxShadow: "2px solid black",
    color: "white",
    padding: 0,
    border: "none",
    maxHeight: "100vh",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingBottom: "0",
    overflowY: "auto",
  },
};

export default function MovieModal({
  onClose,
  slug,
  tmdb_id,
  tmdb_type,
  isOpen,
}) {
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showTrailer, setShowTrailer] = useState(false);
  const [fadeOutImage, setFadeOutImage] = useState(false);
  const [intervalId, setIntervalId] = useState(null);
  const [modal, setModal] = useState(null);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [episodesRange, setEpisodesRange] = useState(0);
  const [isContentExpanded, setIsContentExpanded] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [server, setServer] = useState(0);
  const { favoriteSlugs, toggleFavorite, loadingFav } = useFavorites();
  const [isFavourite, setIsFavourite] = useState(false);
  const navigate = useNavigate();
  const { topSet } = useTop();
  const { getWatchingMovie, watchingSlugs } = useWatching();
  const { pushSEO } = useSEOManager();
  const [watchingMovie, setWatchingMovie] = useState(null);
  const [seoOnPage, setSeoOnPage] = useState(null);
  const scrollToMoreInfo = () => {
    const moreInfo = document.getElementById("more-info");
    if (moreInfo) {
      moreInfo.scrollIntoView({ behavior: "smooth" });
    }
  };
  useEffect(() => {
    if (favoriteSlugs.includes(slug)) {
      setIsFavourite(true);
    } else {
      setIsFavourite(false);
    }
  }, [favoriteSlugs, slug]);

  const handlePlayMovie = (movie) => {
    // Lưu thông tin resume vào localStorage
    const resumeData = {
      slug: movie.slug,
      currentTime: movie.currentTime || 0,
      duration: movie.duration || 0,
      progress: movie.progress || 0,
      timestamp: Date.now(),
    };

    localStorage.setItem("resumeVideo", JSON.stringify(resumeData));

    // Navigate trực tiếp - VideoPlayer sẽ xử lý fullscreen
    navigate(`/xem-phim/${movie.slug}?svr=${movie.svr}&ep=${movie.episode}`);
  };

  useEffect(() => {
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [intervalId]);

  // SEO Management - push SEO khi modal mở
  useEffect(() => {
    if (isOpen && seoOnPage) {
      pushSEO(seoOnPage);
    }
  }, [isOpen, seoOnPage]);

  // Page Visibility API - dừng video khi chuyển tab hoặc mất focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsPageVisible(isVisible);

      if (player && player.getPlayerState) {
        try {
          if (!isVisible) {
            // Tab không visible - dừng video nếu đang phát

            if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {
              player.pauseVideo();
              setIsVideoPaused(true);
              setFadeOutImage(false);
            }
          } else {
            // Tab visible - tiếp tục phát video nếu đang pause

            if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {

              player.playVideo();
              setIsVideoPaused(false);
              setFadeOutImage(true);
            }
          }
        } catch (error) {
          console.warn("Modal: Error in visibility change:", error);
        }
      }
    };

    // Lắng nghe sự kiện visibility change
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [player, isVideoPaused]);

  // Window Focus API - dừng video khi mất focus khỏi cửa sổ trình duyệt
  useEffect(() => {
    const handleWindowFocus = () => {

      setIsPageVisible(true);

      if (player && player.getPlayerState) {
        try {
          // Cửa sổ có focus - tiếp tục phát video nếu đang pause
          if (player.getPlayerState() === window.YT.PlayerState.PAUSED) {

            player.playVideo();
            setIsVideoPaused(false);
            setFadeOutImage(true);
          }
        } catch (error) {
          console.warn("Modal: Error in window focus:", error);
        }
      }
    };

    const handleWindowBlur = () => {

      setIsPageVisible(false);

      if (player && player.getPlayerState) {
        try {
          // Cửa sổ mất focus - dừng video nếu đang phát
          if (player.getPlayerState() === window.YT.PlayerState.PLAYING) {

            player.pauseVideo();
            setIsVideoPaused(true);
            setFadeOutImage(false);
          }
        } catch (error) {
          console.warn("Modal: Error in window blur:", error);
        }
      }
    };

    // Lắng nghe sự kiện focus và blur của cửa sổ
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [player]);
  const { user } = UserAuth();
  const [playerOptions, setPlayerOptions] = useState({
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 1,
      mute: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      iv_load_policy: 3,
      showinfo: 0,
      fs: 0,
      disablekb: 1,
      playsinline: 1,
    },
  });

  const handleClose = () => {
    if (intervalId) clearInterval(intervalId);
    setShowTrailer(false);
    setPlayer(null);
    setFadeOutImage(false);
    setIsVideoPaused(false);
    setIsPageVisible(true);
    onClose();
  };

  const getImages = async (api_path) => {
    try {
      const res = await axios.get(api_path);
      const logo =
        res.data?.logos?.find(
          (l) => l.iso_3166_1 === "US" && l.iso_639_1 === "en"
        ) || res.data?.logos?.[0];
      const backdrop = res.data?.backdrops?.find(
        (b) =>
          b.aspect_ratio >= 1.77 &&
          b.iso_639_1 === null &&
          b.iso_3166_1 === null &&
          b.height > 1000
      );
      return {
        backdrop: backdrop ? backdrop.file_path : null,
        logo: logo ? logo.file_path : null,
      };
    } catch (error) {
      return {
        backdrop: null,
        logo: null,
      };
    }
  };

  useEffect(() => {
    if (watchingSlugs.length === 0) return;
    setWatchingMovie(getWatchingMovie(slug) || null);
  }, [watchingSlugs, slug]);

  useEffect(() => {
    if (!slug) return;

    setPlayer(null);
    setShowTrailer(false);
    setFadeOutImage(false);
    setIsVideoPaused(false);
    setIsPageVisible(true);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }

    const fetchMovie = async () => {
      if (
        !tmdb_id ||
        !tmdb_type ||
        tmdb_id === "null" ||
        tmdb_type === "null" ||
        tmdb_id === null ||
        tmdb_type === null
      ) {
        const res = await axios.get(
          `${import.meta.env.VITE_API_DETAILS}${slug}`
        );
        setModal(res.data.data);
        setSeoOnPage(res.data.data.seoOnPage);
        return;
      }
      const [data, image] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_DETAILS}${slug}`),
        getImages(
          `https://api.themoviedb.org/3/${tmdb_type}/${tmdb_id}/images?api_key=${import.meta.env.VITE_TMDB_KEY
          }`
        ),
      ]);
      setModal({ ...data.data.data, tmdb_image: image });
      setSeoOnPage(data.data.data.seoOnPage);
    };
    fetchMovie();
    if (!isMuted) {
      setPlayerOptions({
        ...playerOptions,
        playerVars: { ...playerOptions.playerVars, mute: 0 },
      });
    } else {
      setPlayerOptions({
        ...playerOptions,
        playerVars: { ...playerOptions.playerVars, mute: 1 },
      });
    }
    const t = setTimeout(() => setShowTrailer(true), 300);
    return () => clearTimeout(t);
  }, [slug, user]);

  const handleSaveMovie = () => {
    toggleFavorite({
      slug: modal.item.slug,
      poster_url: modal.item.poster_url,
      thumb_url: modal.item.thumb_url,
      name: modal.item.name,
      year: modal.item.year,
      episode_current: modal.item.episode_current,
      quality: modal.item.quality,
      category: modal.item.category,
      tmdb: modal.item.tmdb,
      modified: modal.item.modified,
      addedAt: new Date().toISOString(),
    });
  };

  const handleToggleMute = () => {
    if (!player) return;
    if (isMuted) player.unMute();
    else player.mute();
    setIsMuted((prev) => !prev);
  };

  if (loading || !modal?.item)
    return (
      <Modal
        isOpen={isOpen}
        onRequestClose={onClose}
        style={customStyles}
        ariaHideApp={false}
        className="w-full lg:w-[94%] xl:w-[70%] !h-screen flex items-center justify-center 2xl:w-[50%] text-xs lg:text-lg outline-none lg:bottom-auto lg:!top-[5%] !bg-[#181818]"
      >
        <button
          className="aspect-square w-7 rounded-full bg-[#181818] absolute right-3 top-3 z-10 flex items-center justify-center"
          onClick={onClose}
        >
          <FontAwesomeIcon icon="fa-solid fa-xmark" />
        </button>
        <div className="h-screen lg:h-[50vh] flex items-center justify-center">
          <FontAwesomeIcon
            icon="fa-solid fa-spinner"
            size="2xl"
            className="animate-spin text-white"
          />
        </div>
      </Modal>
    );
  const youtubeId = getYoutubeId(modal.item.trailer_url);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      ariaHideApp={false}
      className="w-full lg:w-[94%] xl:w-[70%] 2xl:w-[50%] text-xs lg:text-lg outline-none !top-0 lg:!top-[4%] mb-8 lg:mb-0 overflow-auto lg:overflow-visible"
    >
      <div className="pb-0 lg:pb-[4vh]">
        <div className="flex flex-col w-full lg:rounded-lg bg-[#181818] pb-8 lg:pb-0">
          <div className="aspect-video bg-cover bg-center w-full relative lg:rounded-t-lg lg:overflow-hidden">
            <div
              className={`absolute top-0 left-0 w-full h-full object-cover z-10 transition-opacity duration-1000 ease-in-out ${fadeOutImage ? "opacity-0" : "opacity-100"
                }`}
            >
              <LazyImage
                src={
                  modal?.tmdb_image?.backdrop
                    ? "https://image.tmdb.org/t/p/" +
                    modal?.tmdb_image?.backdrop
                    : modal.item.poster_url
                }
                mode="blur"
                alt={modal.item.name}
                sizes="(max-width: 640px): 50vw,(max-width: 1280px) 100vw,(max-width: 1535px) 70vw, 50vw"
                priority={true}
              />
            </div>

            {youtubeId && (
              <div
                className={`absolute top-0 left-0 w-full h-full transition-opacity duration-700 ease-in-out ${showTrailer ? "opacity-100" : "opacity-0 pointer-events-none"
                  }`}
              >
                <YouTube
                  videoId={youtubeId}
                  opts={playerOptions}
                  className="aspect-video object-cover pointer-events-none absolute w-full h-full top-0 left-0 z-0 rounded-t-lg"
                  onReady={(e) => {
                    const ytPlayer = e.target;
                    const iframe = ytPlayer.getIframe();
                    iframe.style.pointerEvents = "none";
                    setPlayer(ytPlayer);
                    ytPlayer.playVideo();
                    if (isMuted) ytPlayer.mute();

                    // Set trạng thái video đang phát
                    setIsVideoPaused(false);

                    const id = setInterval(() => {
                      const duration = ytPlayer.getDuration();
                      const current = ytPlayer.getCurrentTime();

                      if (current > 0.1) setFadeOutImage(true);

                      if (duration - current <= 6) {
                        clearInterval(id);
                        ytPlayer.stopVideo();

                        setFadeOutImage(false);
                        setTimeout(() => setShowTrailer(false), 800);
                      }
                    }, 500);

                    setIntervalId(id);
                    ytPlayer._checkTime = id;
                  }}
                  onStateChange={(e) => {
                    if (e.data === window.YT.PlayerState.ENDED) {
                      if (player?._checkTime) clearInterval(player._checkTime);

                      setFadeOutImage(false);
                      setTimeout(() => setShowTrailer(false), 800);
                    }

                    if (e.data === window.YT.PlayerState.PAUSED) {
                      if (player?._checkTime) clearInterval(player._checkTime);
                    }
                  }}
                />
              </div>
            )}
            <div className="absolute top-1/2 left-0 bottom-0 right-0 bg-gradient-to-t from-[#181818] to-transparent z-10" />
            <button
              className="bg-[#181818] absolute top-[3%] right-[5%] md:right-4  md:top-4 h-7 sm:h-10 aspect-square rounded-full flex items-center justify-center z-20 shadow-md"
              onClick={onClose}
            >
              <FontAwesomeIcon icon="fa-solid fa-xmark" className="text-lg" />
            </button>
            <div className="flex flex-row sm:flex-col space-x-2 space-y-2 lg:space-y-3 justify-between absolute left-[5%] right-[5%] bottom-[5%] z-20">
              <div
                className={`flex flex-col justify-start sm:justify-end space-y-1 sm:space-y-2 lg:space-y-3 w-2/3 sm:px-0 ease-linear duration-[1000ms] ${fadeOutImage
                  ? "delay-[3000ms] scale-75 translate-y-[12.5%] -translate-x-[12.5%]"
                  : "delay-0 scale-100 translate-x-0 translate-y-0"
                  }`}
              >
                <div className="flex items-center space-x-1 justify-start sm:scale-100 scale-75 -translate-x-[12.5%] sm:translate-x-0 w-full">
                  <img
                    className="h-[15px] sm:h-[20px] object-cover"
                    src={logo_n}
                    alt="Needflex"
                  ></img>
                  <span className="font-bold text-white text-xs tracking-[3px]">
                    {modal.item.type === "series"
                      ? "LOẠT PHIM"
                      : modal.item.type === "hoathinh"
                        ? "HOẠT HÌNH"
                        : "PHIM"}
                  </span>
                </div>
                <div className={`w-2/3 transition-all `}>
                  {modal?.tmdb_image?.logo ? (
                    <LazyImage
                      aspect="contain"
                      mode="blur"
                      src={
                        "https://image.tmdb.org/t/p/" + modal.tmdb_image.logo
                      }
                      alt={modal.item.name}
                      sizes="(max-width: 640px) 30vw, (max-width: 1400px) 40vw, 50vw"
                      priority
                    />
                  ) : (
                    <div
                      className={`w-full max-h-[43.75%] sm:h-auto sm:max-h-[40%] object-cover transition-all ease-linear duration-[1000ms] `}
                    >
                      <h1
                        className="uppercase text-4xl md:text-6xl xl:text-7xl font-bold tracking-tighter text-white truncate line-clamp-3 sm:line-clamp-2 text-pretty text-start"
                        style={{ textShadow: "2px 2px 4px rgba(0, 0, 0, 0.6)" }}
                      >
                        {modal.item.origin_name}
                      </h1>
                    </div>
                  )}
                </div>
                {watchingMovie !== null && (
                  <div className="sm:flex hidden flex-col gap-1 w-full">
                    <span className="text-white/80 text-xs sm:text-sm whitespace-nowrap text-nowrap font-medium">
                      Tập {watchingMovie.episodeName}
                    </span>
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-[3px] bg-[#5b5b5b] w-full">
                        <div
                          className="h-full bg-[#d80f16] transition-all duration-300"
                          style={{ width: `${watchingMovie.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-white/80 text-xs sm:text-sm whitespace-nowrap text-nowrap font-medium">
                        {formatSecondsToMinutes(watchingMovie.currentTime || 0)}
                        /{formatSecondsToMinutes(watchingMovie.duration || 0)}ph
                      </span>
                    </div>
                  </div>
                )}
              </div>
              <div className="sm:hidden flex items-end justify-center">
                {showTrailer && youtubeId && fadeOutImage && (
                  <button
                    onClick={handleToggleMute}
                    className="text-white border-2 cursor-pointer border-white/40 bg-black/10 p-2 aspect-square rounded-full flex items-center justify-center hover:border-white transition-all ease-linear"
                  >
                    <div className="h-5 w-5 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={
                          isMuted
                            ? "fa-solid fa-volume-xmark"
                            : "fa-solid fa-volume-high"
                        }
                        className="text-lg"
                        size="xs"
                      />
                    </div>
                  </button>
                )}
              </div>
              <div className="sm:flex hidden space-x-2 justify-between w-full !ml-0">
                <div className="flex space-x-2">
                  <div className="relative rounded bg-white hover:bg-white/80 flex flex-nowrap items-center justify-center transition-all ease-linear">
                    {(modal.item.episodes[0].server_data[0].link_embed != "" &&
                      (watchingMovie === null ? (
                        <div
                          onClick={() =>
                            navigate(
                              `/xem-phim/${modal.item.slug}?svr=${0}&ep=${0}`
                            )
                          }
                          key={modal.item._id + 0}
                        >
                          <button className="px-4 sm:px-7 lg:px-10 font-semibold text-black flex items-center space-x-2">
                            <FontAwesomeIcon icon="fa-solid fa-play" />
                            <span>Phát</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handlePlayMovie(watchingMovie)}
                          key={modal.item._id + 0}
                        >
                          <button className="px-4 sm:px-7 lg:px-10 font-semibold text-black flex items-center space-x-2">
                            <FontAwesomeIcon icon="fa-solid fa-play" />
                            <span className="text-nowrap">Tiếp tục xem</span>
                          </button>
                        </div>
                      ))) || (
                        <button
                          className="px-4 sm:px-7 lg:px-10 font-semibold text-black text-nowrap flex flex-nowrap items-center space-x-2"
                          onClick={() => {
                            toast.warning("Tính năng đang được phát triển.");
                          }}
                        >
                          <FontAwesomeIcon icon="fa-solid fa-bell" />
                          <span>Nhắc tôi</span>
                        </button>
                      )}
                  </div>
                  <button
                    className={`group/tooltip relative p-1 sm:p-2 lg:p-3 h-full aspect-square rounded-full bg-transparent border-2 flex items-center justify-center ${isFavourite ? "border-red-500" : "border-white/40"
                      } hover:border-white hover:bg-white/10 transition-all ease-linear`}
                    onClick={handleSaveMovie}
                  >
                    <Tooltip content={isFavourite ? "Bỏ thích" : "Yêu thích"} />
                    <FontAwesomeIcon
                      icon={
                        loadingFav
                          ? "fa-solid fa-spinner"
                          : `fa-${isFavourite ? "solid" : "regular"} fa-heart`
                      }
                      className={`sm:text-lg ${isFavourite ? "text-red-500" : "text-white"
                        } ${loadingFav ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                {showTrailer && youtubeId && fadeOutImage && (
                  <button
                    onClick={handleToggleMute}
                    className="text-white border-2 cursor-pointer border-white/40 bg-black/10 p-1 sm:p-2 lg:p-3 aspect-square rounded-full flex items-center justify-center hover:border-white transition-all ease-linear"
                  >
                    <div className="sm:w-5 sm:h-5 h-3 w-3 flex items-center justify-center">
                      <FontAwesomeIcon
                        icon={
                          isMuted
                            ? "fa-solid fa-volume-xmark"
                            : "fa-solid fa-volume-high"
                        }
                        className="text-xs sm:text-lg"
                        size="xs"
                      />
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col px-[5%] pb-[5%] pt-2 space-y-4">
            <div className="flex items-start space-y-3 sm:space-y-0 gap-2 flex-col sm:flex-row">
              <div className="flex flex-col gap-2 justify-end w-full h-fit sm:hidden">
                {watchingMovie !== null && (
                  <div className="flex flex-col gap-1 w-full">
                    <span className="text-white/80 text-xs sm:text-sm whitespace-nowrap text-nowrap font-medium">
                      Tập {watchingMovie.episodeName}
                    </span>
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-[3px] bg-[#5b5b5b] w-full">
                        <div
                          className="h-full bg-[#d80f16] transition-all duration-300"
                          style={{ width: `${watchingMovie.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-white/80 text-xs sm:text-sm whitespace-nowrap text-nowrap font-medium">
                        {formatSecondsToMinutes(watchingMovie.currentTime || 0)}
                        /{formatSecondsToMinutes(watchingMovie.duration || 0)}ph
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex sm:space-x-2 space-x-1 ">
                  <div className="py-2 sm:py-3 px-4 sm:px-7 lg:px-10 w-1/2 rounded bg-white hover:bg-white/80 flex flex-nowrap items-center justify-center transition-all ease-linear cursor-pointer">
                    {(modal.item.episodes[0].server_data[0].link_embed != "" &&
                      (watchingMovie === null ? (
                        <div
                          onClick={() =>
                            navigate(
                              `/xem-phim/${modal.item.slug}?svr=${0}&ep=${0}`
                            )
                          }
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                          key={modal.item._id + 0}
                        >
                          <button className="px-2 font-semibold text-black flex items-center space-x-2">
                            <FontAwesomeIcon icon="fa-solid fa-play" />
                            <span>Phát</span>
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => handlePlayMovie(watchingMovie)}
                          key={modal.item._id + 0}
                          className="cursor-pointer w-full h-full flex items-center justify-center"
                        >
                          <button className="px-2 font-semibold text-black flex items-center space-x-2">
                            <FontAwesomeIcon icon="fa-solid fa-play" />
                            <span className="text-nowrap">Xem tiếp</span>
                          </button>
                        </div>
                      ))) || (
                        <button
                          className="font-semibold text-black text-nowrap flex flex-nowrap items-center space-x-2 w-full h-full justify-center"
                          onClick={() => {
                            toast.warning("Tính năng đang được phát triển.");
                          }}
                        >
                          <FontAwesomeIcon icon="fa-solid fa-bell" />
                          <span>Nhắc tôi</span>
                        </button>
                      )}
                  </div>
                  <div
                    className={`h-full relative rounded-md  backdrop-blur-sm w-1/2 lg:w-auto flex items-center justify-center ${isFavourite
                      ? "bg-red-500/30 hover:bg-red-500/20"
                      : "bg-white/30 hover:bg-white/20"
                      }`}
                  >
                    <button
                      className="py-2 sm:py-3 sm:px-7 lg:px-10 text-white font-medium flex items-center justify-center space-x-2"
                      onClick={handleSaveMovie}
                    >
                      <FontAwesomeIcon
                        icon={
                          loadingFav
                            ? "fa-solid fa-spinner"
                            : `fa-${isFavourite ? "solid" : "regular"} fa-heart`
                        }
                        className={`sm:text-lg sm:w-5 sm:h-5 h-3 w-3 ${isFavourite ? "text-red-500" : "text-white"
                          } ${loadingFav ? "animate-spin" : ""}`}
                      />
                      <span
                        className={`text-nowrap ${isFavourite ? "text-red-500" : "text-white"
                          }`}
                      >
                        {isFavourite ? "Đã thích" : "Yêu thích"}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-4 w-full sm:w-[65%]">
                <div className="flex flex-col space-y-4">
                  <div className="flex items-center justify-between text-white/70 text-xs lg:text-sm">
                    <div className="flex space-x-2 items-center">
                      <span className="lowercase">{modal.item.year}</span>
                      {modal.item.time !== "? phút/tập" && (
                        <span className="lowercase">{modal.item.time}</span>
                      )}
                      <span className="px-1 bg-[#e20915] text-xs rounded font-black text-white">
                        {modal.item.quality}
                      </span>
                    </div>
                    {parseInt(modal.item.view) > 0 && (
                      <div className="flex items-center pr-2 gap-1">
                        <span className="lowercase">{modal.item.view}</span>
                        <FontAwesomeIcon icon="fa-regular fa-eye" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs lg:text-sm flex-wrap">
                    <span className="bg-white text-black font-semibold border-[1px] rounded-md py-1 px-2 text-xs lg:text-sm">
                      {modal.item.episode_current}
                    </span>
                    {modal.item.imdb?.vote_count > 0 && (
                      <a
                        className="flex items-center space-x-2 border-[1px] border-yellow-500 rounded-md py-1 px-2 bg-yellow-500/10 hover:bg-yellow-500/20 transition-all ease-linear text-xs lg:text-sm"
                        href={`https://www.imdb.com/title/${modal.item.imdb.id}`}
                        target="_blank"
                      >
                        <span className="text-yellow-500 font-medium">
                          IMDb
                        </span>
                        <span className="font-semibold">
                          {modal.item.imdb.vote_average.toFixed(1)}
                        </span>
                      </a>
                    )}
                    {modal.item.tmdb?.vote_count > 0 && (
                      <a
                        className="flex items-center space-x-2 border-[1px] border-[#01b4e4] rounded-md py-1 px-2 bg-[#01b4e4]/10 hover:bg-[#01b4e4]/20 transition-all ease-linear text-xs lg:text-sm"
                        href={`https://www.themoviedb.org/${modal.item.type == "single" ? "movie" : "tv"
                          }/${modal.item.tmdb.id}`}
                        target="_blank"
                      >
                        <span className="text-[#01b4e4] font-medium">TMDB</span>
                        <span className="font-semibold">
                          {modal.item.tmdb.vote_average.toFixed(1)}
                        </span>
                      </a>
                    )}
                  </div>
                  {topSet && topSet.has(modal.item.slug) && (
                    <div className="flex items-center gap-2 mt-2">
                      <img
                        src={Top10Icon}
                        alt="Top 10"
                        className="w-7 aspect-auto"
                      />
                      <span className="text-white text-base sm:text-xl font-bold">
                        #
                        {modal.item.type === "single" ||
                          modal.item.episode_total === "1"
                          ? [...topSet].findIndex(
                            (slug) => slug === modal.item.slug
                          ) +
                          1 +
                          " Phim lẻ "
                          : [...topSet].findIndex(
                            (slug) => slug === modal.item.slug
                          ) -
                          9 +
                          " Phim bộ "}
                        hôm nay
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="text-2xl lg:text-3xl font-bold">
                    {modal.item.name}
                  </h1>
                </div>
                <div className="relative">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: modal.item.content,
                    }}
                    className={`text-white text-pretty text-sm lg:text-base transition-all duration-300 ${isContentExpanded ? "" : "line-clamp-3"
                      }`}
                  />
                  {modal.item.content && modal.item.content.length > 200 && (
                    <button
                      onClick={() => setIsContentExpanded(!isContentExpanded)}
                      className="text-white/70 hover:text-white text-sm lg:text-base flex items-center gap-0.5 transition-colors"
                    >
                      {isContentExpanded ? (
                        <>
                          Thu gọn
                          <ChevronDown
                            size={16}
                            strokeWidth={3}
                            className="rotate-180 transition-transform"
                          />
                        </>
                      ) : (
                        <>
                          Xem thêm
                          <ChevronDown
                            size={16}
                            strokeWidth={3}
                            className="transition-transform"
                          />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div className="flex flex-col space-y-3 w-full sm:w-[35%] text-sm lg:text-base">
                {modal.item.actor[0] != "" && (
                  <div>
                    <span className="opacity-50">Diễn viên: </span>
                    {modal.item.actor.slice(0, 3).map((actor, index) => (
                      <span key={index}>
                        {actor}
                        {index !== modal.item.actor.length - 1 && (
                          <span>, </span>
                        )}
                      </span>
                    ))}
                    {modal.item.actor.length > 3 && (
                      <span
                        className="italic hover:underline cursor-pointer"
                        onClick={() => scrollToMoreInfo()}
                      >
                        thêm
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <span className="opacity-50">Quốc gia: </span>
                  {modal.item.country.map((country, index) => (
                    <>
                      <span
                        key={index}
                        className="hover:underline cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/duyet-tim/phim-moi?country=${country.slug}`
                          )
                        }
                      >
                        {country.name}
                      </span>
                      {index !== modal.item.country.length - 1 && (
                        <span>, </span>
                      )}
                    </>
                  ))}
                </div>
                <div>
                  <span className="opacity-50">Thể loại: </span>
                  {modal.item.category.slice(0, 3).map((category, index) => (
                    <>
                      <span
                        key={index}
                        className="hover:underline cursor-pointer"
                        onClick={() =>
                          navigate(
                            `/duyet-tim/phim-moi?category=${category.slug}`
                          )
                        }
                      >
                        {category.name}
                      </span>
                      {index !== modal.item.category.length - 1 && (
                        <span>, </span>
                      )}
                    </>
                  ))}
                  {modal.item.category.length > 3 && (
                    <span
                      className="italic hover:underline cursor-pointer"
                      onClick={() => scrollToMoreInfo()}
                    >
                      thêm
                    </span>
                  )}
                </div>
                <div>
                  <span className="opacity-50">Ngày cập nhật: </span>
                  <span>
                    {new Date(modal.item.modified.time).toLocaleDateString(
                      "vi-VN"
                    )}
                  </span>
                </div>
              </div>
            </div>
            <div>
              {modal.item.type != "single" &&
                modal.item.episodes[server].server_data[0].link_embed !=
                "" && (
                  <div className="flex flex-col space-y-5 pt-6">
                    <h2 className="text-xl lg:text-2xl font-bold">
                      Danh sách tập
                    </h2>
                    <div className="flex gap-4 items-center">
                      <span className="text-base lg:text-lg font-bold border-r-[0.5px] border-white/50 pr-4 flex items-center gap-1">
                        <Server size={16} strokeWidth={3} />
                        Server
                      </span>
                      {modal.item.episodes.map((item, index) => (
                        <div
                          key={index}
                          className={`${server == index
                            ? " text-black bg-white border-[1px] border-white"
                            : "text-white/70 hover:text-white hover:bg-white/10 border-[1px] border-white/70"
                            } cursor-pointer px-2 py-1 rounded-md transition-all ease-linear flex items-center gap-2 text-xs lg:text-base `}
                          onClick={() => setServer(index)}
                        >
                          <Captions size={16} />
                          <span>{item.server_name.split(" #")[0]}</span>
                        </div>
                      ))}
                    </div>
                    {modal.item.episodes[server].server_data.length > 100 && (
                      <div className="flex gap-3 flex-wrap">
                        {Array.from({
                          length: Math.ceil(
                            modal.item.episodes[server].server_data.length / 100
                          ),
                        }).map((item, index) => (
                          <button
                            className={`text-xs rounded py-1.5 px-3 ${episodesRange == index * 100
                              ? "bg-white text-black border-white"
                              : "bg-white/[15%] hover:bg-white/10 hover:text-white hover:border-white text-white/70"
                              } transition-all ease-linear duration-300`}
                            key={index}
                            onClick={() => setEpisodesRange(index * 100)}
                          >
                            Tập{" "}
                            {
                              modal.item.episodes[server].server_data[
                                index * 100
                              ].name
                            }{" "}
                            -{" "}
                            {modal.item.episodes[server].server_data?.[
                              index * 100 + 99
                            ]?.name ||
                              modal.item.episodes[server].server_data[
                                modal.item.episodes[server].server_data.length -
                                1
                              ].name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:grid-cols-5 lg:grid-cols-6">
                      {modal.item.episodes[server].server_data
                        .slice(episodesRange, episodesRange + 100)
                        .map((item, index) => (
                          <div
                            onClick={() =>
                              navigate(
                                `/xem-phim/${modal.item.slug}?svr=${server}&ep=${index}`
                              )
                            }
                            className={`relative rounded bg-[#242424] group hover:bg-opacity-70 cursor-pointer 
                      `}
                            key={modal.item._id + index}
                          >
                            <button className="py-2 transition-all ease-linear text-xs gap-2 flex items-center justify-center text-white/70 group-hover:text-white text-center w-full rounded">
                              <FontAwesomeIcon
                                icon="fa-solid fa-play"
                                className="text-xs"
                              />
                              <span className="text-xs lg:text-base">
                                {" "}
                                Tập {item.name}
                              </span>
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
            <Recommend
              type={modal.breadCrumb[0].slug.split("/danh-sach/")[1]}
              country={modal.item.country.map((country) => country.slug).join(",")}
              category={modal.item.category.map((category) => category.slug).join(",")}
              slug={modal.item.slug}
            />
            <div className="flex flex-col gap-2" id={"more-info"}>
              <h3 className="text-xl lg:text-2xl">
                Giới thiệu về <b>{modal.item.origin_name}</b>
              </h3>
              {modal.item.director[0] !== "" && (
                <div className="leading-3 text-justify text-sm text-white/80">
                  <span className="opacity-50 text-sm">Đạo diễn: </span>
                  {modal.item.director.map((director, index) => (
                    <span key={index} className="text-sm text-white">
                      {director}
                      {index !== modal.item.director.length - 1 && (
                        <span>, </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {modal.item.actor.length > 0 && modal.item.actor[0] !== "" && (
                <div className="leading-3 text-justify text-sm text-white/80">
                  <span className="opacity-50 text-sm">Diễn viên: </span>
                  {modal.item.actor.map((actor, index) => (
                    <span key={index} className="text-sm text-white">
                      {actor}
                      {index !== modal.item.actor.length - 1 && <span>, </span>}
                    </span>
                  ))}
                </div>
              )}
              <div className="leading-3 text-justify text-sm text-white/80">
                <span className="opacity-50 text-sm">Thể loại: </span>
                {modal.item.category.map((category, index) => (
                  <>
                    <span
                      key={index}
                      className="text-sm text-white hover:underline cursor-pointer"
                      onClick={() =>
                        navigate(
                          `/duyet-tim/phim-moi?category=${category.slug}`
                        )
                      }
                    >
                      {category.name}
                    </span>
                    {index !== modal.item.category.length - 1 && (
                      <span>, </span>
                    )}
                  </>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
