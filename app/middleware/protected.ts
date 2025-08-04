// middleware/protected.ts
export default defineNuxtRouteMiddleware(async (_to, _from) => {
  const user = useSupabaseUser()

  // If no user, redirect to login
  if (!user.value) {
    return navigateTo("/auth/login")
  }

  // Check if user is in authorized whitelist
  try {
    // @ts-expect-error - data is not typed
    const { data } = await $fetch("/api/auth/check-authorization", {
      method: "POST",
      body: {
        email: user.value.email,
        phone: user.value.phone
      }
    })

    if (!data.authorized) {
      throw createError({
        statusCode: 403,
        statusMessage: "Access denied: User not authorized"
      })
    }
  } catch {
    throw createError({
      statusCode: 403,
      statusMessage: "Access denied"
    })
  }
})
