import React, { useState, useRef } from "react";
import { UserAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [checkEmail, setCheckEmail] = useState(true);
  const [password, setPassword] = useState("");
  const [checkPassword, setCheckPassword] = useState(true);
  const { user, signIn, signInWithGoogle } = UserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (email === "" || password === "") {
      if (email === "") setCheckEmail(false);
      if (password === "") setCheckPassword(false);
    } else if (checkEmail && checkPassword) {
      try {
        await signIn(email, password);
        navigate("/trang-chu");
        toast.success("Đăng nhập thành công.");
      } catch {
        toast.error("Mật khẩu hoặc tài khoản chưa chính xác.");
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate("/trang-chu");
      toast.success("Đăng nhập thành công.");
    } catch (error) {
      toast.error("Có lỗi xảy ra vui lòng thử lại sau.");

    }
  };

  const handleFocus = (e) => {
    if (e.target.id === "password") setCheckPassword(true);
    else setCheckEmail(true);
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e) => {
    setCheckEmail(true);
    setCheckPassword(true);
    if (e.target.id === "password")
      if (!e.target.checkValidity() || e.target.value.trim().length < 6)
        setCheckPassword(false);
      else setPassword(e.target.value.trim());
    else if (!e.target.checkValidity() || !validateEmail(e.target.value))
      setCheckEmail(false);
    else setEmail(e.target.value.trim());
  };

  return (
    <>
      <div className="relative min-h-screen flex items-center justify-center pb-2">
        <img
          src={
            "https://assets.nflxext.com/ffe/siteui/vlv3/fb5cb900-0cb6-4728-beb5-579b9af98fdd/web/VN-vi-20250127-TRIFECTA-perspective_46fb4fd1-c238-4c60-a06b-41c9fe968c1b_large.jpg"
          }
          className="hidden sm:block absolute left-0 top-0 w-full h-full object-cover z-0"
        ></img>
        <div className="hidden sm:block absolute left-0 top-0 w-full h-full bg-black/60 z-10"></div>

        <form
          className="relative w-full sm:w-auto sm:bg-black/75 text-white space-y-4 sm:px-10 rounded-md z-20 px-5 py-10"
          onSubmit={handleSubmit}
        >
          <h2 className="font-bold text-3xl pb-3">Đăng nhập</h2>
          <div className="relative group">
            <input
              type="email"
              name="floating_email"
              id="email"
              className="block px-2 pb-1 pt-4 w-full text-sm text-gray-900 bg-transparent rounded border-[1px] border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              required
              onFocus={handleFocus}
              onChange={handleChange}
              onInvalid={(e) => {
                e.preventDefault();
              }}
            />
            <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 left-2 top-3 -z-10 origin-[0] peer-focus:start-2 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3">
              Email
            </label>
            {!checkEmail && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                <FontAwesomeIcon icon="fa-regular fa-circle-xmark" />
                <span> Vui lòng nhập email hợp lệ.</span>
              </p>
            )}
          </div>
          <div className="relative group">
            <input
              type="password"
              name="floating_password"
              id="password"
              className="block px-2 pb-1 pt-4 w-full text-sm text-gray-900 bg-transparent rounded border-[1px] border-gray-300 appearance-none dark:text-white dark:border-gray-600 dark:focus:border-blue-500 focus:outline-none focus:ring-0 focus:border-blue-600 peer"
              placeholder=" "
              required
              onFocus={handleFocus}
              onChange={handleChange}
              onInvalid={(e) => {
                e.preventDefault();
              }}
            />
            <label className="peer-focus:font-medium absolute text-sm text-gray-500 dark:text-gray-400 duration-300 transform -translate-y-3 scale-75 left-2 top-3 -z-10 origin-[0] peer-focus:start-2 rtl:peer-focus:translate-x-1/4 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-3">
              Mật khẩu
            </label>
            {!checkPassword && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                <FontAwesomeIcon icon="fa-regular fa-circle-xmark" />
                <span> Mật khẩu của bạn phải chứa từ 6 ký tự trở lên.</span>
              </p>
            )}
          </div>
          <button
            type="submit"
            className="text-white bg-[#e50914] hover:bg-[#e50914]/80 w-full py-2 rounded transition-all ease-linear"
          >
            Đăng nhập
          </button>
          <p className="text-center"> HOẶC </p>
          <button
            className="flex items-center justify-center space-x-2 bg-white/20 w-full py-2 rounded hover:bg-white/10 transition-all ease-linear "
            type="button"
            onClick={handleGoogleLogin}
          >
            <img
              src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000"
              className="w-[30px] object-cover"
            ></img>
            <span>Đăng nhập với Google</span>
          </button>
          <div className="group">
            <span>Bạn mới tham gia Needflex? </span>
            <span
              onClick={() => navigate("/dang-ky")}
              className="font-bold group-hover:underline cursor-pointer"
            >
              Đăng ký ngay.
            </span>
          </div>
        </form>
      </div>
    </>
  );
}

export default LoginPage;
