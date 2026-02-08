import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState, useEffect } from "react";
import Search from "./Search";
import FilterNavbar from "./FilterNavbar";
import { Link, useNavigate } from "react-router-dom";
import { UserAuth } from "../context/AuthContext";
import logo_full from "../assets/images/logo_full_240.png";
import logo_n from "../assets/images/N_logo.png";
import { useBannerCache } from "../context/BannerCacheContext";
import { useFavorites } from "../context/FavouritesProvider";
const Header = ({ filter = false, type_slug = "" }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, logOut, loading } = UserAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [onTab, setOnTab] = useState(-1);
  const [pathname, setPathname] = useState(window.location.pathname);
  const { playing } = useBannerCache();
  const { favoritesPage } = useFavorites();
  const navigation = [
    { name: "Trang chủ", href: "/trang-chu" },
    { name: "Phim bộ", href: "/phim-bo" },
    { name: "Phim lẻ", href: "/phim-le" },
    { name: "Duyệt tìm", href: "/duyet-tim/phim-moi" },
    { name: "Donate", href: "/ung-ho" },
    { name: "Tài khoản", href: "/tai-khoan" },
    { name: "Yêu thích", href: "/yeu-thich" },
    { name: "Đăng ký", href: "/dang-ky" },
    { name: "Đăng nhập", href: "/dang-nhap" },
  ];

  const handleLogOut = async () => {
    try {
      await logOut();
      navigate("/trang-chu");
      setShowMenu(false);
    } catch (error) {
      alert(error);
    }
  };

  useEffect(() => {
    setPathname(window.location.pathname);
  }, [window.location.pathname]);

  useEffect(() => {
    navigation.forEach((element, index) => {
      if (element.href.split("/")[1] === pathname.split("/")[1])
        setOnTab(index);
    });
  }, [filter, type_slug, pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 0) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (loading) return <></>;

  return (
    <div
      className={`fixed flex flex-col top-0 left-0 right-0 z-50 transition-all duration-500 ease-linear text-sm`}
    >
      <div
        className={`block md:hidden h-screen w-full absolute top-0 left-0 bg-black/50 z-0 ${showMenu ? "block" : "hidden"
          }`}
        onClick={() => setShowMenu(false)}
      ></div>
      <div
        className={`flex items-center justify-start z-10 py-2 px-[3%] transition-all duration-500 ease-linear text-white sm:py-3 md:py-4 ${filter || pathname.startsWith("/yeu-thich")
          ? "bg-gradient-to-b from-[#080808] to-[#141414]"
          : isScrolled || showMenu || playing
            ? "bg-[#141414]"
            : "bg-gradient-to-b from-black/70 to-transparent"
          }`}
        id="header"
      >
        <div className="flex flex-row md:flex items-center justify-between w-full">
          {/* <div className="md:hidden flex items-center gap-1"> */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              className="relative inline-flex items-center aspect-square w-8 h-8 justify-center text-white p-2 rounded hover:bg-white/10 text-base"
              onClick={() => setShowMenu(!showMenu)}
            >
              {showMenu ? (
                <FontAwesomeIcon icon="fa-solid fa-xmark" color="red" />
              ) : (
                <FontAwesomeIcon icon="fa-solid fa-bars" />
              )}
            </button>
          </div>
          <div className="md:hidden h-8 flex justify-center items-center p-1">
            <Link to="/trang-chu" className="cursor-pointer flex items-center h-full">
              <img
                src={logo_full}
                className="object-contain h-full w-auto max-w-full"
                alt="Needflex"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              />
            </Link>
          </div>
          {/* </div> */}
          <div className="hidden md:flex items-center justify-start flex-shink-0">
            <Link
              to="/trang-chu"
              className="w-[20%] mt-1 mr-4 flex-shrink-0 cursor-pointer flex items-center"
            >
              <img
                src={logo_full}
                className="object-contain h-full w-auto max-w-full"
                alt="Needflex"
                style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
              />
            </Link>
            <nav className=" space-x-4 flex flex-shrink-0">
              {navigation.slice(0, 5).map((item, index) => (
                <Link
                  to={item.href}
                  onClick={() => setOnTab(index)}
                  className={` ${onTab === index ||
                    (item.href.split("/")[1] === pathname.split("/")[1] &&
                      index === 0)
                    ? "font-medium text-white"
                    : "text-white/80 hover:opacity-70 cursor-pointer"
                    }`}
                  key={item.href}
                >
                  {item.name}
                </Link>
              ))}
              {user?.email && (
                <>
                  <Link
                    to="/yeu-thich"
                    onClick={() => setOnTab(6)}
                    className={` ${"/yeu-thich" === pathname && onTab === 6
                      ? "font-medium text-white"
                      : "text-white/80 hover:opacity-70 cursor-pointer"
                      }`}
                  >
                    Yêu thích
                  </Link>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center">
            <Search />
            {/* <div className="hidden md:block">
              <Search />
            </div> */}
            <div className="hidden md:block">
              {user?.email ? (
                <div className="relative flex flex-shrink-0 items-center space-x-2 cursor-pointer group">
                  <img
                    src={user.photoURL}
                    className="aspect-square h-[30px] w-[30px] rounded-sm object-cover inline-block"
                  ></img>
                  <FontAwesomeIcon
                    icon="fa-solid fa-caret-down"
                    color="white"
                    className="group-hover:rotate-180 ease-in-out duration-500"
                  />
                  <div className="hidden absolute bottom-0 translate-y-full right-0 group-hover:block bg-black/80 w-32 border-[1px] border-white/10 z-20">
                    <ul className="p-3">
                      <li className="hover:underline space-x-3 mb-3">
                        <Link
                          to="/tai-khoan"
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon="fa-solid fa-user" />
                          <span className="text-nowrap"> Tài khoản</span>
                        </Link>
                      </li>
                      <li className="hover:underline space-x-3 mb-3">
                        <Link
                          to="/yeu-thich"
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon="fa-solid fa-heart" />
                          <span> Yêu thích</span>
                        </Link>
                      </li>
                      <li className="hover:underline space-x-3">
                        <Link
                          to="/ung-ho"
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <FontAwesomeIcon icon="fa-solid fa-circle-dollar-to-slot" />
                          <span> Donate</span>
                        </Link>
                      </li>
                    </ul>
                    <div
                      className="border-t-[1px] border-white/30 py-2 text-center hover:underline cursor-pointer"
                      onClick={handleLogOut}
                    >
                      Đăng xuất
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/dang-nhap"
                  className="bg-[#e50914] px-2 md:py-1 rounded hover:bg-[#e50914]/80 transition-colors ease-linear font-medium py-2"
                >
                  Đăng nhập
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`bg-[#141414] md:hidden border-y-[1px] border-white z-10 ${showMenu ? "block" : "hidden"
          }`}
        id="mobile-menu"
      >
        {/* <Search open={true} /> */}
        <div className="space-y-1 py-2 px-[3%]">
          {navigation.slice(0, 5).map((item, index) => (
            <Link
              to={item.href}
              onClick={() => {
                setOnTab(index);
                setShowMenu(false);
              }}
              className={` hover:bg-white/5 hover:text-white  block rounded-md px-3 py-2 cursor-pointer font-medium ${onTab === index || (item.href === pathname && index === 0)
                ? "bg-white/15 text-white"
                : "text-white/70"
                }`}
              key={item.href}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="border-t-[0.1px] px-[3%] py-2 border-white/60 text-white md:hidden space-y-1">
          {user?.email ? (
            <>
              <div className="px-3 py-2 flex space-x-3 items-center">
                <img
                  src={user.photoURL}
                  className="aspect-square h-[40px] rounded-sm object-cover inline-block"
                ></img>
                <div className="flex flex-col">
                  <span className="text-white text-base font-semibold">
                    {user.displayName}
                  </span>
                  <span className="text-white/80 text-xs">{user.email}</span>
                </div>
              </div>
              <Link
                to="/tai-khoan"
                onClick={() => setShowMenu(false)}
                className={`text-white/70 hover:bg-white/10 hover:text-white rounded-md px-3 py-2 font-medium flex items-center space-x-2 cursor-pointer ${"/tai-khoan" === pathname && onTab === 4
                  ? "bg-white/15 text-white"
                  : "text-white/70"
                  }`}
              >
                <FontAwesomeIcon icon="fa-solid fa-user" />
                <span>Tài khoản</span>
              </Link>
              <Link
                to="/yeu-thich"
                onClick={() => setShowMenu(false)}
                className={`text-white/70 hover:bg-white/10 hover:text-white rounded-md px-3 py-2 font-medium flex items-center space-x-2 cursor-pointer ${"/yeu-thich" === pathname && onTab === 5
                  ? "bg-white/15 text-white"
                  : "text-white/70"
                  }`}
              >
                <FontAwesomeIcon icon="fa-solid fa-heart" />
                <span>Yêu thích</span>
              </Link>
              <div
                className="text-white/70 hover:bg-white/10 hover:text-white rounded-md px-3 py-2 font-medium flex items-center space-x-2 cursor-pointer"
                onClick={handleLogOut}
              >
                <FontAwesomeIcon icon="fa-solid fa-right-from-bracket" />
                <span>Đăng xuất</span>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/dang-ky"
                className={`text-white/70 hover:bg-white/10 hover:text-white rounded-md px-3 py-2 font-medium flex items-center space-x-2 cursor-pointer ${"/dang-ky" === pathname && onTab === 6
                  ? "bg-white/15 text-white"
                  : "text-white/70"
                  }`}
              >
                Đăng ký
              </Link>
              <Link
                to="/dang-nhap"
                className={`text-white/70 hover:bg-white/10 hover:text-white rounded-md px-3 py-2 font-medium flex items-center space-x-2 cursor-pointer ${"/dang-nhap" === pathname && onTab === 7
                  ? "bg-white/15 text-white"
                  : "text-white/70"
                  }`}
              >
                Đăng nhập
              </Link>
            </>
          )}
        </div>
      </div>

      {filter && <FilterNavbar open={showMenu} />}
      {pathname.startsWith("/yeu-thich") && (
        <div
          className={`lg:flex-row flex-col flex lg:items-center justify-between py-3 transition-all duration-500 ease-linear text-white ${isScrolled || showMenu || playing
            ? "bg-[#141414]"
            : "bg-transparent"
            }`}
        >
          <h1 className="text-2xl lg:text-3xl text-white px-[3%]">
            {favoritesPage.length > 0
              ? "Danh sách của tôi"
              : "Danh sách của bạn hiện đang trống!"}
          </h1>
        </div>
      )}
    </div>
  );
};

export default Header;
