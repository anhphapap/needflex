import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SEO = ({
  seoData = null,
  baseUrl = window.location.origin,
  siteName = "Needflex",
  defaultImage = `${window.location.origin}/android-chrome-512x512.png`,
}) => {
  if (!seoData) return null;
  const { pathname, search } = useLocation();

  useEffect(() => {
    const path = pathname.toLowerCase();
    let title = "Needflex - Xem phim online chất lượng cao, Vietsub miễn phí";
    let desc =
      "Xem phim online chất lượng cao, tốc độ cao, phim mới nhất 2025, phim HD Vietsub miễn phí - chỉ có tại Needflex.";
    let ogType = "website";

    // 🧠 Tự sinh title & description theo trang
    if (path.includes("/phim-le")) {
      title = "Phim lẻ mới nhất 2025 | Needflex";
      desc =
        "Tổng hợp phim lẻ mới nhất 2025, phim chiếu rạp, phim hành động, tình cảm, kinh dị Vietsub miễn phí.";
    } else if (path.includes("/phim-bo")) {
      title = "Phim bộ hot nhất 2025 | Needflex";
      desc =
        "Tuyển chọn phim bộ Hàn Quốc, Trung Quốc, Âu Mỹ hot nhất 2025 - Vietsub miễn phí, xem không giới hạn.";
    } else if (path.includes("/trang-chu") || path === "/") {
      title = "Needflex - Xem phim online chất lượng cao, Vietsub miễn phí";
      desc =
        "Trang chủ Needflex - nơi bạn xem phim online chất lượng cao, phim mới 2025, phim Vietsub miễn phí.";
    } else if (path.includes("/tim-kiem")) {
      const query = new URLSearchParams(search).get("q") || "";
      title = query
        ? `Kết quả tìm kiếm cho "${query}" | Needflex`
        : "Tìm kiếm phim online | Needflex";
      desc =
        query.length > 0
          ? `Kết quả tìm kiếm phim cho từ khóa "${query}". Xem phim HD Vietsub miễn phí tại Needflex.`
          : "Tìm kiếm phim online miễn phí, nhanh chóng tại Needflex.";
    } else if (path.includes("/ung-ho")) {
      title = "Ủng hộ Needflex - Góp phần duy trì trang xem phim miễn phí";
      desc =
        "Ủng hộ Needflex để giúp duy trì máy chủ và cập nhật phim nhanh hơn, không quảng cáo.";
    } else if (path.includes("/yeu-thich")) {
      title = "Phim Yêu Thích | Bộ sưu tập cá nhân | Needflex";
      desc =
        "Tổng hợp các bộ phim bạn đã lưu yêu thích tại Needflex. Xem lại hoặc tiếp tục xem bất cứ lúc nào.";
    }

    // 🧩 Merge dữ liệu từ API nếu có
    const mergedData = {
      titleHead:
        seoData?.titleHead?.includes(siteName) || !seoData?.titleHead
          ? seoData?.titleHead || title
          : `${seoData.titleHead} | ${siteName}`,
      descriptionHead: seoData?.descriptionHead || desc,
      og_type: seoData?.og_type || ogType,
      og_image: seoData?.og_image?.length ? seoData.og_image : [defaultImage],
      og_url:
        seoData?.og_url ||
        path.replace(/^\//, "") + (search ? search.replace("?", "?") : ""),
      seoSchema: seoData?.seoSchema || {},
    };

    const image = mergedData.og_image[0]?.startsWith("http")
      ? mergedData.og_image[0]
      : `${"https://img.ophim.live/uploads/"}${mergedData.og_image[0]}`;
    const url = `${baseUrl}${pathname}${search}`;

    // 🧩 Helper cập nhật meta
    const setMeta = (key, value, isProperty = false) => {
      if (!value) return;
      const attr = isProperty ? "property" : "name";
      let el = document.querySelector(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", value);
    };

    const removeOldScript = (id) => {
      const old = document.getElementById(id);
      if (old) old.remove();
    };

    // ✅ TITLE
    document.title = mergedData.titleHead;

    // ✅ BASIC META
    setMeta("description", mergedData.descriptionHead);
    setMeta(
      "keywords",
      "xem phim, phim vietsub, phim 2025, Needflex, phim online, phim HD, phim mới"
    );
    setMeta("author", siteName);
    setMeta("robots", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    setMeta("googlebot", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");
    setMeta("bingbot", "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1");

    // ✅ OPEN GRAPH
    setMeta("og:locale", "vi_VN", true);
    setMeta("og:site_name", siteName, true);
    setMeta("og:type", mergedData.og_type, true);
    setMeta("og:title", mergedData.titleHead, true);
    setMeta("og:description", mergedData.descriptionHead, true);
    setMeta("og:url", url, true);
    setMeta("og:image", image, true);
    setMeta("og:image:alt", mergedData.titleHead, true);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);

    // ✅ TWITTER
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", mergedData.titleHead);
    setMeta("twitter:description", mergedData.descriptionHead);
    setMeta("twitter:image", image);
    setMeta("twitter:image:alt", mergedData.titleHead);
    setMeta("twitter:site", "@needflex");
    setMeta("twitter:creator", "@needflex");

    // ✅ CANONICAL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    // ✅ JSON-LD SCHEMA (trang hiện tại)
    removeOldScript("json-ld-schema");
    const ophimData = mergedData.seoSchema || {};

    const schema = {
      "@context": "https://schema.org",
      "@type":
        ophimData["@type"] ||
        (mergedData.og_type === "video.movie"
          ? "Movie"
          : mergedData.og_type === "video.tv_show"
            ? "TVSeries"
            : "WebSite"),
      name: ophimData.name || mergedData.titleHead,
      description: ophimData.description || mergedData.descriptionHead,
      url: `${baseUrl}${pathname}${search}`, // ✅ Ghi đè URL thành needflex.site
      image: ophimData.image || image, // vẫn dùng ảnh từ Ophim nếu có
      dateCreated: ophimData.dateCreated,
      dateModified: ophimData.dateModified,
      datePublished: ophimData.datePublished,
      director: ophimData.director?.toLowerCase?.().includes("ophim")
        ? "Needflex"
        : ophimData.director,
      inLanguage: "vi-VN",
      publisher: {
        "@type": "Organization",
        name: "Needflex",
        url: baseUrl,
        logo: `${baseUrl}/android-chrome-512x512.png`,
      },
      author: {
        "@type": "Organization",
        name: "Needflex",
        url: baseUrl,
        logo: `${baseUrl}/android-chrome-512x512.png`,
      },
    };

    // const schema = {
    //   "@context": "https://schema.org",
    //   "@type":
    //     mergedData.og_type === "video.movie"
    //       ? "Movie"
    //       : mergedData.og_type === "video.tv_show"
    //       ? "TVSeries"
    //       : "WebSite",
    //   name: mergedData.titleHead,
    //   description: mergedData.descriptionHead,
    //   url,
    //   image,
    //   ...mergedData.seoSchema,
    // };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-schema";
    script.textContent = JSON.stringify(schema, null, 2);
    document.head.appendChild(script);

    // ✅ BRAND SCHEMA (Organization)
    removeOldScript("json-org-schema");
    const brandSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: siteName,
      url: baseUrl,
      logo: `${baseUrl}/assets/images/N_logo.png`,
    };
    const scriptBrand = document.createElement("script");
    scriptBrand.type = "application/ld+json";
    scriptBrand.id = "json-org-schema";
    scriptBrand.textContent = JSON.stringify(brandSchema, null, 2);
    document.head.appendChild(scriptBrand);

    // 🧹 CLEANUP
    return () => {
      removeOldScript("json-ld-schema");
      removeOldScript("json-org-schema");
    };
  }, [pathname, search, seoData, baseUrl, siteName, defaultImage]);

  return null;
};

export default SEO;
