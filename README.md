# RDF Toolkit

RDF Toolkit is a TypeScript library for working with Turtle and RDF data, along with a set of tools built around it.


## Getting Started

RDF Toolkit doesn't have any releases yet, so it must be built from source using `npm run build`.

```bash
$ git clone --depth 1 https://github.com/ektrah/rdf-toolkit.git
$ cd rdf-toolkit
$ npm ci
$ npm run build
```


## Usage

RDF Toolkit has a command-line interface with the syntax `npx rdf <command> [options]`.


### make explorer

This command will generate an HTML file that contains an interactive graph explorer that can be used to view and explore the contents of Turtle and RDF data.


### make site

This command will generate a static website from the contents of Turtle and RDF data.


### serve

This command will start a local HTTP server and serve the graph explorer or the static website created with the `make explorer` and `make site` commands, respectively.


### add file

This command will add a Turtle file to the configuration file.


### remove file

This command will remove a Turtle file from the configuration file.


## Configuration

The command-line interface is driven by a JSON configuration file. 

```json
{
  "siteOptions": {
    "title": "RDF Explorer",
    "outDir": "./public/",
    "baseURL": "/"
  },
  "files": {
    "http://www.w3.org/1999/02/22-rdf-syntax-ns": "./vocab/rdf.ttl",
    "http://www.w3.org/2000/01/rdf-schema": "./vocab/rdfs.ttl",
    "http://www.w3.org/2001/XMLSchema": "./vocab/xsd.ttl",
    "http://www.w3.org/2002/07/owl": "./vocab/owl.ttl"
  }
}
```


## Example

To build and serve an example site:

```bash
$ cd explorer
$ npx rdf make explorer
$ npx rdf serve
```


## License

RDF Toolkit is released under the MIT license. For more information, see the LICENSE file.
