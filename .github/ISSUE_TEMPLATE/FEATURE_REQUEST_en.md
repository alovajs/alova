name: I want a new feature in alova
description: Describe your functional requirements through standard templates.
title: "[Feature Request] Please fill in the title here"
labels: ["feature: need confirm"]
body:
  - type: markdown
    attributes:
      value: |
        Before submitting a feature request, please note:

        - Confirm that this is a generic feature and cannot be implemented through the existing API.
        - Make sure you searched for [historical issues](https://github.com/alovajs/alova/issues) and didn't find the same requirement.
        - You can first post in the [Discussions discussion area](https://github.com/alovajs/alova/discussions) to discuss whether the demand is reasonable.

  - type: textarea
    id: description
    attributes:
      label: In what situation do you need this function to solve the problem?
      description: Please describe the usage scenarios of this feature in as much detail as possible.
    validations:
      required: true

  - type: textarea
    id: api
    attributes:
      label: What do you expect the API to look like?
      description: Describe the API of this new feature and provide some code examples.
    validations:
      required: true