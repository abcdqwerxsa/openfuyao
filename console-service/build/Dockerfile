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

ARG BUILDER_VERSION=1.24.5
ARG BUILDER_IMAGE=golang:$BUILDER_VERSION
ARG PKG=./cmd

ARG BASE_TYPE=static
ARG BASE_IMAGE=cr.openfuyao.cn/openfuyao/base/$BASE_TYPE

# stage 1: build
FROM $BUILDER_IMAGE AS build

WORKDIR /go/src/app

COPY console-service/ .

RUN go build -o /go/bin/app -gcflags="all=" -ldflags="all=-w -s -buildid= -linkmode=external" "./cmd"

# stage 2: release
FROM $BASE_IMAGE AS release

WORKDIR /

COPY --link --from=build --chmod=555 /go/bin/app entrypoint

ENTRYPOINT [ "./entrypoint" ]
