# PostgreSQL 数据备份与恢复

适用环境：my-trace-it 的 Docker 编排（`docker-compose.yml`），其中 Postgres 数据存放在命名卷 `pgdata`（宿主上由 Docker 管理，路径形如 `…/docker/volumes/<项目>_pgdata/_data`）。

## 推荐做法：逻辑备份（pg_dump）

用 `pg_dump` 做**逻辑备份**：
- 可在数据库**运行中**执行，无停机；
- 输出为标准 SQL / 自定义格式，**跨机器、跨版本可移植**；
- 不必直接触碰 Docker 管理的卷目录（运行中直接拷卷目录会产生不一致文件，且换机迁移麻烦），所以不推荐拷 `_data` 目录。

命令默认使用 compose 里默认的 `POSTGRES_USER=postgres`、`POSTGRES_DB=my_trace_it`。若你在 `.env` 覆盖过 `POSTGRES_USER` / `POSTGRES_DB`，请相应替换 `-U` 与 `-d`。

### 备份

**方式一：自定义格式（推荐）**

```bash
# 1) 在 db 容器内 dump 到 /tmp
docker compose exec db pg_dump -U postgres -d my_trace_it --format=custom --file=/tmp/backup.dump

# 2) 拷回宿主机（文件名带时间戳）
docker compose cp db:/tmp/backup.dump ./my-trace-it-$(date +%F_%H%M).dump
```

**方式二：纯 SQL 文本格式，一条命令重定向到宿主文件**

```bash
docker compose exec -T db pg_dump -U postgres -d my_trace_it > my-trace-it-$(date +%F_%H%M).sql
```

> `-T`（no TTY）用于关闭伪终端，使输出可安全地重定向/管道。

### 恢复

```bash
# 自定义格式（--clean 先清掉已存在对象，--if-exists 忽略缺失对象报错）
docker compose exec -T db pg_restore -U postgres -d my_trace_it --clean --if-exists < my-trace-it-XXXX.dump

# 纯 SQL 格式（先拷进容器，再在容器内执行）
docker compose cp my-trace-it-XXXX.sql db:/tmp/
docker compose exec db psql -U postgres -d my_trace_it -f /tmp/restore.sql
```

## 运维提示

- **定时备份**：在宿主机上配置计划任务（Linux cron / Windows 计划任务）定时执行上面的 `pg_dump`，保留近 7 天的归档，避免遗忘。
- **危险操作**：`docker compose down -v` 会**删除 `pgdata` 卷中的数据**。删卷前务必先完成备份。
- 对可用性要求更高的生产环境，可升级为 `pgBackRest`、时间点恢复（PITR）或块级快照，本文档仅覆盖日常最简方案。