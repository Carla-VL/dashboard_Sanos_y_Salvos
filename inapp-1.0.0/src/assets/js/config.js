window.APP_CONFIG = {
  API_BFF:
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
      ? "http://localhost:8085/api/bff"
      : "https://34-193-134-184.sslip.io/api/bff",
};