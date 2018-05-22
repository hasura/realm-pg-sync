# Getting a Hasura project running on a Hasura Cluster

## Creating an account

To get started with Hasura. Head to https://hasura.io and create a new account by clicking on the `Login` button on the top right.

## Installing the Hasura CLI

After you have logged in. Download the Hasura CLI tool on your machine from [here](https://docs.hasura.io/0.15/manual/install-hasura-cli.html)

## Getting started with a basic quickstart

Once you have installed the Hasura CLI tool on your machine. Run the following on your command shell to login to your Hasura account that you created earlier

```bash
$ hasura login
```

Next, run the following

```bash
$ hasura quickstart hasura/base
```

The command will
- Create a new directory called `base` with a basic Hasura project clonen from https://hasura.io/hub
- Initialises `base` as a git repository and adds `hasura` as remote to it. Run `git remote -v` to get the remote url.
- Create a free Hasura cluster and add that cluster to the project `base`.

To get the status of your cluster run `hasura cluster status` inside the project directory (in this case inside `base`)

## Deploying the project to the Hasura Cluster

To deploy the project that you just cloned on to your cluster, `git push hasura master`.

```bash
# Ensure that you are inside the project directory(inside base)
$ cd base/
# Add and commit the files to git
$ git add . && git commit -m "Initial commit"
# Push to the remote called hasura
$ git push hasura master
```

## API Console

Every Hasura cluster comes with an API Console that you can use to manage various things on Hasura.

To open the API console, run

```bash
# Ensure you are inside the project directory
$ hasura api-console
```

![APIConsole](https://raw.githubusercontent.com/hasura/realm-pg-sync/master/readme-assets/hasura-api-console.png)
