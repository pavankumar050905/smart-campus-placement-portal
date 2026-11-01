import { configureStore, createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('scp_token') || '',
    user: JSON.parse(localStorage.getItem('scp_user') || 'null')
  },
  reducers: {
    setSession(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('scp_token', state.token);
      localStorage.setItem('scp_user', JSON.stringify(state.user));
    },
    clearSession(state) {
      state.token = ''; state.user = null;
      localStorage.removeItem('scp_token'); localStorage.removeItem('scp_user');
    }
  }
});
export const { setSession, clearSession } = authSlice.actions;
export const store = configureStore({ reducer: { auth: authSlice.reducer } });
