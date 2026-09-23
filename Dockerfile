# The public Nitora Trading Academy site: a static build served by nginx.
#
# Built WITHOUT VITE_DATA_API, and that is the point of this image. A production build
# with no service named offers the synthetic market only -- no Real replay, no Live, no
# request to anything. It is the only build that may be public: what the market-data
# service fetches may not be shown to anyone but its operator. Do not add the variable
# here; a build that has it belongs on your own machine, not on a public server.

FROM node:22-alpine AS build
WORKDIR /app

# Dependencies first, so a code change reuses the cached install layer.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY . .
# Typecheck and bundle. The course's own checks -- content lint, the price check, the
# engine and figure tests -- run in CI before this image is built, not in here.
RUN npm run build

# Unprivileged nginx: listens on 8080 and runs as a non-root user, so nothing in the
# container can bind a privileged port or write outside /tmp.
FROM nginxinc/nginx-unprivileged:stable-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO /dev/null http://127.0.0.1:8080/ || exit 1
