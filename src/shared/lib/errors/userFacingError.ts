/** Ошибка, текст которой можно показать пользователю как есть. */
export class UserFacingError extends Error {
  override readonly name: string = 'UserFacingError'
}
