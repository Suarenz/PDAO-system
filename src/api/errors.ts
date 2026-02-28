const looksLikeMarkupOrBundle = (value: string): boolean => {
  const sample = value.trim().slice(0, 500).toLowerCase();
  return (
    sample.includes('<!doctype html') ||
    sample.includes('<html') ||
    sample.includes('import.meta.hot') ||
    sample.includes('/@vite/client') ||
    sample.includes('jsxdev') ||
    sample.includes('react-refresh')
  );
};

const normalizeMessage = (value: string, maxLength: number = 180): string => {
  const compact = value.replace(/\s+/g, ' ').trim();
  if (compact.length <= maxLength) {
    return compact;
  }
  return `${compact.slice(0, maxLength)}...`;
};

const extractValidationMessage = (errors: unknown): string | null => {
  if (!errors || typeof errors !== 'object') {
    return null;
  }

  const values = Object.values(errors as Record<string, unknown>).flatMap((entry) => {
    if (Array.isArray(entry)) {
      return entry;
    }
    return [entry];
  });

  const firstMessage = values.find((item) => typeof item === 'string' && item.trim().length > 0) as string | undefined;
  return firstMessage ? normalizeMessage(firstMessage) : null;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallback: string = 'Request failed. Please try again.'
): string => {
  const err = error as any;
  const responseData = err?.response?.data;

  if (responseData && typeof responseData === 'object') {
    const message = responseData.message || responseData.error;
    if (typeof message === 'string' && message.trim().length > 0) {
      return normalizeMessage(message);
    }

    const validationMessage = extractValidationMessage(responseData.errors);
    if (validationMessage) {
      return validationMessage;
    }
  }

  if (typeof responseData === 'string') {
    if (looksLikeMarkupOrBundle(responseData)) {
      return 'The server returned an unexpected response format. Please try again in a moment.';
    }
    if (responseData.trim().length > 0) {
      return normalizeMessage(responseData);
    }
  }

  const rawMessage = typeof err?.message === 'string' ? err.message.trim() : '';
  if (rawMessage) {
    if (/unexpected token|json|not valid json|in json at position/i.test(rawMessage)) {
      return 'The server returned an unexpected response format. Please try again in a moment.';
    }
    return normalizeMessage(rawMessage);
  }

  return fallback;
};
