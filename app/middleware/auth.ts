/**
 * Access Control Middleware
 *
 * Simple middleware that runs a conditional check to decide whether to allow a page to render.
 * Currently uses a simple `true` check but designed to be expanded for real access control logic.
 *
 * @example
 * // Apply to a specific page:
 * // In a .vue page file:
 * definePageMeta({
 *   middleware: 'access-control'
 * })
 *
 * @example
 * // Apply globally by naming it 'auth.global.ts'
 */

export default defineNuxtRouteMiddleware((to, _from) => {
  // Simple conditional check - expand this logic as needed
  const allowAccess = true

  if (!allowAccess) {
    console.error("Access denied for route:", to.path)

    // Redirect to access denied page or throw error
    throw createError({
      statusCode: 403,
      statusMessage: "Access Denied",
      data: {
        path: to.path,
        reason: "Access control check failed"
      }
    })
  }

  // Allow the page to render
  console.log("Access granted for route:", to.path)
})
