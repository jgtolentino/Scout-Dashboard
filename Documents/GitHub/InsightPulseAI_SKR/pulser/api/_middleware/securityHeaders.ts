import { AzureFunction, Context, HttpRequest } from "@azure/functions";

const middleware: AzureFunction = async (context: Context, req: HttpRequest) => {
  context.res = {
    ...(context.res || {}),
    headers: {
      ...(context.res?.headers || {}),
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Permissions-Policy": "geolocation=(), microphone=()"
    }
  };
};

export default middleware;