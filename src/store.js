import { createStore } from "redux";

// Simple reducer (you can expand later)
const initialState = {
  user: null,
  settings: { authProvider: "local", logo: "" },
};

function rootReducer(state = initialState, action) {
  switch (action.type) {
    case "user/LOGIN":
      return { ...state, user: action.payload };
    case "user/LOGOUT":
      return { ...state, user: null };
    default:
      return state;
  }
}

const store = createStore(rootReducer);

export default store;
