import { Facebook, Github, Linkedin, Instagram, Mail } from "lucide-react";
const Footer = () => {
  return (
    <div className="mt-16 flex flex-col lg:items-start items-center justify-center text-center text-[#808080] text-xs lg:text-sm gap-2 pb-4 mx-[3%] lg:mx-auto lg:w-[80%] xl:w-[60%] font-thin">
      <div className="flex items-center justify-center lg:justify-start gap-2 text-white">
        <a
          href="https://github.com/anhphapap/needflex"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 rounded-full p-2"
        >
          <Github size={20} />
        </a>
        <a
          href="https://www.linkedin.com/in/anhphapap"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 rounded-full p-2"
        >
          <Linkedin size={20} />
        </a>
        <a
          href="mailto:anhphapap0@gmail.com"
          className="bg-white/5 rounded-full p-2"
          aria-label="Send email"
        >
          <Mail size={20} />
        </a>

        <a
          href="https://www.facebook.com/pap.error"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 rounded-full p-2"
        >
          <Facebook size={20} />
        </a>
        <a
          href="https://www.instagram.com/anhpha0"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/5 rounded-full p-2"
        >
          <Instagram size={20} />
        </a>
      </div>
      <p className="text-white/50 text-center lg:text-start">
        Needflex - dự án cá nhân xây dựng với mục đích học tập. Bạn có thể khám
        phá và xem phim online chất lượng cao miễn phí Vietsub, thuyết minh,
        lồng tiếng full HD. Kho phim mới khổng lồ, phim chiếu rạp, phim bộ, phim
        lẻ từ nhiều quốc gia như Việt Nam, Hàn Quốc, Trung Quốc, Thái Lan, Nhật
        Bản, Âu Mỹ… đa dạng thể loại. Dữ liệu phim được tổng hợp từ{" "}
        <a
          href="https://developer.themoviedb.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white transition-all ease-linear"
        >
          TMDB
        </a>{" "}
        và{" "}
        <a
          href="https://ophim17.cc/api-document"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white transition-all ease-linear"
        >
          OPhim
        </a>{" "}
        API.
      </p>
      <span>
        © 2024-{new Date().getFullYear()} Needflex. Powered by Anh Pha.
      </span>
    </div>
  );
};

export default Footer;
