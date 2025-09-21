import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  getCurrentUser,
} from '../services/auth.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const register = ctrlWrapper(async (req, res) => {
  const result = await registerUser(req.body);

  res.status(201).json({
    status: 201,
    message: 'Пользователь успешно зарегистрирован',
    data: result,
  });
});

const login = ctrlWrapper(async (req, res) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    status: 200,
    message: 'Успешный вход в систему',
    data: result,
  });
});

const refresh = ctrlWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await refreshUserTokens(refreshToken);

  res.status(200).json({
    status: 200,
    message: 'Токены успешно обновлены',
    data: result,
  });
});

const logout = ctrlWrapper(async (req, res) => {
  const authHeader = req.get('Authorization');
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    await logoutUser(token);
  }

  res.status(204).json({
    status: 204,
    message: 'Успешный выход из системы',
  });
});

const me = ctrlWrapper(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({
    status: 200,
    message: 'Данные пользователя получены',
    data: user,
  });
});

export { register, login, refresh, logout, me };
