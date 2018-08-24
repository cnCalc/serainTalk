module.exports = {
  ALREADY_MIGRATED: {
    message: 'member already migrated',
    code: 'ERR_ALREADY_MINGRATED',
  },
  BAD_COOKIE: {
    message: 'invalid or bad user token',
    code: 'ERR_INVALID_TOKEN',
  },
  BAD_PASSWORD: {
    message: 'invalid password',
    code: 'ERR_WRONG_PASSWORD',
  },
  BAD_REQUEST: {
    message: 'invalid or bad request',
    code: 'ERR_BAD_REQUEST',
  },
  BAD_VERIFICATION_CODE: {
    message: 'invalid verification code',
    code: 'ERR_WRONG_VERIFICATION_CODE',
  },
  DB_ERROR: {
    message: 'server-side database error',
    code: 'ERR_SERVER_DB_FAILURE',
  },
  EMAIL_EXIST: {
    message: 'email is exist',
    code: 'ERR_EMAIL_USED',
  },
  LACK_INFO: {
    message: 'need more information',
    code: '',
  },
  MEMBER_EXIST: {
    message: 'member is exist',
    code: 'ERR_MEMBER_EXIST',
  },
  MEMBER_NOT_EXIST: {
    message: 'member not exist',
    code: 'ERR_MEMBER_NOT_FOUND',
  },
  NEED_LOGIN: {
    message: 'login first please.',
    code: 'ERR_REQUIRE_AUTHORIZATION',
  },
  NOT_FOUND: {
    message: 'unable to find the specified resources',
    code: 'ERR_NOT_FOUND',
  },
  OUT_OF_LIMIT: {
    message: 'out of limit.',
    code: 'ERR_ATTACHMENT_LIMIT_EXCEEDED',
  },
  PERMISSION_DENIED: {
    message: 'permission denied',
    code: 'ERR_PERMISSION_DENIED',
  },
  RESET_PASSWORD: {
    message: 'need to reset password',
    code: 'ERR_REQUIRE_RESET_PASSWORD',
  },
  SERVER_ERROR: {
    message: 'server error',
    code: 'ERR_SERVER_INTERNAL_ERROR',
  },
  TOKEN_EXPIRED: {
    message: 'invalid or expired token',
    code: 'ERR_TOKEN_EXPIRED',
  },
  TOO_FREQUENT: {
    message: 'requests are too frequent',
    code: 'ERR_POST_FREQUENCY_EXCEEDED',
  },
  VALIDATION_ERROR: {
    message: 'validation error',
    code: 'ERR_VALIDATION',
  },
  WRONG_ENV: {
    message: 'the api is not available open on production server',
    code: 'ERR_API_NOT_AVAILABLE',
  },
  TRAFFIC_LIMIT_EXCEEDED: {
    message: 'traffic limit exceeded.',
    code: 'ERR_TRAFFIC_LIMIT_EXCEEDED',
  },
  DISCUSSION_LOCKED: {
    message: 'the discussion is locked.',
    code: 'ERR_DISCUSSION_LOCKED',
  },
};
