/**
 * The one error type the generation route speaks.
 *
 * It carries an HTTP status and a stable machine code alongside the message,
 * because the browser shows all three: the code is what a user can quote back,
 * and the message is what whoever owns the deployment needs to read.
 */
export class GenerateReviewError extends Error {
  status: number
  code: string

  constructor(message: string, status: number, code: string) {
    super(message)
    this.name = 'GenerateReviewError'
    this.status = status
    this.code = code
  }
}
