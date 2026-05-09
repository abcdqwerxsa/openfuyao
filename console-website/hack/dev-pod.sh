#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NS=openfuyao-system
DEV_POD=console-website-dev
DEV_CONTAINER=console-website
ANNOTATION_MANAGED_NODEPORT="console-website.dev-pod/opened-nodeport"

usage() {
  echo "用法: $0 {create|activate|deactivate|start|kill|build|preview}"
  echo "  create  - 创建 console-website-dev Pod，并将 code 卷指向本仓库根目录、nodeName 指向当前所在节点并 kubectl apply"
  echo "  delete  - 删除 console-website-dev Pod"
  echo "  activate  - 执行 Service 配置，启用 NodePort 30001。需执行 start 或 preview 以启动开发/预览服务器"
  echo "  deactivate - 恢复 Service 配置"
  echo "  start   - 在 Pod 内执行 npm run start，可选 -d：后台运行"
  echo "  build   - 在 Pod 内执行 npm run build，可选 -d 后台运行"
  echo "  preview - 在 Pod 内执行 npm run preview，可选 -d 后台运行。需先有构建产物"
  echo "  kill    - 结束全部 Vite 相关的进程（pkill -f vite）"
}

require_kubectl() {
  command -v kubectl >/dev/null || {
    echo "错误: 未找到 kubectl" >&2
    exit 1
  }
}

write_dev_pod_manifest() {
  local node="$1"
  awk -v r="$REPO_ROOT" -v n="$node" '
    /^    - name: code$/ { is_code=1; print; next }
    /^    - name:/ { is_code=0; print; next }
    is_code && /^        path:/ { print "        path: " r; is_code=0; next }
    /^  nodeName:/ { print "  nodeName: " n; next }
    { print }
  ' "${SCRIPT_DIR}/console-website-dev.yaml"
}

resolve_dev_pod_node() {
  if [[ -n "${DEV_POD_NODE:-}" ]]; then
    if ! kubectl get node "$DEV_POD_NODE" &>/dev/null; then
      echo "错误: DEV_POD_NODE=$DEV_POD_NODE 在集群中不存在" >&2
      exit 1
    fi
    echo "$DEV_POD_NODE"
    return
  fi
  local name
  for name in "$(hostname -f 2>/dev/null || true)" "$(hostname)" "$(hostname -s 2>/dev/null || true)"; do
    [[ -z "$name" ]] && continue
    if kubectl get node "$name" &>/dev/null; then
      echo "$name"
      return
    fi
  done
  echo "错误: 本机 hostname 与集群节点名不一致。请设置 DEV_POD_NODE 为 kubectl get nodes 中的节点名" >&2
  exit 1
}

cmd_create() {
  require_kubectl
  write_dev_pod_manifest "$(resolve_dev_pod_node)" | kubectl apply -f -
}

cmd_delete() {
  require_kubectl
  kubectl delete pod -n "$NS" "$DEV_POD"
}

get_svc_nodeport() {
  kubectl get svc console-service -n "$NS" -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || true
}

managed_nodeport_annotation() {
  kubectl get svc console-service -n "$NS" -o go-template="{{index .metadata.annotations \"${ANNOTATION_MANAGED_NODEPORT}\"}}" 2>/dev/null || true
}

cmd_activate() {
  require_kubectl
  kubectl patch svc console-website -n "$NS" --type merge \
    -p '{"spec":{"selector":{"app":"console-website-dev"}}}'

  local np
  np="$(get_svc_nodeport)"
  if [[ -z "$np" ]]; then
    kubectl patch svc console-service -n "$NS" --type=json \
      -p='[{"op":"replace","path":"/spec/type","value":"NodePort"},{"op":"add","path":"/spec/ports/0/nodePort","value":30001}]' \
      2>/dev/null \
      || kubectl patch svc console-service -n "$NS" --type=json \
        -p='[{"op":"replace","path":"/spec/type","value":"NodePort"},{"op":"replace","path":"/spec/ports/0/nodePort","value":30001}]'
    kubectl annotate svc console-service -n "$NS" "${ANNOTATION_MANAGED_NODEPORT}=true" --overwrite
  fi
}

cmd_deactivate() {
  require_kubectl
  kubectl patch svc console-website -n "$NS" --type merge \
    -p '{"spec":{"selector":{"app":"console-website"}}}'

  if [[ "$(managed_nodeport_annotation)" == "true" ]]; then
    kubectl patch svc console-service -n "$NS" --type=json \
      -p='[{"op":"remove","path":"/spec/ports/0/nodePort"}]' 2>/dev/null || true
    kubectl patch svc console-service -n "$NS" --type merge -p '{"spec":{"type":"ClusterIP"}}'
    kubectl annotate svc console-service -n "$NS" "${ANNOTATION_MANAGED_NODEPORT}-"
  fi
}

kill_vite_process() {
  pkill -f '[n]ode.*vite' 2>/dev/null || true
  pkill -f '[/]vite' 2>/dev/null || true
  pkill -f 'vite\.mjs' 2>/dev/null || true
  pkill -f 'bin/vite' 2>/dev/null || true
  pkill -f vite 2>/dev/null || true
  sleep 1
}

cmd_kill() {
  kill_vite_process
}

ensure_dev_pod_exists() {
  kubectl get pod -n "$NS" "$DEV_POD" &>/dev/null || {
    echo "错误: Pod $DEV_POD 不存在，请先执行: $0 create" >&2
    exit 1
  }
}

parse_optional_detach() {
  DETACH=false
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -d) DETACH=true; shift ;;
      *)
        echo "错误: 未知选项: $1（仅支持 -d）" >&2
        exit 1
        ;;
    esac
  done
}

cmd_start() {
  parse_optional_detach "$@"
  require_kubectl
  kill_vite_process
  ensure_dev_pod_exists
  if [[ "$DETACH" == true ]]; then
    kubectl exec -n "$NS" "$DEV_POD" -c "$DEV_CONTAINER" -- bash -lc 'cd /app && nohup npm run start &'
  else
    kubectl exec -it -n "$NS" "$DEV_POD" -c "$DEV_CONTAINER" -- bash -lc 'cd /app && exec npm run start'
  fi
}

cmd_build() {
  parse_optional_detach "$@"
  require_kubectl
  ensure_dev_pod_exists
  if [[ "$DETACH" == true ]]; then
    kubectl exec -n "$NS" "$DEV_POD" -c "$DEV_CONTAINER" -- bash -lc 'cd /app && nohup npm run build &'
  else
    kubectl exec -n "$NS" "$DEV_POD" -c "$DEV_CONTAINER" -- bash -lc 'cd /app && exec npm run build'
  fi
}

cmd_preview() {
  parse_optional_detach "$@"
  require_kubectl
  kill_vite_process
  ensure_dev_pod_exists
  if [[ "$DETACH" == true ]]; then
    kubectl exec -n "$NS" "$DEV_POD" -c "$DEV_CONTAINER" -- bash -lc 'cd /app && nohup npm run preview &'
  else
    kubectl exec -n "$NS" "$DEV_POD" -c "$DEV_CONTAINER" -- bash -lc 'cd /app && exec npm run preview'
  fi
}

case "${1:-}" in
  create) cmd_create ;;
  delete) cmd_delete ;;
  activate) cmd_activate ;;
  deactivate) cmd_deactivate ;;
  start) shift; cmd_start "$@" ;;
  build) shift; cmd_build "$@" ;;
  preview) shift; cmd_preview "$@" ;;
  kill) cmd_kill ;;
  *) usage >&2; exit 1 ;;
esac
