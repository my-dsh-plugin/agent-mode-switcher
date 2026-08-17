# dsh-agent-mode-switcher

DeepSeek Harness 插件:模型回答完毕后,在当前会话中切换 agent preset(模式),
并继续同一段对话。

## 功能

会话标题栏本来就展示当前会话运行的模式(agent preset)——标准模式 / PTC 模式 /
极简模式或自定义预设。在原生 harness 里,对话一旦开始这个标签就只读,因为
`agentPreset.select` 会拒绝所有非空白会话。本插件:

1. **替换随附的标题栏标签**,变成可交互的切换芯片(同一个
   `conversation.session.header.actions` 单元格,id `agent-preset`)。
2. 选择其他模式走标准 `agentPreset.select` RPC,把当前会话的 agent 重新组装到
   目标 preset。会话、历史与 workspace 原地不动——只换工具/提示词组合,并且
   选择会写进会话日志,resume 或 fork 时重建同一模式。select 的应答会立即
   更新会话摘要(与随附 seat 的做法一致),标题栏芯片无需刷新页面即可显示
   新模式。
3. 模型回答中芯片禁用,宿主在回合运行期间也会拒绝切换。

## 依赖

harness 目前还没有随上游发布「空闲会话可切换模式」的能力,所以**今天需要一个
打了随附补丁的 deepseek-harness 源码检出**。未打补丁的 harness 对已开始的
会话仍会回答 `agent-preset-locked`,切换器无法改模式。

## 安装

**插件本身不需要构建。** 仓库把构建好的 host 入口和浏览器 bundle 提交在
`lib/` 里,安装就是克隆/拉取加一条 CLI 命令——不需要在本仓库 `pnpm install`,
不需要 `prepare` 脚本,也不需要 `allowBuilds` 审批。整个流程里唯一要构建的是
第 1 步给 harness 打补丁后的 harness 自身。

### 1. 给 harness 打补丁

在本仓库目录下,对 deepseek-harness 源码检出执行:

```sh
node scripts/apply-patch.mjs /path/to/deepseek-harness
cd /path/to/deepseek-harness
npm run build:lib:host
```

补丁(`patches/dsh-agent-preset-mid-conversation-switch.patch`)把
`agentPreset.select` 的守卫从「仅空白」放宽为「未在运行回合」,让已开始但空闲
的会话也能切换模式。它是纯增量改动——空白会话的既有行为不变。

### 2. 安装插件(无需构建)

**本地克隆(推荐迭代用)**——以 link 方式安装,直接使用已提交的 `lib/`;
在克隆里 `git pull` 即可更新插件,无需任何构建:

```sh
git clone https://github.com/my-dsh-plugin/agent-mode-switcher.git
pnpm dsh plugin add --profile web /path/to/agent-mode-switcher
```

(`dsh` CLI 来自你的 harness 检出;若 DSH_HOME 不是默认的 `~/.dsh`,请设置。)

**直接走 git**——pnpm 拉取仓库并使用已提交的 `lib/`,不会执行构建脚本:

```sh
pnpm dsh plugin add --profile web github:my-dsh-plugin/agent-mode-switcher
```

`dsh plugin add` 会添加依赖并整理 `dsh.profile.bundles` 列表。手动等价做法是
编辑 profile 的 `package.json`:

```json
"dependencies": {
  "dsh-agent-mode-switcher": "link:/path/to/agent-mode-switcher"
}
```

```json
"dsh": {
  "profile": {
    "bundles": ["@deepseek-ai/dsh-base", "@deepseek-ai/dsh-web-app", "dsh-agent-mode-switcher"]
  }
}
```

然后在 profile 目录里 `pnpm install`。

### 3. 重启并验证

重启 harness(`npx @deepseek-ai/dsh web` 或你惯用的方式)。打开任意已开始的
会话:标题栏的 agent-preset 标签现在是切换芯片。模型回答完毕后选择其他模式,
芯片会立即更新,并在同一会话里继续对话。

- 芯片在,但选择模式没反应 → 补丁没有进入正在运行的构建(检查第 1 步的重建,
  或旧进程没有完全停止)。
- 芯片完全不见 → 插件没有进入当前 profile 的 bundle 层(重新 `dsh plugin add`,
  检查 bundles 列表)。

### DeepSeek Harness Desktop(桌面端)一键安装

桌面端用户既不需要 harness checkout,也不需要打核心补丁:桌面端 harness 由 my-dsh-plugin
fork 构建,已内置会话中切换 agent-preset 的支持。在**普通终端**执行一次(不要在 App 自带
的 harness 会话里跑——那里的应用安装目录和 App 数据目录是沙箱/只读的,macOS 尤其如此):

```sh
bash <(curl -Ls https://raw.githubusercontent.com/my-dsh-plugin/agent-mode-switcher/main/scripts/install-desktop.sh) --restart
```

脚本幂等:从 GitHub 拉取插件(预编译 `lib/`,无需构建);若需要则把
`"agent-mode-switcher"` 加入内嵌 harness 的 `WEB_SETTINGS_NAMESPACES` 白名单;装入桌面
web profile 并注册 bundle;`--restart` 重启 App。之后会话标题栏出现 agent-preset 切换芯片。
可用环境变量覆盖:`DSH_DESKTOP_APP`、`DSH_DESKTOP_HOME`、`DSH_SKILL_SOURCE_DIR`。

> 使用已发布桌面包的最终用户无需任何手动步骤 —— 升级重启即可;插件已 seed,白名单已在
> 随包 harness 中。

## 维护

补丁基于当前 api-proxy 的 select 守卫,harness 上游移动后需要重新生成并验证:

```sh
node scripts/regenerate-patch.mjs /path/to/deepseek-harness
git -C /path/to/deepseek-harness stash
git -C /path/to/deepseek-harness apply --check /path/to/agent-mode-switcher/patches/dsh-agent-preset-mid-conversation-switch.patch
git -C /path/to/deepseek-harness stash pop
```

重新生成只覆盖本插件的核心扩展(三个 api-proxy 文件)。如果扩展已提交到分支,
用 `DSH_PATCH_BASE=<commit>` 指定基准。

## 开发

构建只用于**修改插件本身**,使用者从不构建。它需要 sibling 的
`deepseek-harness` 检出(`../deepseek-harness`),因为客户端 bundle 由共享的
harness preset 产出:

```sh
pnpm install
pnpm test       # vitest: controller 与 select-echo 套件
pnpm typecheck  # 针对 harness 检出执行 tsc -b 覆盖 src + tests
pnpm build      # tsc 声明 + tsdown host + 客户端 bundle 到 lib/
```

构建后请把 `lib/` 提交进仓库,这样使用者能持续拿到预构建产物(link 安装的
profile 只需 `git pull` 即可更新)。

## 取舍

切换已开始对话的模式,之前组合产出的历史(新工具集无法调用的已记录工具调用)
由调用方接受。回合运行中禁止切换,运行中请求所依据的工具 schema 不会在回答
中途改变。

## 已知限制与暂缓事项

- 标题栏渲染处即提供切换;有待处理交互(如审批对话框)的会话仍可能切换,宿主
  守卫(仅限运行中)是唯一强制。
- 名单刷新依赖 `settings/document-updated` 事件与组件自身加载;其他机器上创作
  的 preset 需要重新加载会话才会出现,与随附的 agent-preset 界面一致。
- 其他打开的标签页需要刷新才能看到新模式(与随附 agent-preset 界面一致)。

## License

Apache-2.0
