const base64url = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')

/** Unsigned JWT whose `exp` is `secondsFromNow` away (negative = already expired). */
export function fakeJwt(secondsFromNow: number, sub = '0190a1b2-0000-7000-8000-000000000001') {
  const iat = Math.floor(Date.now() / 1000)
  return [
    base64url({ alg: 'HS256', typ: 'JWT' }),
    base64url({ sub, iat, exp: iat + secondsFromNow }),
    'signature',
  ].join('.')
}

export const authResponse = {
  accessToken: fakeJwt(86400),
  tokenType: 'Bearer',
  expiresIn: 86400,
  user: {
    id: '0190a1b2-0000-7000-8000-000000000001',
    email: 'laura@example.com',
    fullName: 'Laura Gómez',
    phoneE164: '+525512345678',
    city: 'COCHABAMBA_BO',
    avatarUrl: null,
    isVerified: false,
  },
}

export const invalidCredentialsError = {
  statusCode: 401,
  code: 'INVALID_CREDENTIALS',
  message: 'Incorrect email or password',
  details: null,
}

export const emailTakenError = {
  statusCode: 409,
  code: 'EMAIL_TAKEN',
  message: 'Email already in use',
  details: null,
}

export const validationError = {
  statusCode: 400,
  code: 'VALIDATION_ERROR',
  message: 'Validation failed',
  details: [
    {
      field: 'phoneE164',
      message: 'phoneE164 must be in E.164 format, e.g. +525512345678',
    },
    { field: 'password', message: 'password must be longer than or equal to 8 characters' },
  ],
}

export const unauthorizedError = {
  statusCode: 401,
  code: 'UNAUTHORIZED',
  message: 'Invalid or expired token',
  details: null,
}

export const rateLimitedError = {
  statusCode: 429,
  code: 'RATE_LIMITED',
  message: 'Too many attempts. Try again later.',
  details: null,
}
