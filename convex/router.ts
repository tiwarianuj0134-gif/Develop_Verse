import { httpRouter } from "convex/server";

const http = httpRouter();

// Add your custom HTTP endpoints here
// Example:
// http.route({
//   path: "/api/webhook",
//   method: "POST",
//   handler: httpAction(async (ctx, request) => {
//     // Handle webhook
//   }),
// });

export default http;
