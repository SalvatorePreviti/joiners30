# newjoiners 30 november 2020

Code/engine based on the game Island Not Found https://github.com/SalvatorePreviti/js13k-2020 by Ben Clark and Salvatore Previti for JS13K 2020 https://2020.js13kgames.com/entries/island-not-found.

# Build the source code

First install all the required packages with

```sh
npm i
```

NodeJS 14.8.0 is required.

- To starts the development server, port 3000, with hot/quick reload on file change.

```sh
npm run dev
```

- To builds the final zip file in the dist folder.

```sh
npm run build
```

- To typecheck typescript files (no compilation output)

```sh
npm run ts-check
```

- To run a generic .ts file or a .js file with es6 modules from node

```sh
npm run ts-run src/filename.ts
```
