---
name: "dev-standard"
description: "TRAE开发规范SKILL：代码备份、需求文档修订、功能测试、版本维护。每次修改前自动备份代码，修订需求文档，使用测试数据验证功能，完成后维护版本和说明文档。"
---

# TRAE开发规范

## 概述

本SKILL定义了TRAE开发的标准工作流程，确保代码变更的可追溯性、可回退性和质量保证。

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

- 创建测试数据目录：`.trae/test-data/`
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

更新以下文件的版本号：

1. `package.json` - 版本字段
2. `index.html` - meta version标签
3. `README.md` - 更新记录

#### 4.2 更新记录格式

在README.md中添加更新记录：

```markdown
## 更新记录

### v<版本号> (YYYY-MM-DD)
- <更新内容1>
- <更新内容2>
- <更新内容3>
```

#### 4.3 使用说明修订

根据新增功能，更新README.md中的使用说明部分。

## 开发检查清单

每次开发任务完成后，确认以下检查项：

- [ ] 代码已备份
- [ ] 需求文档已更新
- [ ] 测试数据已准备
- [ ] 功能测试已通过
- [ ] 版本号已更新
- [ ] 更新记录已添加
- [ ] 使用说明已修订

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
```

### 目录结构

```
.trae/
├── skills/
│   └── dev-standard/
│       └── SKILL.md
├── documents/
│   └── <feature-name>-requirement.md
├── test-data/
│   └── <test-data-files>
└── backups/
    └── backup-<timestamp>.zip
```