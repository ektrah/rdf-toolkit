# RDF Toolkit

## Getting Started
To build

```bash
npm ci
npm run build
```

## Packages

### Explorer
TODO

### Explorer Site Generator
`explorer-site-generator` uses the toolkit to create a reference documentation site from a collection of RDF graphs.
It is driven by a JSON configuration file. 

```json
    {
        "title": "RDF Explorer",
        "icons": [
            {
                "type": "image/png",
                "sizes": "32x32",
                "file": "./favicon32.png"
            },
            {
                "type": "image/png",
                "sizes": "16x16",
                "file": "./favicon16.png"
            }
        ],
        "sources": {
            "http://www.w3.org/1999/02/22-rdf-syntax-ns": "./vocab/rdf.ttl",
            "http://www.w3.org/2000/01/rdf-schema": "./vocab/rdfs.ttl",
            "http://www.w3.org/2001/XMLSchema": "./vocab/xsd.ttl",
            "http://www.w3.org/2002/07/owl": "./vocab/owl.ttl"
        },
        "assets": {
            "./robots.txt": "robots.txt"
        },
        "outDir": "./public/",
        "baseURL": "/"
    }
```

To build an example site: 
```bash
cd ..
git clone https://github.com/ektrah/brick-reference.git
cd brick-reference/
cp ../rdf-toolkit/packages/explorer/src/vocab/* vocab/
```

Edit siteconfig.json to take out a few sources. Replace the sources setting in the siteconfig.json file with this:
```json
        "sources": {
            "http://www.w3.org/1999/02/22-rdf-syntax-ns": "./vocab/rdf.ttl",
            "http://www.w3.org/2000/01/rdf-schema": "./vocab/rdfs.ttl",
            "http://www.w3.org/2001/XMLSchema": "./vocab/xsd.ttl",
            "http://www.w3.org/2002/07/owl": "./vocab/owl.ttl"
        },
```
Then run the generator:
```bash
node ../rdf-toolkit/packages/explorer-site-generator/dist/explorer-site-generator.js
```

Note that in order to serve the HTML as generated, you'll need a server that can map .html files to their bare names, e.g. http://localhost:8000/rdfs/Resource to Resource.html 

The 'local-web-server' package is one such server and can quickly be installed, add it by:

```bash
cd ../rdf-toolkit
npm install --no-save local-web-server
npx ws --static.extensions html --directory ../brick-reference/public/
```
