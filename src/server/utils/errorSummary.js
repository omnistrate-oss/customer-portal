/**
 * Makes an error safe to log. An axios error carries the whole request, including its body and headers, which
 * can hold passwords and tokens, so only its outline is kept. Any other Error keeps its name, message and stack,
 * and a thrown non-Error value is reduced to its type.
 *
 * @example
 * console.error("Error in sign in", errorSummary(error));
 * // logs { name: "AxiosError", message: "Request failed with status code 400", code: "ERR_BAD_REQUEST",
 * //        status: 400, method: "post", path: "/signin" }
 */
function errorSummary(error) {
  if (error?.isAxiosError) {
    return {
      name: error.name,
      message: error.message,
      code: error.code,
      status: error.response?.status,
      method: error.config?.method,
      path: error.config?.url?.split("?")[0],
    };
  }
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { type: typeof error };
}

module.exports = { errorSummary };
