# 原神 UID-展柜 查询工具

一款面向私人使用的本地原神展柜数据查询工具，基于 **B/S 架构**（FastAPI + React + SQLite）构建。  
起因是某次我朋友使用的查询小程序崩溃了，向我吐槽说，要查看自己的角色信息还要启动游戏，太麻烦，正好有这个作业，就做了。
---

## 功能特性

### 核心功能

| 功能 | 说明 |
|------|------|
| **在线查询** | 输入 UID，通过 Enka Network API 抓取玩家展柜最新数据 |
| **本地缓存** | 查询成功后自动持久化到 SQLite，后续可直接从本地加载 |
| **历史记录** | 展示所有查询过的 UID，点击即可快速加载本地缓存 |
| **数据刷新** | 支持对单个 UID 重新从 Enka 拉取最新数据 |
| **数据分析** | 基于 SQL 对展柜数据进行统计分析（角色等级/命座/武器/圣遗物等） |

### 管理员功能

| 功能 | 说明 |
|------|------|
| **身份识别** | 使用 9 位 UID 进行身份验证，普通用户只能访问自己的数据 |
| **权限管理** | 管理员可授予其他用户管理员权限 |
| **全玩家统计** | 查看所有玩家的深渊数据分布（最深层数/星章数/危战层数） |
| **全角色统计** | 按角色查看全服持有率、平均等级、平均命座数 |
| **修改数据** | 可以对用户的数据进行操作

### 缓存机制

- **5 分钟内存缓存**：同一 UID 在 5 分钟内的重复查询直接返回缓存，避免频繁请求 Enka
- **数据库持久化**：所有查询结果永久保存到 SQLite，支持离线加载

---

## 技术架构

### 技术栈

```
后端
├── FastAPI          # Web 框架
├── SQLAlchemy       # ORM（异步模式）
├── aiohttp           # 异步 HTTP 客户端（Enka API）
├── SQLite           # 本地数据库
└── Uvicorn           # ASGI 服务器

前端
├── React 18          # UI 框架
├── TypeScript        # 类型安全
├── Vite              # 构建工具
├── Tailwind CSS      # 样式框架
├── Recharts          # 图表可视化
└── Axios             # HTTP 客户端

第三方 API
└── Enka Network      # 原神展柜数据来源
```

### 项目结构

```
genshin-uid-tool/
├── backend/                 # FastAPI 后端服务
│   ├── app/
│   │   ├── routers/         # API 路由
│   │   ├── models.py        # 数据库模型（10 张表）
│   │   ├── schemas.py       # Pydantic 数据模型
│   │   ├── crud.py          # 数据库操作与统计分析
│   │   ├── crawler.py       # Enka 数据抓取与解析
│   │   └── database.py      # 数据库连接配置
│   ├── run.py               # 后端启动入口
│   └── genshin.db           # SQLite 数据库文件
│
├── frontend/                # React 前端应用
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面组件
│   │   ├── lib/              # 工具函数（API 封装）
│   │   └── types/            # TypeScript 类型定义
│   ├── dist/                 # 构建产物（后端直接托管）
│   └── package.json
│
├── resources/               # 静态资源与配置数据
│   ├── TextMapCHS.json      # 中文文本映射
│   ├── characters.json      # 角色基础数据
│   └── *ExcelConfigData*.json  # 游戏配置数据
│
└── start_app.bat            # Windows 双击启动入口
```

---

## 数据库设计

### 数据表关系

```
BaseIndex (玩家基础信息)
    │
    ├── AbyssIndex (深渊信息)       [1:1 by UID]
    │
    └── CharacterBaseIndex (角色基础信息)   [1:N by UID]
              │
              ├── CharacterAttributeIndex (角色属性) [1:1 by UID+角色ID]
              ├── CharacterWeaponIndex (角色武器)   [1:1 by UID+角色ID]
              │
              └── CharacterReliquery (圣遗物)       [1:N by UID+角色ID]
                        │
                        └── ReliquerySubStat (圣遗物副词条) [1:N by UID+角色ID+部位]

DictCharacter (角色字典)  [查找表 by 角色ID]
DictWeapon (武器字典)     [查找表 by 武器ID]
Controller (管理员控制表)  [by UID]
```

