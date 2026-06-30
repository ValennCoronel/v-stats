export function getPublicBaseUrl(request: Request) {
  const explicitBaseUrl = process.env.PUBLIC_APP_URL || process.env.NEXT_PUBLIC_APP_URL
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/$/, "")
  }

  const proto = request.headers.get("x-forwarded-proto") || "http"
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host")

  if (!host) {
    return "http://localhost:3000"
  }

  return `${proto}://${host}`
}
