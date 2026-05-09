## console-website-dev 开发 Pod 使用指南

1. 选择 openFuyao 集群中的某一节点作为开发节点，使用 vscode ssh 连接，克隆 console-website 代码。

2. 浏览器打开该节点上的管理面，完成一次登录，不要退出登录以在本地保留 Cookie 令牌。

3. 在仓库根目录创建console-website-dev 开发 Pod：

   ```bash
   bash ./hack/dev-pod.sh create
   ```

4. 执行命令启用开发 Pod 后，浏览器访问同地址下的 30001 端口

   ```bash
   bash ./hack/dev-pod.sh activate
   bash ./hack/dev-pod.sh exec
   ```

   > 执行 `activate` 时，将把 `app=console-website` 改为指向 `console-website-dev`，并启用 `console-servive` 的 NodePort
   > 由于 openFuyao ingress 对请求速率有限制，无法支撑开发态大量前端静态资源请求，因此再通过节点 IP + `console-service` 的 NodePort 访问后端

5. 开发结束后， `ctrl+d` 退出容器，执行 `./hack/dev-pod.sh deactivate` 恢复集群配置。