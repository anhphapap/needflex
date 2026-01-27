import React, { useState, useRef } from "react";
import { UserAuth } from "../context/AuthContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

function SignUpPage() {
  const [name, setName] = useState("");
  const [checkName, setCheckName] = useState(true);
  const [email, setEmail] = useState("");
  const [checkEmail, setCheckEmail] = useState(true);
  const [password, setPassword] = useState("");
  const [checkPassword, setCheckPassword] = useState(true);
  const [password2, setPassword2] = useState("");
  const [checkPassword2, setCheckPassword2] = useState(true);
  const { user, signUp } = UserAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      email === "" ||
      password === "" ||
      name === "" ||
      password2 === "" ||
      password != password2
    ) {
      if (email === "") setCheckEmail(false);
      if (password === "") setCheckPassword(false);
      if (name === "") setCheckName(false);
      if (password2 === "") setCheckPassword2(false);
      if (password !== password2 && checkPassword)
        toast.error("Mật khẩu xác nhận chưa chính xác.");
    } else if (checkEmail && checkPassword) {
      try {
        await signUp(email, password, name);
        navigate("/trang-chu");
        toast.success("Đăng ký thành công.");
      } catch (error) {
        if (error.code === "auth/email-already-in-use")
          toast.error("Email đã được đăng ký trước đó.");
        else {

          toast.error("Có lỗi xảy ra vui lòng thử lại sau.");
        }
      }
    }
  };

  const handleFocus = (e) => {
    switch (e.target.id) {
      case "password":
        setCheckPassword(true);
        break;
      case "password2":
        setCheckPassword2(true);
        break;
      case "email":
        setCheckEmail(true);
        break;
      case "name":
        setCheckName(true);
        break;
    }
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

  const handleChange = (e) => {
    setCheckEmail(true);
    setCheckPassword(true);
    setCheckName(true);
    setCheckPassword2(true);
    switch (e.target.id) {
      case "password": {
        if (!e.target.checkValidity() || e.target.value.trim().length < 6)
          setCheckPassword(false);
        else setPassword(e.target.value.trim());
        break;
      }
      case "password2": {
        if (!e.target.checkValidity() || e.target.value.trim().length < 6)
          setCheckPassword2(false);
        else setPassword2(e.target.value.trim());
        break;
      }
      case "email": {
        if (!e.target.checkValidity() || !validateEmail(e.target.value))
          setCheckEmail(false);
        else setEmail(e.target.value.trim());
        break;
      }
      case "name": {
        if (e.target.value.trim() === "") setCheckName(false);
        else setName(e.target.value.trim());
        break;
      }
    }
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

        <form className="relative w-full sm:w-auto sm:bg-black/75 text-white space-y-4 sm:px-10 rounded-md z-20 px-5 py-10 mt-10">
          <h2 className="font-bold text-3xl pb-3">Đăng ký</h2>
          <div className="relative group">
            <input
              type="text"
              name="floating_name"
              id="name"
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
              Tên
            </label>
            {!checkName && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                <FontAwesomeIcon icon="fa-regular fa-circle-xmark" />
                <span> Vui lòng nhập tên của bạn.</span>
              </p>
            )}
          </div>
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
          <div className="relative group">
            <input
              type="password"
              name="floating_password2"
              id="password2"
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
              Xác nhận mật khẩu
            </label>
            {!checkPassword2 && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-500">
                <FontAwesomeIcon icon="fa-regular fa-circle-xmark" />
                <span> Mật khẩu của bạn phải chứa từ 6 ký tự trở lên.</span>
              </p>
            )}
          </div>
          <button
            type="submit"
            onClick={handleSubmit}
            className="text-white bg-[#e50914] hover:bg-[#e50914]/80 w-full py-2 rounded transition-all ease-linear"
          >
            Đăng ký
          </button>
          <div className="group">
            <span>Bạn đã tham gia Needflex? </span>
            <span
              onClick={() => navigate("/dang-nhap")}
              className="font-bold group-hover:underline cursor-pointer"
            >
              Đăng nhập.
            </span>
          </div>
        </form>
      </div>
    </>
  );
}

export default SignUpPage;
