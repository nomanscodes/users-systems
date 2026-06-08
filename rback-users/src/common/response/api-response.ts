export function success<T>(data: T, message = 'Success') {
  return { success: true, message, data };
}

export function paginated<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message = 'Success',
) {
  return {
    success: true,
    message,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}
