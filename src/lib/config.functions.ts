import { createServerFn } from "@tanstack/react-start";

export const getPublicConfig = createServerFn({
  method: "GET",
}).handler(async () => {
  return {
    emailjs: {
      serviceId: process.env.EMAILJS_SERVICE_ID ?? "",
      templateId: process.env.EMAILJS_TEMPLATE_ID ?? "",
      publicKey: process.env.EMAILJS_PUBLIC_KEY ?? "",
    },
  };
});