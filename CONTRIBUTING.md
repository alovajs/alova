# Contributing

**The mission of alova is to make your app management CS data interaction more efficient and better experience**, and propose better request management solutions for different request scenarios. Our expectation for alova is a request that combines both development experience and user experience Management tool, which has very flexible expansion capabilities to implement more request scenarios.

You are encouraged to contribute to the development of **alova** by submitting issues and pull requests.

## Acknowledgements

alova continues to recruit contributors, even answering questions in issues, or doing some simple bugfixes, will bring great help to alova.

If you like alova, you are welcome to contribute.

I would like to thank all developers for their liking and support of alova. I hope you can become a core contributor to alova and work together to create a better applet development framework! 🍾🎉

## Issue submission

### For contributors

Before submitting an issue, please make sure that the following conditions are met:

- Must be a bug or feature addition.
- Must be an alova related question.
- Already searched the issue and found no similar issue or solution.
- Complete the information in the template below

If the above conditions have been met, we have provided a standard template for issue, please fill in according to the template.

## Pull request

In addition to hearing your feedback and suggestions, we also want you to accept direct help in the form of code, by making a pull request to our GitHub.

Here are the specific steps:

### 1. Fork repository

Click the `Fork` button to fork the project repository you need to participate in to your Github.

### 2. Clone has forked the project

In your own github, find the fork project and git clone it locally.

```bash
$ git clone git@github.com:<yourname>/alova.git
```

### 3. Add alova repository

Connect the fork source repository to the local repository:

```bash
$ git remote add alova git@github.com:<yourname>/alova.git
```

### 4. Keep in sync with the alova repository

Update the upstream repository:

```bash
$ git pull --rebase <name> <branch>
# Equivalent to the following two commands
$ git fetch <name> <branch>
$ git rebase <name>/<branch>
```

### commit information submission

Please follow the [commit message convention](./CONTRIBUTING_COMMIT.md) for commit information, so that `CHANGELOG` can be automatically generated. For the specific format, please refer to the commit document specification.

#### Develop and debug code

```bash
# Run test cases
npm run test

# Run test and generate coverage.
npm run test:coverage

# lint check
npm run lint:fix
```

If you need to debug at IDE breakpoints, this project configures vscode's debug settings.
![debug](https://user-images.githubusercontent.com/29848971/202136129-6a3befd0-87ac-4572-b9a4-9289cd4c4830.png)
