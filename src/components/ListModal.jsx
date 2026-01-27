import React, { useEffect, useState, useRef } from "react";
import PropTypes from "prop-types";
import Modal from "react-modal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";
import Tooltip from "./Tooltip";
import { useMovieModal } from "../context/MovieModalContext";
import { useHoverPreview } from "../context/HoverPreviewContext";
import { LayoutGrid } from "lucide-react";
import { useTop } from "../context/TopContext";
import Top10Badge from "../assets/images/Top10Badge.svg";
import LazyImage from "./LazyImage";
import { listSortField } from "../utils/data";
import logo_n from "../assets/images/N_logo.png";
import { useSEOManager } from "../context/SEOManagerContext";
const customStyles = {
  content: {
    position: "absolute",
    top: "4%",
    left: "50%",
    bottom: "auto",
    transform: "translate(-50%)",
    backgroundColor: "#141414",
    boxShadow: "2px solid black",
    color: "white",
    padding: 0,
    overflow: "visible",
    border: "none",
  },
};

function ListModal({ isOpen, onClose, nameList, params, sortField = "_id" }) {
  const { openModal } = useMovieModal();
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentSortField, setCurrentSortField] = useState(sortField);
  const { onEnter, onLeave } = useHoverPreview();
  const { topSet } = useTop();
  const { pushSEO } = useSEOManager();
  const modalContainerRef = useRef(null);
  const [seoOnPage, setSeoOnPage] = useState(null);

  // SEO Management - push SEO khi modal mở
  useEffect(() => {
    if (isOpen && seoOnPage) {
      pushSEO(seoOnPage);
    }
  }, [isOpen, seoOnPage]);

  useEffect(() => {
    const fetchAPI = async () => {
      if (params && isOpen && page <= totalPage) {
        setLoading(true);
        const currentList = await axios.get(
          `${import.meta.env.VITE_API_LIST
          }${params}&page=${page}&sort_field=${currentSortField}`
        );
        setMovies((prev) => [...prev, ...currentList.data.data.items]);
        if (page == 1)
          setTotalPage(
            Math.ceil(
              currentList.data.data.params.pagination.totalItems /
              currentList.data.data.params.pagination.totalItemsPerPage
            )
          );
        if (!seoOnPage) setSeoOnPage(currentList.data.data.seoOnPage);
        setLoading(false);
      }
    };
    fetchAPI();
  }, [params, nameList, page, isOpen, currentSortField, sortField]);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setTotalPage(1);
  }, [isOpen, currentSortField]);

  const getColumns = () => {
    if (window.innerWidth >= 1280) return 5;
    if (window.innerWidth >= 1024) return 4;
    return 3;
  };
  useEffect(() => {
    const handleResize = () => getColumns();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleEnter = (item, e, index) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const absTop = rect.top + window.scrollY;
    const absLeft = rect.left + window.scrollX;
    const cols = getColumns();
    const colIndex = index % cols;
    const position =
      colIndex === 0 ? "first" : colIndex === cols - 1 ? "last" : "middle";

    onEnter({
      item,
      rect: {
        top: absTop,
        left: absLeft,
        width: rect.width,
        height: rect.height,
      },
      index,
      firstVisible: position === "first" ? index : -1,
      lastVisible: position === "last" ? index : -1,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={customStyles}
      ariaHideApp={false}
      className="w-[95%] lg:w-[80%] text-xs lg:text-lg outline-none min-h-screen"
    >
      <div
        className="flex flex-col items-center p-[3%] mb-10"
        ref={modalContainerRef}
      >
        <h1 className="font-bold text-2xl sm:text-3xl md:text-5xl mb-10 sm:mb-20 mt-8 sm:mt-12 text-center">
          {nameList}
        </h1>
        <div className="flex self-end w-fit bg-black mb-5 items-center p-1 border-white border-[1px]">
          <LayoutGrid className="w-4 h-4 mx-2" />
          <select
            id="currentSortField"
            className="pr-4 py-[1px] text-xs font-semibold bg-black cursor-pointer hover:bg-white/10 transition-all ease-linear self-end outline-none"
            value={currentSortField}
            onChange={(e) => setCurrentSortField(e.target.value)}
          >
            {listSortField.map((cate, index) => {
              return (
                <option
                  key={index + cate.value}
                  value={cate.value}
                  className="bg-black"
                >
                  {cate.name}
                </option>
              );
            })}
          </select>
        </div>
        <div className="w-full">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-4 xl:grid-cols-5 gap-x-1 gap-y-14 mt-5">
            {movies.map((item, index) => (
              <div
                className="group relative cursor-pointer h-full"
                key={`list-modal-${item._id}-${index}`}
                onMouseEnter={(e) => handleEnter(item, e, index)}
                onMouseLeave={onLeave}
                onClick={() =>
                  openModal(item.slug, item.tmdb.id, item.tmdb.type)
                }
              >
                <div className="hidden lg:block relative w-full aspect-video rounded overflow-hidden">
                  <div className="object-cover w-full h-full rounded">
                    <LazyImage
                      src={item.poster_url}
                      alt={item.name}
                      sizes="16vw"
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
                  className="block lg:hidden relative overflow-hidden rounded"
                  onClick={() =>
                    openModal(item.slug, item.tmdb.id, item.tmdb.type)
                  }
                >
                  <div className="w-full object-cover aspect-[2/3] rounded">
                    <LazyImage
                      src={item.thumb_url}
                      alt={item.name}
                      sizes="(max-width: 500px) 16vw, (max-width: 800px) 23vw, (max-width: 1024px) 18vw"
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
                      className="w-10 sm:w-12 lg:w-10 aspect-auto"
                    />
                  </div>
                )}
                {new Date().getTime() -
                  new Date(item.modified?.time).getTime() <
                  1000 * 60 * 60 * 24 * 3 && (
                    <>
                      {item.episode_current.toLowerCase().includes("hoàn tất") ||
                        item.episode_current.toLowerCase().includes("full") ? (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-white w-[80%] sm:w-auto bg-[#e50914] py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                          Mới thêm
                        </span>
                      ) : item.episode_current
                        .toLowerCase()
                        .includes("trailer") ? (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-black w-[80%] sm:w-auto bg-white py-[2px] px-2 rounded-t text-xs font-semibold text-center shadow-black/80 shadow">
                          Sắp ra mắt
                        </span>
                      ) : (
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex xl:flex-row flex-col rounded-t overflow-hidden w-[80%] sm:w-1/2 xl:w-[70%] 2xl:w-[60%]">
                          <span className=" text-white bg-[#e50914] xl:py-[2px] py-[1px] px-1 text-xs font-semibold text-center shadow-black/80 shadow w-full">
                            Tập mới
                          </span>
                          <span className="text-black bg-white xl:py-[2px] py-[1px] px-1 text-xs font-semibold text-center shadow-black/80 shadow w-full">
                            Xem ngay
                          </span>
                        </div>
                      )}
                    </>
                  )}
              </div>
            ))}
            {loading && (
              <>
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index + 99}
                    className="w-full aspect-[2/3] lg:aspect-video cursor-pointer relative animate-pulse"
                  >
                    <div className="w-full h-full bg-gray-600 rounded-md"></div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        {page < totalPage && (
          <div className="relative group/tooltip border-b-[1.6px] border-white/20 w-full mt-10">
            <button
              onClick={() => setPage(page + 1)}
              className="absolute group bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 aspect-square px-[10px] py-[1px] rounded-full bg-[#141414] border-white/60 border-[1.4px] text-white hover:border-white transition-all ease-linear"
            >
              <FontAwesomeIcon icon="fa-solid fa-chevron-down" size="xs" />
              <Tooltip content={"Xem thêm"} />
            </button>
          </div>
        )}
        <button
          className="aspect-square w-7 rounded-full absolute right-3 top-3 z-10 flex items-center justify-center"
          onClick={onClose}
        >
          <FontAwesomeIcon icon="fa-solid fa-xmark" />
        </button>
      </div>
    </Modal>
  );
}

ListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  nameList: PropTypes.string.isRequired,
  params: PropTypes.string.isRequired,
  sortField: PropTypes.string.isRequired,
};

export default ListModal;
