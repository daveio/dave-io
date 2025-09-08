import type { H3Event } from "h3"
import { getQuery, getRequestHeaders, getRequestURL, getRouterParams, setResponseStatus } from "h3"
import { logResponse } from "~~/server/utils/logging"

/**
 * Extracts and returns key request details from an H3Event object.
 * This function gathers method, path, URL, headers, query parameters, and route parameters for logging or response purposes.
 *
 * Args:
 *   event: The H3Event representing the HTTP request context.
 *
 * Returns:
 *   An object containing method, path, url, headers, query, and params from the event.
 */
function serializeEvent(event: H3Event) {
  const headers = getRequestHeaders(event)
  const query = getQuery(event)
  const params = getRouterParams(event)
  const url = getRequestURL(event)
  const { method, path } = event
  return {
    method,
    path,
    url,
    headers,
    query,
    params,
  }
}

/**
 * Formats and returns a standardized response object for an HTTP event.
 * This function sets the response status and includes the response code, data, error message, and request details.
 *
 * Args:
 *   event: The H3Event representing the HTTP request context.
 *   data: The response data to be included.
 *   error: An optional error message string.
 *   code: An optional HTTP status code.
 *
 * Returns:
 *   An object containing the response code, data, error, and serialized request information.
 */
function wrapResponse(event: H3Event, data: unknown, error?: string, code?: number) {
  if (!error) {
    error = undefined
  }
  if (!code) {
    if (error) {
      code = 500
    } else {
      code = 200
    }
  }
  setResponseStatus(event, code)
  return {
    code,
    data,
    error,
    request: serializeEvent(event),
  }
}

/**
 * Sends a successful response for an HTTP event with optional status code.
 * This function logs the response and returns a standardized response object without an error message.
 *
 * Args:
 *   event: The H3Event representing the HTTP request context.
 *   data: The response data to be included.
 *   code: An optional HTTP status code.
 *
 * Returns:
 *   An object containing the response code, data, and serialized request information.
 */
export function ok(event: H3Event, data: unknown, code?: number) {
  logResponse(event, data, code || 200)
  if (code) {
    return wrapResponse(event, data, undefined, code)
  } else {
    return wrapResponse(event, data, undefined)
  }
}

/**
 * Sends an error response for an HTTP event with an error message and optional status code.
 * This function logs the error and returns a standardized response object including the error details.
 *
 * Args:
 *   event: The H3Event representing the HTTP request context.
 *   data: The response data to be included.
 *   error: The error message string to be included in the response.
 *   code: An optional HTTP status code.
 *
 * Returns:
 *   An object containing the response code, data, error, and serialized request information.
 */
export function error(event: H3Event, data: unknown, error: string, code?: number) {
  logResponse(event, data, code || 500, error)
  if (code) {
    return wrapResponse(event, data, error, code)
  } else {
    return wrapResponse(event, data, error)
  }
}
