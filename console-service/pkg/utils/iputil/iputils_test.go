/*
 * Copyright (c) 2024 Huawei Technologies Co., Ltd.
 * openFuyao is licensed under Mulan PSL v2.
 * You can use this software according to the terms and conditions of the Mulan PSL v2.
 * You may obtain a copy of Mulan PSL v2 at:
 *          http://license.coscl.org.cn/MulanPSL2
 * THIS SOFTWARE IS PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND,
 * EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO NON-INFRINGEMENT,
 * MERCHANTABILITY OR FIT FOR A PARTICULAR PURPOSE.
 * See the Mulan PSL v2 for more details.
 */

package iputil

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

var (
	test_ip_refix = "192.168.1."
)

func TestRemoteIp(t *testing.T) {
	tests := []struct {
		name    string
		reqFunc func() *http.Request
		want    string
	}{
		{
			name: "TestRemoteIp with X-Client-IP",
			reqFunc: func() *http.Request {
				req := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
				req.Header.Set("X-Client-IP", test_ip_refix+"1")
				return req
			},
			want: test_ip_refix + "1",
		},
		{
			name: "TestRemoteIp with X-Real-IP",
			reqFunc: func() *http.Request {
				req := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
				req.Header.Set("X-Real-IP", test_ip_refix+"2")
				return req
			},
			want: test_ip_refix + "2",
		},
		{
			name: "TestRemoteIp with RemoteAddr",
			reqFunc: func() *http.Request {
				req := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
				req.Header.Set("X-Forwarded-For", test_ip_refix+"3, "+test_ip_refix+"4")
				return req
			},
			want: test_ip_refix + "3",
		},
		{
			name: "TestRemoteIp with localhost IPv6",
			reqFunc: func() *http.Request {
				req := httptest.NewRequest(http.MethodGet, "http://example.com", nil)
				req.RemoteAddr = "[::1]:80"
				return req
			},
			want: "127.0.0.1",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := RemoteIp(tt.reqFunc()); got != tt.want {
				t.Errorf("RemoteIp() = %v, want %v", got, tt.want)
			}
		})
	}
}
