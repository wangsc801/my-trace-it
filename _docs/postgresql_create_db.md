# PostgreSQL 数据库创建脚本

以下为建库脚本 `postgresql_create_db.sql` 的内容与逐项参数说明：

```sql
CREATE DATABASE my_trace_it
  WITH ENCODING 'UTF8'
  LC_COLLATE = 'zh_CN.utf8'
  LC_CTYPE = 'zh_CN.utf8'
  TEMPLATE = template0;
```

## 用途

初始化 my-trace-it 后端所需的数据库实例。应用侧的表由 Spring Boot + Hibernate 自动创建（`spring.jpa.hibernate.ddl-auto=update`，见后端 `application.properties`），因此本脚本**只负责在建库这一层**，不包含任何表结构。

## 参数详解

| 参数 | 值 | 说明 |
| --- | --- | --- |
| `CREATE DATABASE 数据库名` | `my_trace_it` | 要创建的库名，与后端数据源 `jdbc:postgresql://…/my_trace_it` 保持一致。 |
| `WITH` | — | 引入后续的可选参数列表。 |
| `ENCODING` | `'UTF8'` | 数据库字符编码，UTF-8。与应用侧的 JSON 中文内容（日程、日记）配套，避免乱码。 |
| `LC_COLLATE` | `'zh_CN.utf8'` | 排序规则（collation），决定比较/排序时的字符顺序。指定中文 locale 使字符串排序贴近中文习惯。 |
| `LC_CTYPE` | `'zh_CN.utf8'` | 字符分类（ctype），决定哪些字符属于字母/数字/大小写归类，用于大小写与正则等行为。 |
| `TEMPLATE` | `template0` | 从哪种模板建库。用 `template0` 可避开 `template1` 中可能已带的自定义对象/编码限制，保证按指定 `ENCODING`/`LC_*` 干净建库。 |

## 使用方式

**方案一：psql 直接执行**

```bash
psql -U postgres -h localhost -f postgresql_create_db.sql
```

数据库若已存在会报错（`already exists`），属于正常现象，属幂等性外的重新执行场景。

**方案二：把脚本内容作为输入（需先建库后连接）**

```bash
psql -U postgres -h localhost -c "SELECT 1" postgres
```

> 注意：`LC_COLLATE`/`LC_CTYPE` 需宿主机（或容器内）PostgreSQL 已支持 `zh_CN.utf8` locale。若使用 Docker 官方镜像，默认容器内**未生成该 locale**，直接执行会报 `invalid locale name`。此时有两种做法：
> 1. 建库时省略 `LC_*` 两个参数，采用系统默认 locale（推荐、改动最小）；
> 2. 预先在容器内 `locale-gen` 生成对应 locale。
>
> 本项目的 Docker 编排（`docker-compose.yml`）并未依赖本脚本建库，而是由 `postgres` 镜像的 `POSTGRES_DB=my_trace_it` 环境变量自动建库，因此这里主要面向手工初始化或非容器场景。