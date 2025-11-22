import * as api from '../api/api'
import { authActions } from '../slices/authSlice'
import type { AppDispatch } from '../stores/store'

type RegisterCreds = { username: string; password: string }

const RegisterThunk = (creds: RegisterCreds) => async (dispatch: AppDispatch) => {
  try {
    dispatch(authActions.authStart())

    const user = await api.register(creds)

    dispatch(authActions.authSuccess(user))

    return user
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Register failed'
    dispatch(authActions.authFailure(msg))
    throw e
  }
}

export default RegisterThunk