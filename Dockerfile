# ============================================================================
# BI 低代码平台 - 前端 Dockerfile (多阶段构建)
# ============================================================================
# 构建阶段: Node.js 编译 Vue3 项目
# 运行阶段: Nginx 静态文件服务
# ============================================================================

# ---------- 构建阶段 ----------
FROM node:20-alpine AS builder
WORKDIR /app

# 先拷贝依赖清单,利用 Docker 缓存
COPY package*.json ./
RUN npm ci

# 拷贝源码并构建
COPY . .
RUN npm run build

# ---------- 运行阶段 ----------
FROM nginx:alpine

# 拷贝构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 拷贝 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
