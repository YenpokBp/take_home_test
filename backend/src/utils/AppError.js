export class AppError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors; // detail per-field (opsional)
  }
}

export const validationError = (errors) =>
  new AppError(422, 'Validasi gagal', errors);
