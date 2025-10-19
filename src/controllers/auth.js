import createHttpError from 'http-errors';

import {
  registerUser,
  loginUser,
  refreshUserTokens,
  logoutUser,
  getCurrentUser,
  updateProfilePhoto,
} from '../services/auth.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const register = ctrlWrapper(async (req, res) => {
  const result = await registerUser(req.body);

  res.status(201).json({
    status: 201,
    message: 'Користувач успішно зареєстрований',
    data: result,
  });
});

const login = ctrlWrapper(async (req, res) => {
  const result = await loginUser(req.body);

  res.status(200).json({
    status: 200,
    message: 'Успішний вхід в систему',
    data: result,
  });
});

const refresh = ctrlWrapper(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await refreshUserTokens(refreshToken);

  res.status(200).json({
    status: 200,
    message: 'Токени успішно оновлені',
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
    message: 'Успішний вихід з системи',
  });
});

const me = ctrlWrapper(async (req, res) => {
  const user = await getCurrentUser(req.user.id);

  res.status(200).json({
    status: 200,
    message: 'Дані користувача отримані',
    data: user,
  });
});

const updatePhoto = ctrlWrapper(async (req, res) => {
  if (!req.file) {
    throw createHttpError(400, 'Фото профілю обов\'язкове');
  }

  const user = await updateProfilePhoto(req.user.id, req.file);

  res.status(200).json({
    status: 200,
    message: 'Фото профілю успішно оновлено',
    data: {
      user,
    },
  });
});

export { register, login, refresh, logout, me, updatePhoto };
