---
name: "dev-standard"
description: "TRAE开发规范SKILL：代码备份、需求文档修订、功能测试、版本维护。每次修改前自动备份代码，修订需求文档，使用测试数据验证功能，发布前必须获得用户确认。作为基础规范被task-organizer、code-writer、code-reviewer三个角色SKILL引用。"
---

# TRAE开发规范

## 概述

本SKILL定义了TRAE开发的标准工作流程，确保代码变更的可追溯性、可回退性和质量保证。**关键原则：不允许TRAE自行决定发布，每次发布到GitHub之前必须通过交互获得用户确认。**

本SKILL作为基础规范，被以下三个角色SKILL共同引用：
- **task-organizer**：负责任务组织和管理，输出结构化任务清单
- **code-writer**：负责代码编写和实现，遵循备份和测试流程
- **code-reviewer**：负责代码审核和质量保障，确保代码达到生产标准

## 工作流程

### 1. 代码备份阶段

在进行任何代码修改之前，必须先对现有代码进行备份。

#### 1.1 备份策略

- **备份时机**：每次修改代码之前
- **备份方式**：
  - 如果环境支持Git：使用Git创建提交/标签
  - 如果环境不支持Git：使用时间戳压缩归档
- **备份范围**：
  - 源代码文件（src/, assets/, lib/等）
  - 配置文件（package.json, vite.config.js等）
  - 文档文件（README.md, 需求文档等）
  - **排除**：node_modules, .git, dist, build等可重新生成的目录

#### 1.2 备份操作

**方式一：使用Git（推荐）**

```bash
# 检查Git是否可用
git --version

# 创建备份提交
git add -A
git commit -m "backup: 代码备份 before <修改描述>"
git tag -a v<version>-backup -m "Backup before modification"
```

**方式二：使用压缩归档（无Git环境）**

```bash
# 创建备份目录
mkdir -p .trae/backups

# 创建时间戳备份（排除依赖目录）
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupName = "backup-$timestamp.zip"

# 压缩源代码（排除node_modules, .git, dist）
Compress-Archive -Path "src","assets","lib","*.json","*.md","*.html" -DestinationPath ".trae/backups/$backupName"
```

### 2. 需求文档修订阶段

对于新的修改需求，必须更新需求设计文档。

#### 2.1 文档位置

- 需求文档：`.trae/documents/` 目录下
- 文件命名：`<feature-name>-requirement.md`

#### 2.2 文档内容

需求文档应包含：

```markdown
# <功能名称>需求文档

## 需求概述
<简要描述需求背景和目标>

## 需求来源
<用户输入原文或问题描述>

## 功能说明
- <功能点1>
- <功能点2>
- <功能点3>

## 技术方案
<实现思路和技术选型>

## 影响范围
- 修改的文件列表
- 涉及的模块
- 潜在风险

## 验收标准
<功能验证的具体标准>
```

### 3. 功能测试阶段

新代码完成后，必须使用测试数据进行基本功能测试。

#### 3.1 测试数据准备

- 创建测试数据目录：`data4test/`
- 测试数据应覆盖：
  - 正常场景
  - 边界条件
  - 异常情况

#### 3.2 测试方式

**自动化测试（如果项目支持）**：

```bash
npm run test
# 或
yarn test
```

**手动测试**：

1. 启动开发服务器
2. 使用测试数据进行功能验证
3. 记录测试结果

#### 3.3 测试记录

在需求文档中添加测试记录：

```markdown
## 测试记录

| 测试项 | 测试数据 | 预期结果 | 实际结果 | 状态 |
|--------|----------|----------|----------|------|
| <测试项1> | <数据描述> | <预期行为> | <实际行为> | ✅/❌ |
| <测试项2> | <数据描述> | <预期行为> | <实际行为> | ✅/❌ |
```

### 4. 版本维护阶段

成品完成后，进行版本更新和使用说明修订。

#### 4.1 版本更新

**⚠️ 关键要求：必须更新所有版本号标识，确保一致性。**

更新以下文件的版本号：

| 文件 | 位置 | 更新内容 |
|------|------|----------|
| `package.json` | `version` 字段 | `"version": "1.8.1"` |
| `index.html` | `<meta name="version">` | `content="1.8.1"` |
| `index.html` | 页面底部版本信息 | `版本：1.8.1 | 更新日期：YYYY-MM-DD` |
| `README.md` | 更新记录部分 | 添加新版本更新记录 |
| `CHANGELOG.md` | 更新记录部分 | 添加新版本更新记录 |
| `DESIGN_REQUIREMENTS.md` | 版本历史表格 | 添加新版本条目 |
| `DESIGN_REQUIREMENTS.md` | 文档版本信息 | 更新文档版本和适用版本 |

