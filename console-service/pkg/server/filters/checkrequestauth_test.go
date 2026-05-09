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

package filters

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"console-service/pkg/constant"
	"console-service/pkg/utils/authutil"
)

func TestRequestAuthCheckerGetTokenFromOpenFuyaoAuthHeader(t *testing.T) {
	tests := []struct {
		name    string
		header  string
		want    string
		wantErr bool
	}{
		{
			name:    "missing_bearer_prefix",
			header:  "invalid_token",
			want:    "",
			wantErr: true,
		},
		{
			name:    "empty_header",
			header:  "",
			want:    "",
			wantErr: true,
		},
		{
			name:    "bearer_without_token",
			header:  "Bearer ",
			want:    "",
			wantErr: true,
		},
		{
			name:    "invalid_jwt_token",
			header:  "Bearer invalid.jwt.token",
			want:    "",
			wantErr: true,
		},
		{
			name:    "valid_bearer_prefix_with_valid_token",
			header:  "Bearer " + authutil.GenerateToken("test"),
			want:    authutil.GenerateToken("test"),
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rc := &requestAuthChecker{}
			req := &http.Request{
				Header: map[string][]string{},
			}
			if tt.header != "" {
				req.Header.Set(constant.OpenFuyaoAuthHeader, tt.header)
			}

			got, err := rc.getTokenFromOpenFuyaoAuthHeader(req)
			if (err != nil) != tt.wantErr {
				t.Errorf("requestAuthChecker.getTokenFromOpenFuyaoAuthHeader() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if got != tt.want {
				t.Errorf("requestAuthChecker.getTokenFromOpenFuyaoAuthHeader() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestSetReferrerCookie(t *testing.T) {
	tests := []struct {
		name        string
		originalURL string
		wantCookie  bool
		wantValue   string
	}{
		{
			name:        "set_cookie_with_valid_url",
			originalURL: "/container_platform/workload/pods",
			wantCookie:  true,
			wantValue:   "/container_platform/workload/pods",
		},
		{
			name:        "set_cookie_with_full_url",
			originalURL: "http://example.com/container_platform/workload/pods?param=value",
			wantCookie:  true,
			wantValue:   "http://example.com/container_platform/workload/pods?param=value",
		},
		{
			name:        "set_cookie_with_empty_url",
			originalURL: "",
			wantCookie:  true,
			wantValue:   "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := httptest.NewRecorder()
			setReferrerCookie(recorder, tt.originalURL)

			result := recorder.Result()
			cookies := result.Cookies()
			if tt.wantCookie {
				if len(cookies) == 0 {
					t.Errorf("setReferrerCookie() did not set any cookie")
					return
				}
				var found bool
				for _, cookie := range cookies {
					if cookie.Name == constant.CookieNameReferrer {
						found = true
						if cookie.Value != tt.wantValue {
							t.Errorf("setReferrerCookie() cookie value = %v, want %v", cookie.Value, tt.wantValue)
						}
						// Verify cookie properties
						if cookie.Path != "/" {
							t.Errorf("setReferrerCookie() cookie path = %v, want /", cookie.Path)
						}
						if !cookie.HttpOnly {
							t.Errorf("setReferrerCookie() cookie should be HttpOnly")
						}
						if !cookie.Secure {
							t.Errorf("setReferrerCookie() cookie should be Secure")
						}
						if cookie.SameSite != http.SameSiteLaxMode {
							t.Errorf("setReferrerCookie() cookie SameSite = %v, want Lax", cookie.SameSite)
						}
						// Verify expiry is approximately 7200 seconds from now
						expectedExpiry := time.Now().Add(defaultCookieExpireTime * time.Second)
						if cookie.Expires.Sub(expectedExpiry) > time.Minute {
							t.Errorf("setReferrerCookie() cookie expiry = %v, want approximately %v", cookie.Expires, expectedExpiry)
						}
						break
					}
				}
				if !found {
					t.Errorf("setReferrerCookie() did not set cookie with name %s", constant.CookieNameReferrer)
				}
			}
		})
	}
}
func TestGetReferrerURL(t *testing.T) {
	baseURL := "http://example.com"
	tests := []struct {
		name          string
		requestURL    string
		refererHeader string
		want          string
	}{
		{
			name:          "use_request_url_when_no_referer",
			requestURL:    "/container_platform/workload/pods",
			refererHeader: "",
			want:          baseURL + "/container_platform/workload/pods",
		},
		{
			name:          "use_referer_header_when_present",
			requestURL:    "/rest/console/v1beta1/pods",
			refererHeader: "http://example.com/container_platform/workload/pods",
			want:          "http://example.com/container_platform/workload/pods",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", baseURL+tt.requestURL, nil)
			if tt.refererHeader != "" {
				req.Header.Set("Referer", tt.refererHeader)
			}

			got := getReferrerURL(req)
			if got != tt.want {
				t.Errorf("getReferrerURL() = %v, want %v", got, tt.want)
			}
		})
	}
}
