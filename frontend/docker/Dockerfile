FROM node:20.10.0-alpine as builder

WORKDIR /frontend

COPY ./package.json /frontend/package.json
COPY ./package-lock.json /frontend/package-lock.json

RUN npm install

COPY public ./public

COPY src ./src

COPY tailwind.config.js ./tailwind.config.js

RUN npx tailwindcss build -i src/input.css -o public/output.css --minify

RUN npm run build --production

# stage 2
FROM nginx:alpine

COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /frontend/build /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