#### 4.2 版本号一致性检查

**发布前必须执行版本号一致性检查！**

```bash
# 检查所有版本号是否一致
echo "=== 版本号一致性检查 ==="

# 检查package.json
echo "package.json: $(cat package.json | grep -o '"version": "[^"]*"' | cut -d'"' -f4)"

# 检查index.html meta版本
echo "index.html (meta): $(grep -o 'content="[0-9]*\.[0-9]*\.[0-9]*"' index.html | head -1 | cut -d'"' -f2)"

# 检查index.html 底部版本
echo "index.html (footer): $(grep -o '版本：[0-9]*\.[0-9]*\.[0-9]*' index.html | cut -d'：' -f2)"

# 检查README.md最新版本
echo "README.md: $(grep -o '\[1\.[0-9]*\.[0-9]*\]' README.md | head -1 | tr -d '[]')"

# 检查CHANGELOG.md最新版本
echo "CHANGELOG.md: $(grep -o '\[1\.[0-9]*\.[0-9]*\]' CHANGELOG.md | head -1 | tr -d '[]')"
```

**检查标准**：所有版本号必须完全一致，否则禁止发布！

#### 4.3 更新记录格式

在README.md中添加更新记录：

```markdown
## 更新记录

### v<版本号> (YYYY-MM-DD)
- <更新内容1>
- <更新内容2>
- <更新内容3>
```

在CHANGELOG.md中添加更新记录：

```markdown
## [<版本号>] - YYYY-MM-DD

### 功能增强
- <更新内容1>

### 修复问题
- <更新内容2>

### 测试框架
- <更新内容3>

### 开发规范
- <更新内容4>
```

在DESIGN_REQUIREMENTS.md中更新版本历史表格：

```markdown
| 版本 | 日期 | 主要更新 |
| :--- | :--- | :--- |
| <版本号> | YYYY-MM-DD | <更新摘要> |
```

并更新文档版本信息：

```markdown
**文档版本**: vX.Y  
**生成日期**: YYYY-MM-DD  
**适用版本**: CSV可视化工具 v<版本号>
```

#### 4.4 使用说明修订

根据新增功能，更新README.md和usage.html中的使用说明部分。

### 5. 发布确认阶段（关键步骤）

**⚠️ 重要原则：不允许TRAE自行决定发布。**

在执行任何发布操作之前，必须通过交互获得用户确认。

#### 5.1 发布前检查清单

在请求用户确认之前，必须完成以下检查：

- [ ] 代码已备份
- [ ] 需求文档已更新
- [ ] 测试数据已准备
- [ ] 功能测试已通过
- [ ] **版本号已更新（所有文件一致）**
  - [ ] `package.json` version字段
  - [ ] `index.html` meta version标签
  - [ ] `index.html` 页面底部版本信息
  - [ ] `README.md` 更新记录
  - [ ] `CHANGELOG.md` 更新记录
  - [ ] `DESIGN_REQUIREMENTS.md` 版本历史和文档版本信息
- [ ] **版本号一致性检查已通过**
- [ ] 更新记录已添加
- [ ] 使用说明已修订
- [ ] 构建成功（npm run build 通过）
- [ ] 代码审核已通过（code-reviewer SKILL）

#### 5.2 发布确认流程

**步骤1：汇总发布信息**

向用户展示以下信息：

```
📋 发布确认

版本号：v<版本号>
发布日期：YYYY-MM-DD

修改的文件：
- <文件1>
- <文件2>
- <文件3>

更新内容：
- <更新内容1>
- <更新内容2>
- <更新内容3>

是否确认发布到GitHub？
```

**步骤2：使用AskUserQuestion工具确认**

必须使用AskUserQuestion工具获得用户明确确认后才能执行发布操作。

**步骤3：执行发布**

获得用户确认后，执行以下操作：

```bash
# 提交代码
git add .
git commit -m "v<版本号>: <更新描述>"

# 推送到main分支
git push origin main

# 构建项目
npm run build

# 部署到GitHub Pages
npx gh-pages -d dist -f
```

#### 5.3 禁止的操作

以下操作必须获得用户明确授权，严禁自行执行：

- ❌ 禁止自行执行 `git push` 命令
- ❌ 禁止自行执行 `gh-pages` 部署命令
- ❌ 禁止使用 `-f` 或 `--force` 参数进行强制推送
- ❌ 禁止删除远程分支
- ❌ 禁止修改GitHub仓库配置

