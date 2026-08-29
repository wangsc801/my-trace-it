# my trace it

## 致谢与说明

本项目始于对 **traced-it**（[traced-it-android](https://github.com/traced-it/traced-it-android)）这款 Android 随手记应用的使用。traced-it 让我得以几乎零负担地记录日常活动，并据此反复审视自己在时间安排上的不足——这份使用感受正是本项目的出发点，在此谨向原作的设计与工程付出致以诚挚感谢。

需要坦白的是，此个人应用在最初立项时使用"Trace It"的表达。直到提笔撰写这份 README，我才注意到原作实为 **traced-it** 而非 trace-it。彼时项目已具备完整目录结构与工程配置，整体改名意味着大量连带的路径与配置调整，为求稳落地，最终维持 `my-trace-it` 之名——此处特作澄清，绝无借原作名号行攀附之意。

在实现形态上，二者亦截然不同：traced-it 是本地运行的 Android 应用，而 my-trace-it 采用 **B/S** 架构，前端为浏览器访问的 SPA，后端为独立的 Spring Boot 服务与 PostgreSQL 数据库，定位与实现路径均无重合，不存在侵权或搭车之说。本次将代码上传至 GitHub， **仅仅**是为了尝试 Docker 化部署并沉淀工程实践，并 **无意借此** 与原项目产生任何实质关联、攀附或冲突。

本项目前端浏览器标签页的 favicon 直接沿用了 [traced-it-android](https://github.com/traced-it/traced-it-android) 项目的原始图标。这一做法纯粹出于 **临时辨识目的** ，避免误操作。

需要强调的是：

1. **非商业性**：此 favicon 仅用于个人开发环境及本地演示，未以任何形式投入生产或商业分发；
2. **非归属声明**：该图标的完整知识产权归 traced-it 原作者所有，本项目不主张任何权利；
3. **临时性**：待项目基本功能稳定后，将替换为独立设计的自定义图标；

若原作者或任何用户认为此举有所不妥，敬请在 GitHub Issues 中提出，我将**第一时间移除或替换**该 favicon，绝不拖延。

在此再次感谢[traced-it-android](https://github.com/traced-it/traced-it-android)带来的启发与帮助。

以下为项目本身的说明。

时间 / 日程追踪应用（Trace It）。前端 React Router v8 SPA + 后端 Spring Boot，前后端分离：

```
frontend/    React Router v8 + React 19 + Tailwind v4（包管理器：bun）
backend/     Spring Boot 4 + PostgreSQL + Spring Security (JWT)
```

## 环境要求

- **前端**：Node.js ≥ 20，bun（已用 `bun.lock` 锁定依赖）
- **后端**：JDK 25，Maven 通过 `mvnw.cmd` 包装器自动下载
- **数据库**：PostgreSQL（默认 `jdbc:postgresql://localhost:5432/my_trace_it`，用户/密码均为 `postgres`，可用环境变量覆盖，见下文）

## 构建

### 1. 前端 build

前端为 **SPA 模式**（`react-router.config.ts` 中 `ssr: false`），build 只产出纯静态客户端资源，不含 server。

```bash
cd frontend
bun install          # 首次拉取依赖
bun run build        # 产物输出到 frontend/build/（静态资源）
```

> 生产环境前端若与后端分离部署，需要在 build 前指定后端地址，否则运行时 API 请求会指向前端自身同源（`/api` 无代理会 404）：
>
> ```bash
> VITE_API_BASE_URL=http://你的后端地址:8080 bun run build
> ```

预览生产构建（本地，用任意静态服务器托管 `build/client` 即可，如 vite preview）：
```bash
bun run start        # 等价于 vite preview --outDir build/client
```

### 2. 后端 bootJar

```bash
cd backend
cmd //c ".\mvnw.cmd bootJar"      # Windows（cmd/PowerShell 亦可直接 .\mvnw.cmd bootJar）
```

也可直接打包全量可执行 jar：
```bash
.\mvnw.cmd clean package
```

产物：`backend/target/my-trace-it-0.0.1-SNAPSHOT.jar`

## 启动

启动时**必须**提供管理员初始密码环境变量 `ADMIN_PASSWORD`（缺失会直接报错退出）。每次启动会把管理员账号（默认 `admin`）的密码重置为该值，因此管理员凭据按次启动确定。可选 `ADMIN_USERNAME` 自定义管理员用户名（默认 `admin`）。

不同 shell 的命令行写法：

**Git Bash / MSYS / Linux/macOS：**
```bash
cd backend
ADMIN_PASSWORD='你的管理密码' java -jar target/my-trace-it-0.0.1-SNAPSHOT.jar
```

**Windows cmd：**
```bat
cd backend
set ADMIN_PASSWORD=你的管理密码
java -jar target\my-trace-it-0.0.1-SNAPSHOT.jar
```

**PowerShell：**
```powershell
cd backend
$env:ADMIN_PASSWORD = '你的管理密码'
java -jar .\target\my-trace-it-0.0.1-SNAPSHOT.jar
```

用 `set` / `$env:` 设置的环境变量只对当前命令行窗口进程生效，关掉窗口即失效——即"临时的管理员密码环境变量"。

默认监听 `http://localhost:8080`。

### 后端环境变量一览

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 必填 | 管理员初始密码（每次启动重置） |
| `ADMIN_USERNAME` | `admin` | 管理员账号 |
| `DB_URL` | `jdbc:postgresql://localhost:5432/my_trace_it` | 数据源地址 |
| `DB_USERNAME` | `postgres` | 数据库用户 |
| `DB_PASSWORD` | `postgres` | 数据库密码 |
| `JWT_SECRET` | 开发用默认值 | JWT 签名密钥，生产环境务必覆盖（≥32 字节） |
| `JWT_EXPIRY_SECONDS` | `86400` | Token 有效期（秒） |
| `PORT` | `8080` | 服务端口 |

## Docker 模式

三容器编排（`docker-compose.yml` 位于仓库根目录）：独立前端 + 独立后端 + PostgreSQL。

| 服务 | 镜像/构建 | 宿主端口 → 容器 | 说明 |
| --- | --- | --- | --- |
| `db` | `postgres:16.2` | `5432` → 5432 | 数据卷 `pgdata` 持久化，`pg_isready` 健康检查 |
| `backend` | `eclipse-temurin:25-jdk`（`./mvnw package`） | **8832** → 8832 | 连 `db` 服务，`PORT=8832` |
| `frontend` | `oven/bun:1` 构建 + `nginx:alpine` | **8833** → 80 | 纯静态托管 `build/client`，SPA 路由回退 |

### 启动

后端必需 `ADMIN_PASSWORD`（缺失会直接报错退出）。用 `.env` 或命令行变量提供：

```bash
# 方式一：写入 .env（推荐）
echo "ADMIN_PASSWORD=你的管理密码" > .env
docker compose up -d --build

# 方式二：单次命令行变量
ADMIN_PASSWORD=你的管理密码 docker compose up -d --build
```

- 首次需 `--build` 构建镜像；之后可仅 `docker compose up -d`。
- 前端：`http://localhost:8833`；后端：`http://localhost:8832`；管理员账号默认 `admin`。
- 常用命令：`docker compose logs -f` 看日志；`docker compose down` 停止；`docker compose down -v` 停止并删除数据卷。

### Docker 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 必填 | 管理员初始密码（backend） |
| `ADMIN_USERNAME` | `admin` | 管理员账号（backend） |
| `POSTGRES_USER` | `postgres` | 数据库用户（db） |
| `POSTGRES_PASSWORD` | `postgres` | 数据库密码（db） |
| `POSTGRES_DB` | `my_trace_it` | 数据库名（db） |
| `JWT_SECRET` | 默认 48 字符值 | JWT 密钥（backend，注意改为随机值） |
| `VITE_API_BASE_URL` | `http://localhost:8833` | 前端构建时注入的后端地址 |

> `VITE_API_BASE_URL` 是按**本机访问**场景写死的默认值。若换域名/服务器访问，需在构建后端到地址写入镜像：
> ```bash
> docker compose build --build-arg VITE_API_BASE_URL=http://你的后端地址:8833 frontend
> docker compose up -d
> ```

## 开发模式

```bash
# 终端 1：后端
cd backend && cmd //c ".\mvnw.cmd -q spring-boot:run"

# 终端 2：前端（dev server 已把 /api 代理到 http://localhost:8080）
cd frontend && bun run dev
```