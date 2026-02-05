import React from "react";
import VideoPlayer from "../components/VideoPlayer";
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useCinema } from "../context/CinemaContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SEO from "../components/SEO";

const FullWatchPage = () => {
  const { movieSlug } = useParams();
  const queryParams = new URLSearchParams(window.location.search);
  const ep = queryParams.get("ep") || 0;
  const svr = queryParams.get("svr") || 0;
  const [loading, setLoading] = useState(false);
  const [movie, setMovie] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const autoEpisodes = true;
  const shouldAutoPlayRef = useRef(false);
  const prevEpRef = useRef(ep);
  const prevSvrRef = useRef(svr);
  const navigate = useNavigate();
  const { setCinema } = useCinema();

  const handleNavigateToNextEpisode = () => {
    // Set flag TRƯỚC khi navigate để VideoPlayer nhận được
    shouldAutoPlayRef.current = true;
    navigate(`/xem-phim/${movieSlug}?svr=${svr}&ep=${parseInt(ep) + 1}`);
  };

  useEffect(() => {
    const savedResumeData = localStorage.getItem("resumeVideo");
    if (savedResumeData) {
      try {
        const parsed = JSON.parse(savedResumeData);
        // Chỉ sử dụng nếu cùng movie và trong vòng 24h
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        if (parsed.slug === movieSlug && isRecent) {
          setResumeData(parsed);
        }
        // Clear sau khi sử dụng
        localStorage.removeItem("resumeVideo");
      } catch (error) {
        console.error("Error parsing resume data:", error);
        localStorage.removeItem("resumeVideo");
      }
    }
  }, [movieSlug]);

  // Reset autoplay flag khi ep thay đổi và sau khi video đã play
  useEffect(() => {
    // Chỉ reset khi đang trong chế độ autoplay
    if (shouldAutoPlayRef.current) {
      // Reset sau khi video đã load và play (3s là đủ)
      const timer = setTimeout(() => {
        shouldAutoPlayRef.current = false;

      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [ep, svr]);

  // Detect khi ep/svr thay đổi (user click Episodes) → set shouldAutoPlay
  useEffect(() => {
    // Skip lần đầu mount
    if (prevEpRef.current === ep && prevSvrRef.current === svr) {
      return;
    }

    // Nếu ep hoặc svr thay đổi → user đã click chuyển tập
    if (prevEpRef.current !== ep || prevSvrRef.current !== svr) {

      shouldAutoPlayRef.current = true;

      // Update refs
      prevEpRef.current = ep;
      prevSvrRef.current = svr;
    }
  }, [ep, svr]);

  // Clear resume data sau khi video đã seek xong
  useEffect(() => {
    if (resumeData) {
      // Clear sau 3 giây để đảm bảo video đã seek và play xong
      const timer = setTimeout(() => {
        setResumeData(null);
        localStorage.removeItem("resumeVideo");
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [resumeData]);

  useEffect(() => {
    setCinema(true);
    return () => {
      setCinema(false);
    };
  }, []);
  useEffect(() => {
    const fetchMovie = async () => {
      setLoading(true);
      try {
        const movieRes = await axios.get(
          `${import.meta.env.VITE_API_DETAILS}${movieSlug}`
        );

        setMovie(movieRes.data.data || []);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [movieSlug]);
  if (loading || !movie)
    return (
      <div className="w-screen h-screen flex items-center justify-center">
        <FontAwesomeIcon
          icon="fa-solid fa-spinner"
          size="2xl"
          className="animate-spin text-white"
        />
      </div>
    );
  if (
    !movie.item.episodes ||
    movie.item.episodes.length === 0 ||
    movie.item.episodes[0].server_data[0].link_m3u8 === ""
  ) {
    return (
      <div className="min-h-screen text-white px-[3%] mt-16">
        <div className="flex items-center gap-4 my-6 pt-2 px-2">
          <button
            className="aspect-square w-8 p-1 rounded-full flex items-center justify-center text-white hover:text-white/80 transition-all ease-linear border border-white/40 hover:border-white"
            onClick={() => navigate("/trang-chu")}
          >
            <FontAwesomeIcon icon="fa-solid fa-chevron-left" size="xs" />
          </button>
          <h1 className="sm:text-2xl text-xl font-bold">{movie.item.name}</h1>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
          <div className="w-24 sm:w-32 sm:h-32 h-24 rounded-full bg-red-500/20 flex items-center justify-center">
            <FontAwesomeIcon
              icon="fa-solid fa-film"
              size="3x"
              className="text-red-500"
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Phim chưa có sẵn</h2>
            <p className="text-white/70 max-w-md text-lg">
              {movie.item.status === "trailer"
                ? "Phim này hiện chỉ có trailer. Vui lòng quay lại sau khi phim được phát hành."
                : "Phim này chưa có tập nào để xem. Vui lòng quay lại sau."}
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() =>
                navigate(
                  `/trang-chu?movie=${movie.item.slug}&tmdb_id=${movie.item.tmdb.id}&tmdb_type=${movie.item.tmdb.type}`
                )
              }
              className="sm:px-8 px-3 sm:py-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Chi tiết phim
            </button>
            <button
              onClick={() => navigate("/trang-chu")}
              className="sm:px-8 px-3 sm:py-3 py-2 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Quay về Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Kiểm tra server và episode có tồn tại không
  if (
    !movie.item.episodes[svr] ||
    !movie.item.episodes[svr].server_data ||
    !movie.item.episodes[svr].server_data[ep]
  ) {
    return (
      <div className="min-h-screen text-white px-[3%] mt-16">
        <div className="flex items-center gap-4 my-6 pt-2 px-2">
          <button
            className="aspect-square w-8 p-1 rounded-full flex items-center justify-center text-white hover:text-white/80 transition-all ease-linear border border-white/40 hover:border-white"
            onClick={() => navigate("/trang-chu")}
          >
            <FontAwesomeIcon icon="fa-solid fa-chevron-left" size="xs" />
          </button>
          <h1 className="text-2xl font-bold">{movie.item.name}</h1>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-[3%]">
          <div className="sm:w-32 sm:h-32 w-24 h-24 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <FontAwesomeIcon
              icon="fa-solid fa-exclamation-triangle"
              size="3x"
              className="text-yellow-500"
            />
          </div>
          <div className="space-y-3">
            <h2 className="text-3xl font-bold">Tập phim không tồn tại</h2>
            <p className="text-white/70 max-w-md text-lg">
              Tập phim bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.
            </p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() =>
                navigate(`/xem-phim/${movie.item.slug}?svr=0&ep=0`)
              }
              className="sm:px-8 px-3 sm:py-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Xem tập đầu tiên
            </button>
            <button
              onClick={() => navigate("/trang-chu")}
              className="sm:px-8 px-3 sm:py-3 py-2 bg-white/10 hover:bg-white/20 border-2 border-white/20 rounded-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Quay về Trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  const watchPageSEO = movie?.seoOnPage
    ? {
      ...movie.seoOnPage,
      titleHead: `Xem phim ${movie.item.name} - Tập ${movie.item.episodes[svr].server_data[ep].name}`,
      descriptionHead: `Xem phim ${movie.item.name} tập ${movie.item.episodes[svr].server_data[ep].name
        } ${movie.item.quality} Vietsub. ${movie.seoOnPage.descriptionHead ||
        movie.item.content?.replace(/<[^>]*>/g, "").substring(0, 100) ||
        ""
        }`,
    }
    : null;

  return (
    <div className="flex w-full h-screen overflow-hidden">
      {watchPageSEO && (
        <SEO seoData={watchPageSEO} baseUrl={window.location.origin} />
      )}
      <VideoPlayer
        movie={movie.item}
        episode={ep}
        svr={svr}
        resumeData={resumeData}
        autoEpisodes={autoEpisodes}
        onVideoEnd={() => {
          if (
            autoEpisodes &&
            parseInt(ep) < movie.item.episodes[svr].server_data.length - 1
          ) {
            // Delay để tránh conflict với video đang kết thúc
            setTimeout(() => {
              shouldAutoPlayRef.current = true;
              navigate(
                `/xem-phim/${movie.item.slug}?svr=${svr}&ep=${parseInt(ep) + 1}`
              );
            }, 100);
          }
        }}
        onNavigateToNextEpisode={handleNavigateToNextEpisode}
        shouldAutoPlay={shouldAutoPlayRef.current}
      />
    </div>
  );
};

export default FullWatchPage;
