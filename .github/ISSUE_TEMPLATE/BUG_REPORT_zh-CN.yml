name: alova Bug反馈
description: 通过标准模板进行 Bug 反馈。
title: "[Bug Report] 请在此填写标题"
labels: ["bug: need confirm"]
body:
  - type: markdown
    attributes:
      value: |
        在提交 Bug 报告前，请注意：

        - 确认你的问题无法通过官方文档得到解决。
        - 确认你搜索过 [历史 issue](https://github.com/alovajs/alova/issues)，并且没有发现同样的问题。
        - 如果不是反馈 Bug，请到 [Discussions 讨论区](https://github.com/alovajs/alova/discussions) 发帖。

  - type: input
    id: reproduce
    attributes:
      label: 重现链接
      description: 请提供一个尽可能简单的 [codesandbox](https://codesandbox.io) 或 [stackBlitz](https://stackblitz.com) 或 GitHub 仓库链接。不要填写无效的链接。
    validations:
      required: true

  - type: input
    id: version
    attributes:
      label: alova 版本
      description: 请填写 node_modules/alova/package.json 里的版本号
      placeholder: 比如 1.4.0
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: 描述一下你遇到的问题。
    validations:
      required: true

  - type: textarea
    id: reproduce-steps
    attributes:
      label: 重现步骤
      description: 请提供一个最简单的操作步骤，方便我们快速重现问题。
      placeholder: |
        比如：
        1. 点击按钮
        2. 请求未发出
    validations:
      required: true

  - type: input
    id: browsers
    attributes:
      label: 设备/浏览器/浏览器版本
      description: 在哪些设备/浏览器以及哪个浏览器版本上能重现这个问题？