/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    buildActivity: false,
  }
  // Media is served straight from the Spring Boot server
  // (http://localhost:8080/uploads/...), so nothing extra to configure here.
};

export default nextConfig;
