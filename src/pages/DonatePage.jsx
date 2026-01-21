import { useState } from "react";
import SEO from "../components/SEO";
import { toast } from "react-toastify";

const listAmount = [10000, 20000, 50000, 100000, 200000, 500000];

function DonatePage() {
  const [createdQR, setCreatedQR] = useState(false);
  const [imgQR, setImgQR] = useState("");
  const [loading, setLoading] = useState(false);
  const seoData = {
    titleHead: "Ủng Hộ - Góp phần duy trì trang xem phim miễn phí",
    descriptionHead:
      "Ủng hộ Needflex để giúp chúng mình duy trì máy chủ, cập nhật phim nhanh hơn và không quảng cáo. Mọi đóng góp đều đáng quý!",
    og_url: "ung-ho",
    og_type: "website",
    og_image: ["/assets/images/N_logo.png"],
    seoSchema: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: "Ủng Hộ",
      description:
        "Ủng hộ Needflex để duy trì website xem phim miễn phí, không quảng cáo.",
      url: "https://needflex.site/ung-ho",
    },
  };

  const handleCreateQR = async () => {
    setLoading(true);
    const amount = document.getElementById("amount").value;
    if (amount != 0) {
      const img = (await import.meta.env.VITE_API_DONATE) + "&amount=" + amount;
      setImgQR(img);
      setCreatedQR(true);
    } else {
      toast.error("Vui lòng chọn số tiền");
    }
    setLoading(false);
  };

  const handleBack = () => {
    setCreatedQR(false);
    setImgQR("");
  };

  return (
    <div className="text-white flex flex-col items-center justify-center space-y-5 text-center px-[3%] mt-24">
      <SEO seoData={seoData} />
      <h1 className="text-2xl sm:text-4xl font-bold">Donate</h1>
      <p>
        Nếu bạn thấy dự án hữu ích và muốn ủng hộ chi phí duy trì, hãy donate
        cho website.
      </p>
      {(createdQR && (
        <>
          {loading && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-[500px] aspect-[0.75] bg-gray-600 animate-pulse"></div>
            </div>
          )}

          <p>Quét mã QR dưới đây trên app ngân hàng của bạn để chuyển tiền</p>
          <img
            src={imgQR}
            className="w-[500px]"
            loading="eager"
            alt="QR Code"
          ></img>

          <button
            className="bg-black border-[1px] px-2 py-[1px] hover:bg-black/10"
            onClick={handleBack}
          >
            Quay lại
          </button>
        </>
      )) || (
        <>
          <select
            id="amount"
            className="bg-black border-[1px] pr-3 pl-1 py-[2px]"
            required
          >
            <option value={0}>Chọn số tiền</option>
            {listAmount.map((amount) => {
              return (
                <option key={amount} value={amount}>
                  {amount.toLocaleString()}đ
                </option>
              );
            })}
          </select>
          <button
            className="bg-[#e50914] rounded px-3 py-1 hover:bg-[#e50914]/80 transition-colors ease-linear"
            onClick={handleCreateQR}
          >
            Tạo mã donate
          </button>
        </>
      )}
    </div>
  );
}

export default DonatePage;
