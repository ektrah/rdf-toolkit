#!/bin/bash

# Navigate to the parent directory
cd ..

# Install dependencies
npm i @rdf-toolkit/cli

# Navigate back to the explorer directory
cd explorer

# Build the project
npx rdf make explorer

# Serve the project
npx rdf serve
