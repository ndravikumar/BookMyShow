import { configureStore } from "@reduxjs/toolkit";
import loadersReducer from "./loaderSlice";
import usersReducer from "./userSlice";
import moviesReducer from "./movieSlice";
import theatresReducer from "./theatreSlice";

const store = configureStore({
  reducer: {
    loader: loadersReducer,
    user: usersReducer,
    movies: moviesReducer,
    theatres: theatresReducer,
  },
});

export default store;
