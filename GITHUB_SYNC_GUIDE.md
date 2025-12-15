# GitHub 同步更新完整流程（本项目通用）

> 目标：你在本地（Synology / Linux / macOS）修改静态网页后，把改动**同步到 GitHub**。
>
> 核心动作只有两步：
> - **commit**：把改动记录成一个版本（在本地仓库）
> - **push**：把版本推送到 GitHub（远端仓库）

---

## 0. 术语速查（先把“密钥/公钥/Token”讲清楚）

- **Git 仓库**：你的项目目录里有 `.git/`。
- **GitHub 仓库（remote）**：GitHub 上的远端仓库。
- **origin**：远端仓库的默认名字（只是一个别名）。
- **commit**：一次提交（一个版本快照 + 说明）。
- **push**：把本地 commit 推到 GitHub。
- **pull**：把 GitHub 的最新改动拉到本地。

### 0.1 SSH 密钥对（私钥 + 公钥）是什么
- **私钥（private key）**：保存在你本机 `~/.ssh/`，例如 `~/.ssh/id_ed25519`。
  - **绝对不要上传到 GitHub、不要提交进仓库、不要发给别人**。
- **公钥（public key）**：可以公开，通常是 `~/.ssh/id_ed25519.pub`。
  - 把**公钥**添加到 GitHub 后，你的本机就能用 SSH 身份验证 `git push`。

### 0.2 PAT / Token 是什么（HTTPS 推送用）
- **Personal Access Token（PAT）**：GitHub 用来代替“账号密码”的一串 Token。
- 用 **HTTPS** 推送时，GitHub 不允许再用账号密码，改用 **Token 当密码**。
- Token 属于敏感凭证：
  - **不要提交进仓库**
  - **不要写进代码**
  - **不要贴到公开聊天**

### 0.3 API 一般不需要
- 日常同步代码（commit/push）不需要 GitHub API。
- 只有你做自动化（脚本/机器人/CI）才会用到 API。

---

## 1. 先判断你当前用的是 SSH 还是 HTTPS

在仓库根目录执行：

```bash
git remote -v
```

- 如果看到：`git@github.com:USERNAME/REPO.git` → **SSH**
- 如果看到：`https://github.com/USERNAME/REPO.git` → **HTTPS**

你也可以查看当前分支：

```bash
git branch --show-current
```

---

## 2. 推荐方案：SSH（一次配置，后面基本不再输入凭证）

### 2.1 生成 SSH Key（如果你还没有）

1) 查看是否已有 key：

```bash
ls ~/.ssh
```

如果已经有 `id_ed25519` 和 `id_ed25519.pub` 可以直接用；没有则生成：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

一路回车即可（也可以设置 passphrase，但别忘）。

2) 启动 ssh-agent 并加载私钥：

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

### 2.2 把公钥添加到 GitHub

打印公钥：

```bash
cat ~/.ssh/id_ed25519.pub
```

复制输出全文 → GitHub：

- **Settings** → **SSH and GPG keys** → **New SSH key**
- Title 随便写（例如 `synology-nas`）
- Key 粘贴刚复制的公钥内容

### 2.3 测试 SSH 是否可用

```bash
ssh -T git@github.com
```

出现 `Hi <username>! You've successfully authenticated...` 之类表示成功。

### 2.4 把仓库 remote 切到 SSH（如果现在是 HTTPS）

```bash
git remote set-url origin git@github.com:USERNAME/REPO.git
```

> `USERNAME/REPO` 用你的实际仓库替换。

---

## 3. 备选方案：HTTPS + Token（PAT）

### 3.1 创建 GitHub Token（PAT）

在 GitHub：

- **Settings** → **Developer settings** → **Personal access tokens**
- 建议用 **Fine-grained token**（更安全）
  - Repository access：选你要推送的仓库
  - Permissions：至少需要 `Contents: Read and write`

如果你用的是经典 Token（classic），通常需要 `repo` 权限。

### 3.2 使用 HTTPS remote

```bash
git remote set-url origin https://github.com/USERNAME/REPO.git
```

之后 `git push` 时：
- Username：填 GitHub 用户名
- Password：粘贴 Token（不是账号密码）

> 想避免每次输入，可以让系统/工具保存凭证（不同系统方式不同）。

---

## 4. 我每次“更新网页并同步到 GitHub”的标准流程（你也可以照抄）

> 假设你已经在本地改了 HTML/CSS/JS 或新增了图片。

### 4.1 检查改动

```bash
git status
```

可选：看看具体改了什么（提交前建议看一眼）：

```bash
git diff
```

### 4.2 把改动加入暂存区

- 全部加入（最常用）：

```bash
git add -A
```

- 或只加某些文件：

```bash
git add modern-life-game/index.html
```

> `??`（untracked）表示新文件（例如 `_preview.png`），想同步到 GitHub 必须 `git add`。

### 4.3 提交（commit）

```bash
git commit -m "update: 简短说明你改了什么"
```

### 4.4 推送（push）到 GitHub

推荐先把远端最新提交拉下来再推（减少冲突 / 避免 push 被拒绝）：

```bash
git pull --rebase
git push
```

如果你的分支第一次推送到远端：

```bash
git push -u origin main
```

> `main` 也可能是 `master`，以你仓库实际分支为准。

---

## 5. 常见问题与处理

### 5.1 push 被拒绝：远端比你新（non-fast-forward）

```bash
git pull --rebase
git push
```

### 5.2 出现冲突（conflict）

- 按 Git 提示打开冲突文件，解决 `<<<<<<` / `======` / `>>>>>>` 标记。
- 解决后：

```bash
git add -A
git rebase --continue
```

最后再：

```bash
git push
```

### 5.3 不想把某些文件同步到 GitHub（例如临时文件、导出文件）

1) 把规则写到 `.gitignore`
2) 如果文件以前已经被追踪过，需要取消追踪：

```bash
git rm -r --cached PATH
git add -A
git commit -m "chore: update gitignore"
git push
```

### 5.4 重要安全原则（强烈建议）

- **不要把私钥、Token、密码写进代码或提交进仓库**。
- SSH：只把 **公钥**加到 GitHub，**私钥永远只留在本机**。
- HTTPS：Token 尽量用 Fine-grained、最小权限、设置过期时间；不用就撤销。

---

## 6.（可选）一条命令完成“提交并推送”

你可以在仓库根目录执行（提交信息自己改）：

```bash
git add -A && git commit -m "update: xxx" && git pull --rebase && git push
```

如果没有改动，这条命令会在 `git commit` 处提示“nothing to commit”。