#### 5.4 发布失败处理

如果发布失败：

1. 向用户报告错误信息
2. 分析失败原因
3. 提出解决方案
4. 等待用户确认后再重试

## 开发流程整合

### 完整开发流水线

```
用户需求 → task-organizer → code-writer → code-reviewer → dev-standard → 用户确认 → 发布
              ↓                ↓                ↓                ↓
          需求分析          代码编写          代码审核          版本维护
          任务拆分          功能测试          质量保障          发布确认
```

### 各阶段职责

| 阶段 | SKILL | 职责 | 输出 |
|------|-------|------|------|
| 1. 任务组织 | task-organizer | 需求分析、任务拆分、优先级排序 | 任务清单 |
| 2. 代码编写 | code-writer | 代码实现、功能测试、代码提交 | 代码实现 |
| 3. 代码审核 | code-reviewer | 代码审查、问题反馈、质量保障 | 审核报告 |
| 4. 版本维护 | dev-standard | 版本更新、文档修订、发布确认 | 发布版本 |

### 协作协议

1. **task-organizer → code-writer**：输出结构化任务清单，code-writer按清单执行
2. **code-writer → code-reviewer**：提交代码和测试报告，code-reviewer进行审核
3. **code-reviewer → code-writer**：输出审核报告和问题清单，code-writer修复问题
4. **所有SKILL → dev-standard**：遵循备份、测试、发布确认流程

## 开发检查清单

每次开发任务完成后，确认以下检查项：

- [ ] 代码已备份
- [ ] 需求文档已更新
- [ ] 测试数据已准备
- [ ] 功能测试已通过
- [ ] **版本号已更新（所有文件一致）**
  - [ ] `package.json`
  - [ ] `index.html` (meta)
  - [ ] `index.html` (footer)
  - [ ] `README.md`
  - [ ] `CHANGELOG.md`
  - [ ] `DESIGN_REQUIREMENTS.md`
- [ ] **版本号一致性检查已通过**
- [ ] 更新记录已添加
- [ ] 使用说明已修订
- [ ] 构建成功
- [ ] 代码审核已通过
- [ ] **获得用户发布确认**

## 异常处理

### 备份失败

如果备份失败，立即停止修改并排查原因：

1. 检查磁盘空间
2. 检查文件权限
3. 尝试手动备份

### 测试失败

如果测试失败：

1. 分析失败原因
2. 修复代码
3. 重新测试
4. 如果多次失败，考虑回退到备份版本

### 审核失败

如果代码审核失败：

1. 根据审核报告修复问题
2. 重新提交审核
3. 确保所有严重问题已解决

### 发布失败

如果发布失败：

1. 向用户报告错误信息
2. 分析失败原因
3. 提出解决方案
4. 等待用户确认后再重试

### 回退操作

**Git环境**：

```bash
git checkout <backup-commit-hash>
```

**压缩归档环境**：

```bash
# 解压备份文件
Expand-Archive -Path ".trae/backups/<backup-file>.zip" -DestinationPath "." -Force
```

## 最佳实践

1. **小步提交**：每次修改保持最小化，便于回退
2. **清晰注释**：代码中添加必要的注释说明
3. **文档同步**：代码和文档保持同步更新
4. **测试先行**：先编写测试用例，再实现功能
5. **定期备份**：即使没有修改，也建议定期备份
6. **确认发布**：发布前必须获得用户明确确认
7. **角色分离**：不同SKILL负责不同职责，确保关注点分离

## 附录

### 常用命令

```bash
# 查看Git日志
git log --oneline -10

# 创建Git标签
git tag -a v1.0.0 -m "Version 1.0.0"

# 查看标签列表
git tag -l

# 创建压缩备份（PowerShell）
Compress-Archive -Path "src","assets","*.json" -DestinationPath ".trae/backups/backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').zip"

# 解压备份（PowerShell）
Expand-Archive -Path ".trae/backups/<backup-file>.zip" -DestinationPath "." -Force

# 构建项目
npm run build

# 预览构建结果
npm run preview
```

### 目录结构

```
.trae/
├── skills/
│   ├── dev-standard/
│   │   └── SKILL.md
│   ├── task-organizer/
│   │   └── SKILL.md
│   ├── code-writer/
│   │   └── SKILL.md
│   └── code-reviewer/
│       └── SKILL.md
├── documents/
│   └── <feature-name>-requirement.md
├── tasks/
│   └── <version>-task-list.md
├── reviews/
│   └── <task-id>-review-report.md
├── test-data/
│   └── <test-data-files>
└── backups/
    └── backup-<timestamp>.zip
```