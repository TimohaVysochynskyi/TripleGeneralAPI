import {
  createApplication,
  getMyApplication,
  getApplicationById,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
} from '../services/application.js';
import { ctrlWrapper } from '../utils/ctrlWrapper.js';

const submit = ctrlWrapper(async (req, res) => {
  const result = await createApplication(req.user.id, req.body, req.files);

  res.status(201).json({
    status: 201,
    message: 'Анкета успішно подана',
    data: result,
  });
});

const getMy = ctrlWrapper(async (req, res) => {
  const result = await getMyApplication(req.user.id);

  res.status(200).json({
    status: 200,
    message: 'Анкета отримана',
    data: result,
  });
});

const getById = ctrlWrapper(async (req, res) => {
  const { id } = req.params;
  const result = await getApplicationById(parseInt(id));

  res.status(200).json({
    status: 200,
    message: 'Анкета отримана',
    data: result,
  });
});

const getAll = ctrlWrapper(async (req, res) => {
  const {
    status,
    limit,
    userId,
    page = 1,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = req.query;

  const filters = {};
  if (status) filters.status = status;
  if (limit) filters.limit = parseInt(limit);
  if (userId) filters.userId = userId;
  if (page) filters.page = parseInt(page);
  if (sortBy) filters.sortBy = sortBy;
  if (sortOrder) filters.sortOrder = sortOrder;

  const result = await getAllApplications(filters);

  res.status(200).json({
    status: 200,
    message: 'Анкети отримані',
    data: result.applications,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});

const updateStatus = ctrlWrapper(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const result = await updateApplicationStatus(
    parseInt(id),
    status,
    req.user.id,
    rejectionReason,
  );

  res.status(200).json({
    status: 200,
    message: result.message,
    data: {
      status: result.status,
    },
  });
});

const deleteApp = ctrlWrapper(async (req, res) => {
  const { id } = req.params;

  const result = await deleteApplication(parseInt(id));

  res.status(200).json({
    status: 200,
    message: result.message,
    data: null,
  });
});

export { submit, getMy, getById, getAll, updateStatus, deleteApp };
