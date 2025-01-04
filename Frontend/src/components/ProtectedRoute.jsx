import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Layout, Menu, message } from "antd";
import { hideLoading, showLoading } from "../redux/loaderSlice";
import { GetCurrentUser } from "../api/user";
import { setUser } from "../redux/userSlice";
import { Header } from "antd/es/layout/layout";
import {
  HomeOutlined,
  LogoutOutlined,
  ProfileOutlined,
  UserOutlined,
} from "@ant-design/icons";

const ProtectedRoute = ({ children }) => {
  const { user } = useSelector((state) => state.user);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const navItems = [
    {
      key: "home",
      label: (
        <span
          onClick={() => {
            navigate("/", { replace: true });
          }}
        >
          Home
        </span>
      ),
      icon: <HomeOutlined />,
    },
    {
      key: "profile",
      label: `${user ? user.name : ""}`,
      icon: <UserOutlined />,
      children: [
        {
          label: (
            <span
              onClick={() => {
                if (user.role === "admin") {
                  navigate("/admin", { replace: true });
                } else if (user.role === "patner") {
                  navigate("/patner", { replace: true });
                } else {
                  navigate("/profile", { replace: true });
                }
              }}
            >
              My Profile
            </span>
          ),
          icon: <ProfileOutlined />,
        },
        {
          key: "logout",
          label: (
            <Link
              to="/login"
              onClick={() => {
                localStorage.removeItem("tokenForBMS");
              }}
            >
              Log out
            </Link>
          ),
          icon: <LogoutOutlined />,
        },
      ],
    },
  ];
  const getValidUser = async () => {
    try {
      dispatch(showLoading());
      const response = await GetCurrentUser();
      dispatch(setUser(response?.data));
    } catch (error) {
      message.error(error);
    } finally {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    if (localStorage.getItem("tokenForBMS")) {
      getValidUser();
    } else {
      navigate("login");
    }
  }, []);

  return (
    user && (
      <>
        <Layout>
          <Header
            className="d-flex justify-content-between"
            style={{
              position: "sticky",
              top: 0,
              zIndex: 1,
              width: "100%",
              alignItems: "center",
            }}
          >
            <h3
              className="text-white m-0"
              style={{ color: "white", cursor: "pointer" }}
              onClick={() => {
                navigate("/");
              }}
            >
              Book My Show
            </h3>
            <Menu theme="dark" mode="horizontal" items={navItems} />
          </Header>
        </Layout>
        <div>{children}</div>
      </>
    )
  );
};

export default ProtectedRoute;

ProtectedRoute.propTypes = {
  children: PropTypes.any,
};
