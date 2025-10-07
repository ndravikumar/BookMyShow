import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { showLoader, hideLoader } from "../redux/loaderSlice";
import axiosInstance from "../api";

const useApi = () => {
  const dispatch = useDispatch();

  const callApi = useCallback(async (method, url, data = null) => {
    dispatch(showLoader());
    try {
      const response = await axiosInstance[method](url, data);
      return response.data;
    } catch (error) {
      return error;
    } finally {
      dispatch(hideLoader());
    }
  }, [dispatch]);

  return { callApi };
};

export default useApi;
