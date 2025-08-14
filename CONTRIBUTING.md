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

Our SDKs are generated from our OpenAPI spec using [Fern](https://buildwithfern.com/learn/sdks/overview/introduction).

If you're making changes to the OpenAPI spec, you can use the Fern CLI to validate your changes and preview the impact on the generated SDKs.

#### Installation

```bash
npm install -g fern-api
```

#### Common Commands

**Validate the spec:**
```bash
fern check
```

**Preview an SDK:**
```bash
fern generate --preview --group <group-name>
```

#### ⚠️ Important Warning

**Be careful not to run `fern generate` without the `--preview` flag in your local development environment!**

Running `fern generate` without the preview flag will automatically submit pull requests to the SDK's GitHub repository. This command is intended for use in CI/CD pipelines only.

**❌ Don't do this locally:**
```bash
fern generate --group <group-name>
```

**✅ Always use preview mode for local development:**
```bash
fern generate --preview --group <group-name>
```

> **Note:** You can find the appropriate group name in the [`generators.yml`](./fern/generators.yml) file. For example, `python-sdk` is the group name for the Python SDK.

**Generate the Fern definition from the OpenAPI spec:**
```bash
fern write-definition
```

#### Help Commands

Get general help:
```bash
fern help
```

Get help for the generate command:
```bash
fern generate help
```

#### Additional Resources

For more details on how to use Fern, refer to the documentation for:
- [Fern CLI](https://buildwithfern.com/learn/cli-api-reference/cli-reference/overview)
- [Fern SDK](https://buildwithfern.com/learn/sdks/overview/introduction)


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
