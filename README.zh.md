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
   选择会写进会话日志,resume 或 fork 时重建同一模式。
3. 模型回答中芯片禁用,宿主在回合运行期间也会拒绝切换。

## 依赖

- 宿主需要允许空闲会话切换。本插件依赖 fork 的 api-proxy 放宽
  (`agentPreset.select` 守卫从「仅空白」改为「未在运行回合」);原生 harness
  对已开始的会话仍会回答 `agent-preset-locked`。
- 部署需要组装 agent preset(随附的模式都满足)。

## 安装

插件通过 profile bundle patch 挂载:

```yaml
# cordis.patch.yml(profile 覆盖层)
- insert:
    - id: agent-mode-switcher
      name: dsh-agent-mode-switcher
```

并且包需要出现在 profile 的 `dsh.profile.bundles` 里(其 `dsh.bundle.patch`
提供插入内容)。浏览器端由包的 `dsh.client` 清单发现。

## 取舍

切换已开始对话的模式,之前组合产出的历史(新工具集无法调用的已记录工具调用)
由调用方接受。回合运行中禁止切换,运行中请求所依据的工具 schema 不会在回答
中途改变。

## 已知限制与暂缓事项

- 标题栏渲染处即提供切换;有待处理交互(如审批对话框)的会话仍可能切换,宿主
  守卫(仅限运行中)是唯一强制。
- 名单刷新依赖 `settings/document-updated` 事件与组件自身加载;其他机器上创作
  的 preset 需要重新加载会话才会出现,与随附的 agent-preset 界面一致。
