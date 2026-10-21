export function sessionReason(code) {
  if (code === 50014) return 'expired'
  if (code === 50008 || code === 50401) return 'invalid'
  return null
}

// Parallel dashboard requests must clear the session and redirect only once.
export function createSessionExpiryHandler(resetToken, redirect) {
  let pending = null
  return (reason) => {
    if (!pending) {
      pending = Promise.resolve().then(resetToken).then(() => redirect(reason), () => redirect(reason))
    }
    return pending
  }
}
