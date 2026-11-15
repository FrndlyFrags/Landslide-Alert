// -----------------------------------------------------------------------
// env.js — environment-driven values for production builds.
// WHAT: Centralises anything that differs between dev (localhost) and
//       deployed (Docker/nginx) environments so the code stays clean.
// USAGE: Replace VITE_API_BASE_URL with your deployment URL before build.
// -----------------------------------------------------------------------

/**
 * Base URL for the backend API. In development this is null (fetches go to
 * /api/ which Vite proxies or nginx reverse-proxies). In production the
 * Dockerfile injects the real backend URL via --build-arg BACKEND_URL.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";
