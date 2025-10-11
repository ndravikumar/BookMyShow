import React, { useEffect } from "react";
import { Form, Input, Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { LoginUser } from "../api/user";
import { useContext } from "react";
import AlertContext from "./AlertContext";
import { useDispatch } from "react-redux";
import { hideLoading, showLoading } from "../redux/loaderSlice";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { showAlert } = useContext(AlertContext);
  const onFinish = async (values) => {
    try {
      dispatch(showLoading());
      const response = await LoginUser(values);
      if (response?.success) {
        showAlert(response?.message, "success");
        navigate("/");
      } else if (response?.message === "Please enter valid password") {
        showAlert(response?.message, "error");
      }
    } catch (error) {
      showAlert(error?.message || "Login failed", "error");
    } finally {
      dispatch(hideLoading());
    }
  };

  useEffect(() => {
    // No localStorage check needed, cookie-based auth
  }, []);
  return (
    <header className="App-header">
      <main className="main-area mw-500 text-center px-3">
        <section>
          <h1>Login to BookMyShow</h1>
        </section>
        <section>
          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              htmlFor="email"
              name="email"
              className="d-block"
              rules={[{ required: true, message: "Email is Required" }]}
            >
              <Input
                id="email"
                type="email"
                placeholder="Enter your Email"
              ></Input>
            </Form.Item>
            <Form.Item
              label="Password"
              htmlFor="password"
              name="password"
              className="d-block"
              rules={[{ required: true, message: "Password is Required" }]}
            >
              <Input
                id="password"
                type="password"
                placeholder="Enter your Password"
              ></Input>
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                block
                htmlType="submit"
                style={{ fontSize: "1rem", fontWeight: "600" }}
              >
                Login
              </Button>
            </Form.Item>
          </Form>
        </section>
        <section>
          <p>
            New User ? <Link to="/register">Register Here</Link>
          </p>
          <p>
            Forgot Password? <Link to="/forget">Click Here</Link>
          </p>
        </section>
      </main>
    </header>
  );
};

export default Login;
