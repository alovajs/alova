# alova 贡献指南

**alova 的使命是让应用管理 CS 数据交互更高效体验更好**，针对不同的请求场景提出更好的请求管理方案。我们对 alova 的期望是一个结合了开发体验和用户体验的请求管理工具，具有非常灵活的扩展能力，可以实现更多的请求场景。

我们鼓励您通过提交问题和拉取请求来为 **alova** 的开发做出贡献。

## 致谢

alova 持续招募贡献者，甚至在 issue 中回答问题，或者做一些简单的 bug 修复，都会给 alova 带来很大的帮助。

如果您喜欢 alova，欢迎您投稿。

感谢所有开发者对 alova 的喜爱和支持。希望大家能成为 alova 的核心贡献者，共同打造更好的小程序开发框架！ 🍾🎉

##问题提交

### 对于贡献者

在提交问题之前，请确保满足以下条件：

- 必须是错误或功能添加。
- 必须是与 alova 相关的问题。
- 已经搜索过问题，没有发现类似的问题或解决方案。
- 填写以下模板中的信息

如果满足以上条件，我们提供了标准的出具模板，请按模板填写。

## alova 的发展方向

## 拉取请求

除了听取您的反馈和建议外，我们还希望您通过向我们的 GitHub 提出拉取请求以代码形式接受直接帮助。

下面是具体步骤：

### 1. fork 仓库

单击“Fork”按钮将您需要参与的项目存储库分叉到您的 Github。

### 2. 克隆 forked 仓库

在自己的 github 中，找到 fork 项目，git clone 到本地。

```bash
$ git clone git@github.com:<yourname>/alova.git
```

### 3. 添加 alova 仓库

将 fork 源存储库连接到本地存储库：

```bash
$ git remote add alova git@github.com:<yourname>/alova.git
```

### 4. 与 alova 存储库保持同步

更新上游存储库：

```bash
$ git pull --rebase <name> <branch>
# 相当于下面两条命令
$ git fetch <name> <branch>
$ git rebase <name>/<branch>
```

### commit 信息提交

提交信息请遵循[提交信息约定](./CONTRIBUTING_COMMIT.md)，以便自动生成`CHANGELOG`。具体格式请参考提交文档规范。

#### 开发和调试代码

```bash
# 运行测试用例
npm run test

# 运行测试并生成覆盖率。
npm run test:coverage

# lint检查
npm run lint:fix
```

如果需要在 IDE 断点处调试，本项目配置 vscode 的调试设置。
![debug](https://user-images.githubusercontent.com/29848971/202136129-6a3befd0-87ac-4572-b9a4-9289cd4c4830.png)
