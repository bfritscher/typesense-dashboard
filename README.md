# Typesense Dashboard (typesense-dashboard)

A Typesense Dashboard to manage and browse collections.

A side projet to test the Typesense API and Quasar with electron.

## Usage

### Web
As a web application, only server with --enable-cors will work.

Use  or build and install on your own server

### Desktop

With the desktop application everything except instant search will work without cors.
To export or import large json or ljson files, desktop version is required, because the browser version times out.

Download from release page or build your own.

## Screenshots

![server status](docs/images/server.png)

![collections](docs/images/collections.png)

![collection add](docs/images/collection_add.png)

![aliases](docs/images/aliases.png)

![apikeys](docs/images/apikeys.png)

![document](docs/images/document.png)

![search](docs/images/search.png)

![schema](docs/images/schema.png)

![synonyms](docs/images/synonyms.png)

![curations](docs/images/curations.png)


## Known Issues and limitations
- deep linking url routing do not always work
- API features not yet implemented:
    - create Snapshot
    - custom search (with a custom query)
    - delete by query
    - Scoped Search Key generation
- Dark mode not completly implemented

# Development
## Install the dependencies
```bash
yarn
```

### Start the app in development mode (hot-code reloading, error reporting, etc.)
```bash
quasar dev
```

### Lint the files
```bash
yarn run lint
```

### Build the app for production
```bash
quasar build
```

### Customize the configuration
See [Configuring quasar.conf.js](https://v2.quasar.dev/quasar-cli/quasar-conf-js).

    icon
    readme
    deploy


