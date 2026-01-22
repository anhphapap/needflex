import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination } from "swiper/modules";
import { useRef, useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useHoverPreview } from "../context/HoverPreviewContext";
import { tops } from "../utils/data";
import { useInView } from "react-intersection-observer";
import LazyImage from "./LazyImage";
import { getTmdbCached } from "../utils/tmdbCache";
import { useTop } from "../context/TopContext";
import Top10Badge from "../assets/images/Top10Badge.svg";
import { useMovieModal } from "../context/MovieModalContext";
import { useListModal } from "../context/ListModalContext";
import { useWatching } from "../context/WatchingContext";
import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, CircleX, Info, X, Play } from "lucide-react";
import logo_n from "../assets/images/N_logo.png";
export default function Carousel({
  nameList,
  typeList = "list",
  type_slug = "phim-moi-cap-nhat",
  sort_field = "_id",
  country = "",
  category = "",
  year = "",
  size = 16,
  prefetchMovies = [],
}) {
  const {
    watchingPage,
    loadWatchingPage,
    hasMore,
    loadingPage,
    toggleWatching,
  } = useWatching();
  const [movies, setMovies] = useState(prefetchMovies);
  const [firstVisible, setFirstVisible] = useState(0);
  const [lastVisible, setLastVisible] = useState(0);
  const swiperRef = useRef(null);
  const containerRef = useRef(null);
  const paginationRef = useRef(null);
  const prevRef = useRef(null);
  const nextRef = useRef(null);
  const [swiperHeight, setSwiperHeight] = useState(0);
  const [canSlidePrev, setCanSlidePrev] = useState(false);
  const [canSlideNext, setCanSlideNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreMovie, setHasMoreMovie] = useState(true);
  const [isAppending, setIsAppending] = useState(false);
  const { onEnter, onLeave } = useHoverPreview();
  const { topSet } = useTop();
  const { openModal } = useMovieModal();
  const { openList } = useListModal();
  const { user } = UserAuth();
  const fetchedRef = useRef(false);
  const navigate = useNavigate();
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0,
    rootMargin: "500px 0px",
  });

  useEffect(() => {
    if (!swiperRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setSwiperHeight(entry.contentRect.height);
      }
    });

    observer.observe(swiperRef.current);

    return () => observer.disconnect();
  }, []);

  const fetchMoviesChunk = async (pageNum) => {
    if (isAppending || !hasMoreMovie || typeList === "top") return;
    if (pageNum === 1) setLoading(true);
    setIsAppending(true);

    try {
      const res = await axios.get(
        `${
          import.meta.env.VITE_API_LIST
        }${type_slug}?sort_field=${sort_field}&category=${category}&country=${country}&year=${year}&page=${pageNum}&limit=8`
      );
      const items = res.data.data.items || [];

      setMovies((prev) => [...prev, ...items]);

      if (pageNum >= 3) setHasMoreMovie(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAppending(false);
      setLoading(false);
    }
  };

  const updateNavState = (swiper) => {
    setCanSlidePrev(!swiper.isBeginning);
    setCanSlideNext(!swiper.isEnd);
  };

  const fetchMovies = async () => {
    if (typeList === "top") {
      setLoading(true);
      let mounted = true;
      (async () => {
        const data = await getTmdbCached(
          type_slug === "phim-bo" ? "tv" : "movie",
          "day"
        );
        if (mounted) {
          setMovies(data);
          setLoading(false);
        }
      })();
      return () => {
        mounted = false;
      };
    } else if (typeList === "list") {
      fetchMoviesChunk(1);
    } else {
      loadWatchingPage(8);
    }
  };

  useEffect(() => {
    if (prefetchMovies.length > 0 || movies.length > 0) return;
    if (!inView || fetchedRef.current || typeList === "watching") return;
    fetchedRef.current = true;
    fetchMovies();
  }, [type_slug, inView, prefetchMovies]);

  useEffect(() => {
    if (typeList === "watching" && inView) {
      fetchedRef.current = true;
      loadWatchingPage(8);
    }
  }, [typeList, inView, loadWatchingPage]);

  useEffect(() => {
    if (typeList === "watching") {
      fetchedRef.current = true;
      loadWatchingPage(8);
    }
  }, [typeList, loadWatchingPage]);

  useEffect(() => {
    if (page > 1) fetchMoviesChunk(page);
  }, [page]);

  const handlePlayMovie = (movie) => {
    // Chỉ lưu resume data nếu có currentTime > 0
    if (movie.currentTime && movie.currentTime > 0) {
      const resumeData = {
        slug: movie.slug,
        currentTime: movie.currentTime,
        duration: movie.duration || 0,
        progress: movie.progress || 0,
        timestamp: Date.now(),
      };
      localStorage.setItem("resumeVideo", JSON.stringify(resumeData));
    } else {
      // Clear resume data nếu không có currentTime
      localStorage.removeItem("resumeVideo");
    }

    // Navigate trực tiếp - VideoPlayer sẽ xử lý fullscreen
    navigate(`/xem-phim/${movie.slug}?svr=${movie.svr}&ep=${movie.episode}`);
  };

  const handleEnter = (item, e, index, isWatching = false) => {
    const rect = e.currentTarget.getBoundingClientRect();

    onEnter({
      item,
      rect: {
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height,
      },
      index,
      firstVisible,
      lastVisible,
      typeList,
      isWatching,
    });
  };

  const handleRemoveWatching = (e, item) => {
    e.stopPropagation();
    toggleWatching(item);
  };

  if (loading || loadingPage) {
    return (
      <div className="px-[3%] relative animate-pulse my-10">
        <h2 className="font-bold mb-3 rounded-[.2vw] h-5 bg-neutral-900 w-fit text-transparent">
          {" "}
          {nameList}
        </h2>
        <div className="md:h-[150px] sm:h-[200px] h-[150px] bg-neutral-900 animate-pulse rounded-xl" />
      </div>
    );
  }
  if (typeList === "top") {
    return (
      <div
        className="my-[6vw] md:my-[3vw] relative w-[94%] mx-[3%] group/carousel"
        ref={(node) => {
          containerRef.current = node;
          ref(node);
        }}
      >
        <div className="flex justify-between items-center w-full mb-3">
          <h2 className="text-white font-medium">{nameList}</h2>
          <div
            ref={paginationRef}
            className="ml-auto hidden md:flex justify-center gap-[1px]"
          />
        </div>

        <Swiper
          key={`top-${type_slug}`}
          modules={[Pagination, Navigation]}
          pagination={{
            el: paginationRef.current,
            clickable: true,
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onResize={(swiper) => {
            setSwiperHeight(swiper.el.clientHeight);
            setFirstVisible(swiper.activeIndex);
            setLastVisible(
              swiper.activeIndex + swiper.params.slidesPerView - 1
            );
          }}
          onInit={(swiper) => {
            swiper.params.pagination.el = paginationRef.current;
            swiper.pagination.init();
            swiper.pagination.render();
            swiper.pagination.update();
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
            setSwiperHeight(swiper.el.clientHeight);
            setCanSlidePrev(!swiper.isBeginning);
            setCanSlideNext(!swiper.isEnd);
          }}
          onSlideChange={(swiper) => {
            setFirstVisible(swiper.activeIndex);
            setLastVisible(
              swiper.activeIndex + swiper.params.slidesPerView - 1
            );
            setCanSlidePrev(!swiper.isBeginning);
            setCanSlideNext(!swiper.isEnd);
          }}
          breakpoints={{
            1400: { slidesPerView: 6, slidesPerGroup: 6 },
            1100: { slidesPerView: 5, slidesPerGroup: 5 },
            768: { slidesPerView: 4, slidesPerGroup: 4 },
            500: { slidesPerView: 3, slidesPerGroup: 3 },
            0: { slidesPerView: 2, slidesPerGroup: 2 },
          }}
          speed={500}
          loop={movies.length >= 12}
          loopAdditionalSlides={movies.length >= 12 ? 6 : 0}
          className="w-full"
          ref={swiperRef}
        >
          {movies.map((item, index) => (
            <SwiperSlide
              key={`${type_slug}-${item._id}-${index}-${nameList}`}
              data-index={index}
              className="!overflow-visible px-[.4vw] md:px-[.2vw]"
            >
              <div
                className="group relative cursor-pointer h-full flex items-end md:items-center"
                onMouseEnter={(e) => handleEnter(item, e, index)}
                onMouseLeave={onLeave}
                onClick={() =>
                  openModal(item.slug, item.tmdb?.id, item.tmdb?.type)
                }
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: tops[index],
                  }}
                  className="w-[30%] md:w-[50%] aspect-[2/3] flex items-end md:items-center"
                />
                <div className="relative w-[70%] md:w-[50%] md:rounded-[.2vw] rounded-[.4vw] overflow-hidden">
                  <div className="object-cover w-full aspect-[2/3] object-center">
                    <LazyImage
                      src={`${item.thumb_url}`}
                      alt={item.name}
                      sizes="(max-width: 500px) 15vw, (max-width: 768px) 21vw,(max-width: 1100px) 12vw, (max-width: 1400px) 10vw, 8vw"
                      quality={65}
                    />
                  </div>
                  {item.sub_docquyen && (
                    <img
                      loading="lazy"
                      src={logo_n}
                      alt="Needflex"
                      className="absolute top-[6px] left-[6px] w-3"
                    ></img>
                  )}
                  {new Date().getTime() -
                    new Date(item.modified?.time).getTime() <
                    1000 * 60 * 60 * 24 * 3 && (
                    <>
                      {item.episode_current
                        .toLowerCase()
                        .includes("hoàn tất") ||
                      item.episode_current.toLowerCase().includes("full") ? (
                        <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-auto bg-[#e50914] py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                          Mới thêm
                        </span>
                      ) : item.episode_current
                          .toLowerCase()
                          .includes("trailer") ? (
                        <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-black w-auto bg-white py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                          Sắp ra mắt
                        </span>
                      ) : (
                        <div className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col rounded-t overflow-hidden w-auto">
                          <span className="text-nowrap text-white bg-[#e50914] xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                            Tập mới
                          </span>
                          <span className="text-nowrap text-black bg-white py-[2px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                            Xem ngay
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <button
          ref={prevRef}
          style={{ height: swiperHeight + 1 || "100%" }}
          className={`group/left absolute -left-[3.19%] -bottom-[0.5px] z-20 bg-black/50 group-hover/carousel:bg-black/80 text-transparent group-hover/carousel:text-white w-[3%] flex items-center justify-center rounded-e-sm transition-all ease-in-out duration-100 cursor-pointer ${
            canSlidePrev ? "visible" : "invisible"
          }`}
          disabled={!canSlidePrev}
        >
          <ChevronLeft
            className=" sm:size-8 size-6 group-hover/left:scale-[1.35] transition-all ease-in-out duration-200"
            strokeWidth={2}
          />
        </button>
        <button
          ref={nextRef}
          style={{ height: swiperHeight + 1 || "100%" }}
          className={`group/right absolute -right-[3.19%] -bottom-[0.5px] z-20 bg-black/50 group-hover/carousel:bg-black/80 text-transparent group-hover/carousel:text-white w-[3%] flex items-center justify-center rounded-s-sm transition-all ease-in-out duration-100 cursor-pointer ${
            canSlideNext ? "visible" : "invisible"
          }`}
          disabled={!canSlideNext}
        >
          <ChevronRight
            className=" sm:size-8 size-6 group-hover/right:scale-[1.35] transition-all ease-in-out duration-200"
            strokeWidth={2}
          />
        </button>
      </div>
    );
  }
  if (typeList === "list") {
    return (
      <div
        className="my-[6vw] md:my-[3vw] relative w-[94%] mx-[3%] group/carousel"
        ref={(node) => {
          containerRef.current = node;
          ref(node);
        }}
      >
        <div className="flex justify-between items-center w-full mb-3">
          <div
            className="group cursor-pointer font-medium flex justify-between items-center md:inline-block gap-2 w-full md:w-auto"
            onClick={() =>
              openList({
                params: `${type_slug}?category=${category}&country=${country}&year=${year}`,
                nameList,
                sortField: sort_field,
              })
            }
          >
            <span className="text-white transition-all ease-in-out duration-500">
              {nameList}
            </span>
            <span className="md:opacity-0 text-xs group-hover:opacity-100 group-hover:pl-2 transition-all ease-in-out duration-500 text-white/80 group-hover:text-white">
              Xem tất cả{" "}
              <FontAwesomeIcon icon="fa-solid fa-angles-right" size="xs" />
            </span>
          </div>
          <div
            ref={paginationRef}
            className="ml-auto hidden md:flex justify-center gap-[1px]"
          />
        </div>

        <Swiper
          modules={[Pagination, Navigation]}
          key={`${type_slug}-${category}-${country}-${year}`}
          pagination={{
            el: paginationRef.current,
            clickable: true,
          }}
          navigation={{
            prevEl: prevRef.current,
            nextEl: nextRef.current,
          }}
          onResize={(swiper) => {
            setSwiperHeight(swiper.el.clientHeight);
            updateNavState(swiper);
          }}
          onInit={(swiper) => {
            swiper.params.navigation.prevEl = prevRef.current;
            swiper.params.navigation.nextEl = nextRef.current;
            swiper.navigation.init();
            swiper.navigation.update();
            swiper.params.pagination.el = paginationRef.current;
            swiper.pagination.init();
            swiper.pagination.render();
            swiper.pagination.update();
            setLastVisible(swiper.params.slidesPerView - 1);
            setSwiperHeight(swiper.el.clientHeight);
            setCanSlidePrev(!swiper.isBeginning);
            setCanSlideNext(!swiper.isEnd);
          }}
          onSlideChange={(swiper) => {
            const endIndex =
              swiper.activeIndex + swiper.params.slidesPerView - 1;
            setFirstVisible(swiper.activeIndex);
            setLastVisible(endIndex);
            updateNavState(swiper);

            if (
              hasMoreMovie &&
              !isAppending &&
              endIndex >= movies.length - swiper.params.slidesPerView * 1.5
            ) {
              setPage((prev) => prev + 1);
              // fetchMoviesChunk(nextPage).then(() => {
              //   swiper.update();
              //   setTimeout(() => updateNavState(swiper), 50);
              // });
            }
          }}
          onUpdate={(swiper) => updateNavState(swiper)}
          breakpoints={{
            1400: { slidesPerView: 6, slidesPerGroup: 6 },
            1100: { slidesPerView: 5, slidesPerGroup: 5 },
            500: { slidesPerView: 4, slidesPerGroup: 4 },
            0: { slidesPerView: 3, slidesPerGroup: 3 },
          }}
          speed={500}
          loop={movies.length >= 12}
          loopAdditionalSlides={movies.length >= 12 ? 6 : 0}
          className="w-full"
          ref={swiperRef}
        >
          <>
            {movies.map((item, index) => (
              <SwiperSlide
                key={`${type_slug}-${item._id}-${index}-${nameList}`}
                data-index={index}
                className="!overflow-visible px-[.4vw] md:px-[.2vw]"
              >
                <div
                  className="group relative cursor-pointer h-full"
                  onMouseEnter={(e) => handleEnter(item, e, index)}
                  onMouseLeave={onLeave}
                  onClick={() =>
                    openModal(item.slug, item.tmdb?.id, item.tmdb?.type)
                  }
                >
                  <div className="hidden md:block relative w-full aspect-video rounded-[.2vw]  overflow-hidden">
                    <div className="object-cover w-full h-full rounded-[.2vw]">
                      <LazyImage
                        src={item.poster_url}
                        alt={item.name}
                        sizes="(max-width: 1100px) 22vw, (max-width: 1400px) 19vw, 16vw"
                        quality={65}
                      />
                    </div>

                    {item.sub_docquyen && (
                      <img
                        loading="lazy"
                        src={logo_n}
                        alt="Needflex"
                        className="absolute top-2 left-2 w-3"
                      />
                    )}
                  </div>

                  <div
                    className="block md:hidden relative overflow-hidden rounded-[.4vw]"
                    onClick={() =>
                      openModal(item.slug, item.tmdb?.id, item.tmdb?.type)
                    }
                  >
                    <div className="w-full object-cover aspect-[2/3]">
                      <LazyImage
                        src={item.thumb_url}
                        alt={item.name}
                        sizes="(max-width: 500px) 16vw, (max-width: 768px) 23vw, 18vw"
                        quality={65}
                      />
                    </div>
                    {item.sub_docquyen && (
                      <img
                        loading="lazy"
                        src={logo_n}
                        alt="Needflex"
                        className="absolute top-2 left-2 w-3"
                      />
                    )}
                  </div>
                  {topSet?.has(item.slug) && (
                    <div className="absolute top-0 right-[2px]">
                      <img
                        src={Top10Badge}
                        alt="Top 10"
                        className="w-10 sm:w-12 md:w-10 aspect-auto"
                      />
                    </div>
                  )}
                  {new Date().getTime() -
                    new Date(item.modified?.time).getTime() <
                    1000 * 60 * 60 * 24 * 3 && (
                    <>
                      {item.episode_current
                        .toLowerCase()
                        .includes("hoàn tất") ||
                      item.episode_current.toLowerCase().includes("full") ? (
                        <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-auto bg-[#e50914] py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                          Mới thêm
                        </span>
                      ) : item.episode_current
                          .toLowerCase()
                          .includes("trailer") ? (
                        <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-black w-auto bg-white py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                          Sắp ra mắt
                        </span>
                      ) : (
                        <div className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 flex xl:flex-row flex-col rounded-t overflow-hidden w-auto">
                          <span className="text-nowrap text-white bg-[#e50914] xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                            Tập mới
                          </span>
                          <span className="text-nowrap text-black bg-white xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                            Xem ngay
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </SwiperSlide>
            ))}
            {hasMoreMovie &&
              Array.from({ length: 4 }, (_, index) => (
                <SwiperSlide
                  key={`${type_slug}-${index}-skeleton`}
                  data-index={movies.length + index}
                  className="!overflow-visible px-[.4vw] md:px-[.2vw]"
                >
                  <div className="bg-neutral-600 w-full animate-pulse aspect-[2/3] md:aspect-video rounded-[.2vw]" />
                </SwiperSlide>
              ))}
          </>
        </Swiper>
        <button
          ref={prevRef}
          style={{ height: swiperHeight + 1 || "100%" }}
          className={`group/left absolute -left-[3.19%] -bottom-[0.5px] z-20 bg-black/50 group-hover/carousel:bg-black/80 text-transparent group-hover/carousel:text-white w-[3%] flex items-center justify-center rounded-e-sm transition-all ease-in-out duration-100 cursor-pointer ${
            canSlidePrev ? "visible" : "invisible"
          }`}
          disabled={!canSlidePrev}
        >
          <ChevronLeft
            className=" sm:size-8 size-6 group-hover/left:scale-[1.35] transition-all ease-in-out duration-200"
            strokeWidth={2}
          />
        </button>
        <button
          ref={nextRef}
          style={{ height: swiperHeight + 1 || "100%" }}
          className={`group/right absolute -right-[3.19%] -bottom-[0.5px] z-20 bg-black/50 group-hover/carousel:bg-black/80 text-transparent group-hover/carousel:text-white w-[3%] flex items-center justify-center rounded-s-sm transition-all ease-in-out duration-100 cursor-pointer ${
            canSlideNext ? "visible" : "invisible"
          }`}
          disabled={!canSlideNext}
        >
          <ChevronRight
            className=" sm:size-8 size-6 group-hover/right:scale-[1.35] transition-all ease-in-out duration-200"
            strokeWidth={2}
          />
        </button>
      </div>
    );
  }
  if (!user || (!loadingPage && watchingPage.length === 0)) return null;
  return (
    <div
      className="my-[6vw] md:my-[3vw] relative w-[94%] mx-[3%] group/carousel"
      ref={(node) => {
        containerRef.current = node;
        ref(node);
      }}
    >
      <div className="flex justify-between items-center w-full mb-3">
        <div
          className="group font-medium flex justify-between items-center md:inline-block gap-2 w-full md:w-auto"
          // onClick={() =>
          //   openList({
          //     params: `${type_slug}?category=${category}&country=${country}&year=${year}`,
          //     nameList,
          //   })
          // }
        >
          <span className="text-white transition-all ease-in-out duration-500">
            {nameList} {user.displayName}
          </span>
          {/* <span className="md:opacity-0 text-xs group-hover:opacity-100 group-hover:pl-2 transition-all ease-in-out duration-500 text-white/80 group-hover:text-white">
            Xem tất cả{" "}
            <FontAwesomeIcon icon="fa-solid fa-angles-right" size="xs" />
          </span> */}
        </div>
        <div
          ref={paginationRef}
          className="ml-auto hidden md:flex justify-center gap-[1px]"
        />
      </div>

      <Swiper
        modules={[Pagination, Navigation]}
        key={`watching-carousel`}
        pagination={{
          el: paginationRef.current,
          clickable: true,
        }}
        navigation={{
          prevEl: prevRef.current,
          nextEl: nextRef.current,
        }}
        onResize={(swiper) => {
          setSwiperHeight(swiper.el.clientHeight);
          updateNavState(swiper);
        }}
        onInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current;
          swiper.params.navigation.nextEl = nextRef.current;
          swiper.navigation.init();
          swiper.navigation.update();
          swiper.params.pagination.el = paginationRef.current;
          swiper.pagination.init();
          swiper.pagination.render();
          swiper.pagination.update();
          setLastVisible(swiper.params.slidesPerView - 1);
          setSwiperHeight(swiper.el.clientHeight);
          setCanSlidePrev(!swiper.isBeginning);
          setCanSlideNext(!swiper.isEnd);
        }}
        onSlideChange={(swiper) => {
          const endIndex = swiper.activeIndex + swiper.params.slidesPerView - 1;
          setFirstVisible(swiper.activeIndex);
          setLastVisible(endIndex);
          updateNavState(swiper);

          if (
            hasMore &&
            !loadingPage &&
            endIndex >= watchingPage.length - swiper.params.slidesPerView * 1.5
          ) {
            console.log("Triggering load more...");
            loadWatchingPage(8);
          }
        }}
        onUpdate={(swiper) => updateNavState(swiper)}
        breakpoints={{
          1400: { slidesPerView: 6, slidesPerGroup: 6 },
          1100: { slidesPerView: 5, slidesPerGroup: 5 },
          500: { slidesPerView: 4, slidesPerGroup: 4 },
          0: { slidesPerView: 3, slidesPerGroup: 3 },
        }}
        speed={500}
        loop={watchingPage.length >= 12}
        loopAdditionalSlides={watchingPage.length >= 12 ? 6 : 0}
        className="w-full"
        ref={swiperRef}
      >
        <>
          {watchingPage.map((item, index) => (
            <SwiperSlide
              key={`watching-carousel-${item.slug}-${index}`}
              data-index={index}
              className="!overflow-visible px-[.4vw] md:px-[.2vw]"
            >
              <div
                className="group relative cursor-pointer h-full"
                onMouseEnter={(e) => handleEnter(item, e, index, true)}
                onMouseLeave={onLeave}
                onClick={() => {
                  handlePlayMovie(item);
                  onLeave();
                }}
              >
                <div className="absolute -bottom-3 left-[20%] right-[20%] h-[3px] bg-[#5b5b5b] overflow-hidden hidden md:block">
                  <div
                    className="h-full bg-[#d80f16] transition-all duration-300"
                    style={{ width: `${item.progress || 0}%` }}
                  />
                </div>
                <div className="hidden md:block relative w-full aspect-video rounded-[.2vw] overflow-hidden">
                  <div className="object-cover w-full h-full rounded-[.2vw] relative">
                    <LazyImage
                      src={item.poster_url}
                      alt={item.name}
                      sizes="(max-width: 1100px) 22vw, (max-width: 1400px) 19vw, 16vw"
                      quality={65}
                    />
                    {new Date().getTime() -
                      new Date(item.modified?.time).getTime() <
                      1000 * 60 * 60 * 24 * 3 && (
                      <>
                        {item.episode_current
                          .toLowerCase()
                          .includes("hoàn tất") ||
                        item.episode_current.toLowerCase().includes("full") ? (
                          <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-auto bg-[#e50914] py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                            Mới thêm
                          </span>
                        ) : item.episode_current
                            .toLowerCase()
                            .includes("trailer") ? (
                          <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-black w-auto bg-white py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                            Sắp ra mắt
                          </span>
                        ) : (
                          <div className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 flex xl:flex-row flex-col rounded-t overflow-hidden w-auto">
                            <span className="text-nowrap text-white bg-[#e50914] xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                              Tập mới
                            </span>
                            <span className="text-nowrap text-black bg-white xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                              Xem ngay
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {item.sub_docquyen && (
                    <img
                      loading="lazy"
                      src={logo_n}
                      alt="Needflex"
                      className="absolute top-2 left-2 w-3"
                    />
                  )}
                </div>

                <div className="block md:hidden relative overflow-hidden rounded-[.4vw]">
                  <div
                    className="w-full object-cover aspect-[2/3] relative"
                    onClick={() => {
                      handlePlayMovie(item);
                    }}
                  >
                    <LazyImage
                      src={item.thumb_url}
                      alt={item.name}
                      sizes="(max-width: 500px) 16vw, (max-width: 768px) 23vw, 18vw"
                      quality={65}
                    />
                    <div className="absolute bottom-0 left-0 w-full h-full flex items-center justify-center from-black/30 to-transparent bg-gradient-to-br">
                      <button className="group relative border-[1px] border-white/80 rounded-full p-2 sm:p-3 bg-black/50" aria-label="Phát video">
                        <Play size={36} className="text-white fill-white drop-shadow-2xl" strokeWidth={2} fill="white" />
                        <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse"></div>
                      </button>
                    </div>
                    {new Date().getTime() -
                      new Date(item.modified?.time).getTime() <
                      1000 * 60 * 60 * 24 * 3 && (
                      <>
                        {item.episode_current
                          .toLowerCase()
                          .includes("hoàn tất") ||
                        item.episode_current.toLowerCase().includes("full") ? (
                          <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-auto bg-[#e50914] py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                            Mới thêm
                          </span>
                        ) : item.episode_current
                            .toLowerCase()
                            .includes("trailer") ? (
                          <span className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 text-black w-auto bg-white py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                            Sắp ra mắt
                          </span>
                        ) : (
                          <div className="text-nowrap absolute bottom-0 left-1/2 -translate-x-1/2 flex xl:flex-row flex-col rounded-t overflow-hidden w-auto">
                            <span className="text-nowrap text-white bg-[#e50914] xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                              Tập mới
                            </span>
                            <span className="text-nowrap text-black bg-white xl:py-[2px] py-[1px] px-2 text-xs font-semibold text-center shadow-black/80 shadow">
                              Xem ngay
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 py-2 bg-[#1a1a18] rounded-b-[.4vw]">
                    <div className="h-[3px] bg-[#5b5b5b] overflow-hidden w-[90%] mx-auto rounded-full">
                      <div
                        className="h-full bg-[#d80f16] transition-all duration-300"
                        style={{ width: `${item.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between h-fit">
                      <button
                        onClick={(e) => handleRemoveWatching(e, item)}
                        className="w-1/2 flex items-center justify-center border-r border-white/70"
                      >
                        <CircleX
                          className="text-white sm:size-8 size-6"
                          strokeWidth={2}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(item.slug, item.tmdb?.id, item.tmdb?.type);
                        }}
                        className="w-1/2 flex items-center justify-center "
                      >
                        <Info
                          className="text-white sm:size-8 size-6"
                          strokeWidth={2}
                        />
                      </button>
                    </div>
                  </div>
                  <div className="absolute top-1 left-2 text-white text-xs font-medium">
                    Tập {item.episodeName}
                  </div>

                  {/* <button
                    onClick={(e) => handleRemoveWatching(e, item)}
                    className="absolute top-1 right-1 bg-black/30 backdrop-blur-[1px] rounded-[3px] p-1.5 opacity-100 transition-opacity duration-300 "
                  >
                    <X size={16} className="text-white" strokeWidth={2} />
                  </button> */}
                  {item.sub_docquyen && (
                    <img
                      loading="lazy"
                      src={logo_n}
                      className="absolute top-2 left-2 w-3"
                    />
                  )}
                </div>
                {topSet?.has(item.slug) && (
                  <div className="absolute top-0 right-[2px]">
                    <img
                      src={Top10Badge}
                      alt="Top 10"
                      className="w-10 sm:w-12 md:w-10 aspect-auto"
                    />
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
          {hasMore &&
            !loadingPage &&
            Array.from({ length: 4 }, (_, index) => (
              <SwiperSlide
                key={`watching-carousel-skeleton-${index}`}
                data-index={watchingPage.length + index}
                className="!overflow-visible px-[.4vw] md:px-[.2vw]"
              >
                <div className="bg-neutral-600 animate-pulse w-full aspect-[2/3] md:aspect-video rounded-[.2vw]" />
              </SwiperSlide>
            ))}
        </>
      </Swiper>
      <button
        ref={prevRef}
        style={{ height: swiperHeight + 1 || "100%" }}
        className={`group/left absolute -left-[3.19%] -bottom-[0.5px] z-20 bg-black/50 group-hover/carousel:bg-black/80 text-transparent group-hover/carousel:text-white w-[3%] flex items-center justify-center rounded-e-sm transition-all ease-in-out duration-100 cursor-pointer ${
          canSlidePrev ? "visible" : "invisible"
        }`}
        disabled={!canSlidePrev}
      >
        <ChevronLeft
          className=" sm:size-8 size-6 group-hover/left:scale-[1.35] transition-all ease-in-out duration-200"
          strokeWidth={2}
        />
      </button>
      <button
        ref={nextRef}
        style={{ height: swiperHeight + 1 || "100%" }}
        className={`group/right absolute -right-[3.19%] -bottom-[0.5px] z-20 bg-black/50 group-hover/carousel:bg-black/80 text-transparent group-hover/carousel:text-white w-[3%] flex items-center justify-center rounded-s-sm transition-all ease-in-out duration-100 cursor-pointer ${
          canSlideNext ? "visible" : "invisible"
        }`}
        disabled={!canSlideNext}
      >
        <ChevronRight
          className=" sm:size-8 size-6 group-hover/right:scale-[1.35] transition-all ease-in-out duration-200"
          strokeWidth={2}
        />
      </button>
    </div>
  );
}
