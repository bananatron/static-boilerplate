# Static Boilerplate

Static boilerplate for setting up static pages. Rip out what you don't need - add what you do.

- Dead simple setup
- Easily hosted on github



## Quickstart
- `git clone https://github.com/bananatron/static-boilerplate.git`
- `cd static-boilerplate && npm install && npm start`


### 📦 Setup
- Install [Node](https://docs.npmjs.com/getting-started/installing-node)
- Install [NPM](https://www.npmjs.com/get-npm)
- Run `npm install` in the directory with the `package.json` (the root directory).


 ### ⚡️ Build
To 'compile' the files and continuously watch (in development mode), run `npm start` in the root directory. To stop the auto-reload listener, use `CTRL + C`.

This will build a `target` folder/directory where the compiled markup, styles, and assets live. The `target` directory will be used as the source for the deploy process below.

 ### 🚢 Deploy
- Point your github branch to gh-pages
- Run `npm run deploy`, which will build a new gh-pages branch