### 更新策略

| 数据类型 | 更新逻辑 |
|----------|----------|
| **玩家基础信息** | 按 UID 覆盖更新 |
| **角色信息** | 按 UID + 角色ID 新增或更新，不删除旧角色 |
| **圣遗物** | 按 UID + 角色ID + 部位覆盖当前角色的本次抓取结果 |
| **last_updated** | 所有核心表均携带时间戳，记录最后更新时间 |

---

## 页面功能

### 1. 查询数据页面
- 输入 9 位 UID 并提交查询
- 展示玩家基础信息、深渊信息、角色列表
- 每个角色卡片包含等级、突破、命座、武器、圣遗物详情

### 2. 历史记录页面
- 显示所有已查询过的 UID 列表（昵称、UID、最后更新时间）
- 点击记录直接从本地缓存加载（无需网络请求）
- 每条记录提供「刷新」按钮，重新拉取 Enka 最新数据

### 3. 数据分析页面
- **概览统计**：角色数量、平均等级、平均命座数、最近更新时间
- **角色等级分布**：柱状图展示各等级角色数量
- **命座分布**：0~6 命各有多少角色
- **武器稀有度统计**：5 星/4 星武器数量
- **圣遗物套装 Top 5**：使用最频繁的圣遗物套装

### 4. 管理员页面（仅管理员可见）
- **全玩家统计**：所有玩家的深渊数据分布
- **全角色统计**：按角色查看全服数据（需先选择角色）

---

## 本地启动

### 方式一：双击启动（推荐）

```
双击项目根目录下的 start_app.bat
```

### 方式二：命令行启动

```powershell
.\start_app.bat
```

### 方式三：手动启动

```powershell
# 后端
cd backend
python run.py

# 前端（如需独立开发）
cd frontend
npm install
npm run build
```

### 访问地址

启动后浏览器打开：**http://127.0.0.1:8000**

---

## 首次启动流程

1. **环境检查**：自动检测并创建 `.venv`
2. **依赖安装**：自动安装后端依赖
3. **前端构建**：如检测到 `frontend/dist` 不存在，自动执行 `npm run build`
4. **服务启动**：后端监听 8000 端口，并托管前端静态页面

---

## 常见问题

### 1. 查询时报错

- 确认网络可以访问 Enka Network（`https://enka.network`）
- 查看后端控制台是否有异常输出

### 2. 页面打不开

- 确认 `start_app.bat` 窗口仍在运行
- 手动访问 `http://127.0.0.1:8000`

### 3. 历史记录没有更新

- 只有查询成功（Enka 返回数据）才会写入数据库
- 历史列表从本地 SQLite 读取，不会凭空生成

### 4. 提示"UID 格式错误"

- UID 必须为 9 位数字

### 5. 想成为管理员

- 联系现有管理员，由管理员授予权限

---

## 开发说明

### API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/session/{uid}` | 身份识别 |
| POST | `/api/fetch-uid` | 查询 UID（优先缓存，5分钟有效） |
| POST | `/api/refresh/{uid}` | 强制刷新 UID 数据 |
| GET | `/api/player/{uid}` | 从本地缓存读取 |
| GET | `/api/history` | 获取历史记录 |
| GET | `/api/analysis/{uid}` | 获取数据分析 |
| POST | `/api/admin/grant-admin` | 授予管理员权限 |
| GET | `/api/admin/player-stats` | 全玩家统计 |
| GET | `/api/admin/character-options` | 全角色统计-角色列表 |
| GET | `/api/admin/character-stats/{id}` | 全角色统计数据 |

### 前端开发

> 注意：当前本地使用方案不是单独跑前端开发服务器，而是由后端直接读取 `frontend/dist`。
>
> 前端修改后需要重新执行 `npm run build` 才能生效。

---

## 相关资源

- [Enka Network API 文档](https://github.com/EnkaNetwork/API-docs)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 文档](https://react.dev/)

---

## 项目结构详解

详见：`structure.md`
