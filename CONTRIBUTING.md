## Contributing

[fork]: https://github.com/intercom/Intercom-OpenAPI/fork
[pr]: https://github.com/intercom/Intercom-OpenAPI/compare
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

Contributions to this project are [released](https://help.github.com/articles/github-terms-of-service/#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE.md).

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Contributions to the OpenAPI descriptions

**We don't currently accept pull requests that directly modify the description artifacts found in this repository.** If you have feedback on the descriptions or have found a mismatch between the behavior that is described in this repo and the runtime behavior of the API, please [open an issue](https://github.com/intercom/Intercom-OpenAPI/issues/new).

### Using Fern
Our SDKs are generated from our OpenAPI spec using (Fern)[https://buildwithfern.com/learn/sdks/overview/introduction].
If you making changes to the OpenAPI spec, you can use the Fern CLI to validate your changes and preview the impact on the generated SDKs. Here are some useful commands

Install fern: `npm install -g fern-api`

Validate the spec: `fern check`

Preview an sdk: `fern generate --preview --group`

  You can find the appropriate group name in the (generators.yml)[./fern/generators.yml] file. For example `python-sdk` is the group name for the python sdk.

- Generate the Fern definition from the OpenAPI spec

  `fern write-definition`

For more details on how to use the Fern CLI, refer to the Fern docs site or use the help commands integrated into the CLI.

`fern help`

`fern generate help`


## Contributions to other files in the repository

We will gladly accept pull requests for contributions to other files in this repository.

### Submitting a pull request

0. [Fork][fork] and clone the repository
1. Create a new branch: `git checkout -b my-branch-name`
2. Make your change
3. Push to your fork and [submit a pull request][pr]
4. Pat your self on the back and wait for your pull request to be reviewed and merged.

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://help.github.com/articles/about-pull-requests/)
- [GitHub Help](https://help.github.com)
