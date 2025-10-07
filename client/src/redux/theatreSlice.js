import { createSlice } from "@reduxjs/toolkit";

const theatreSlice = createSlice({
  name: "theatres",
  initialState: {
    theatres: [],
  },
  reducers: {
    setTheatres: (state, action) => {
      state.theatres = action.payload;
    },
  },
});

export const { setTheatres } = theatreSlice.actions;
export default theatreSlice.reducer;
