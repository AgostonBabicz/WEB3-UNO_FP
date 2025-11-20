import * as api from '../api/api'
import { authActions } from '../slices/authSlice'
import type { AppDispatch } from '../stores/store'

type LoginCreds = { username: string; password: string }

const LoginThunk = (creds: LoginCreds) => async (dispatch: AppDispatch) => {
  try {
    dispatch(authActions.authStart())
    const user = await api.login(creds)
    dispatch(authActions.authSuccess(user))
    return user
  } catch (e: any) {
    const msg = e?.message ?? 'Login failed'
    dispatch(authActions.authFailure(msg))
    throw e 
  }
}

export default LoginThunk