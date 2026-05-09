# syntax=docker/dockerfile:latest

#######################################################################
# Copyright (c) 2024 Huawei Technologies Co., Ltd.
# openFuyao is licensed under Mulan PSL v2.
# You can use this software according to the terms and conditions of the Mulan PSL v2.
# You may obtain a copy of Mulan PSL v2 at:
#          http://license.coscl.org.cn/MulanPSL2
# THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
# EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
# MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
# See the Mulan PSL v2 for more details.
#######################################################################

ARG NODE_IMAGE=node:20.11.0-alpine
ARG NGINX_IMAGE=openeuler/nginx:1.21.5-oe2203lts

ARG BUILD_PLATFORM=$BUILDOS/amd64

# stage 1: build
FROM --platform=${BUILD_PLATFORM:-$BUILDPLATFORM} ${NODE_IMAGE} AS build

WORKDIR /app

ARG NPM_CONFIG_REGISTRY

# instal dependenies
RUN --mount=source=package.json,target=package.json \
    --mount=source=package-lock.json,target=package-lock.json \
    npm ci

# build project
RUN --mount=source=package.json,target=package.json \
    --mount=source=package-lock.json,target=package-lock.json \
    --mount=source=index.html,target=index.html \
    --mount=source=vite.config.js,target=vite.config.js \
    --mount=source=src,target=src \
    npm run build

# stage 2: final
FROM ${NGINX_IMAGE} AS final

USER 0:0

ENV USER=fuyao \
    GROUP=fuyao \
    UID=65532 \
    GID=65532

RUN groupadd -g ${GID} ${GROUP} && \
    useradd -u ${UID} -g ${GROUP} -s /sbin/nologin -M ${USER}

COPY --link --from=build /app/dist /usr/share/nginx/html
COPY --link build/nginx.conf /etc/nginx/nginx.conf


RUN touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log && \
    touch /tmp/nginx.pid

RUN chown -R ${USER}:${GROUP} /etc/nginx && \
    chown -R ${USER}:${GROUP} /var/log/nginx && \
    chown ${USER}:${GROUP} /etc/nginx/nginx.conf && \
    chown ${USER}:${GROUP} /tmp/nginx.pid && \
    chown -R ${USER}:${GROUP} /usr/share/nginx/html

RUN chmod -R 500 /etc/nginx/ && \
    chmod 600 /var/log/nginx/access.log /var/log/nginx/error.log && \
    chmod 400 /etc/nginx/nginx.conf && \
    chmod 600 /tmp/nginx.pid && \ 
    chmod -R 500 /usr/share/nginx/html

USER ${USER}:${GROUP}

EXPOSE 8080

# ENTRYPOINT ["sleep", "300"]
