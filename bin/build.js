#!/usr/bin/env node
const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs-extra')
const glob = require('glob')
const sass = require('node-sass')
const chokidar = require('chokidar')
const bs = require('browser-sync').create()
const handlebars = require('handlebars')    
const postcss = require('postcss')
const autoprefixer = require("autoprefixer")
const cssnano = require("cssnano")
const imagemin = require("imagemin")
const browserify = require('browserify')
const argv = require('minimist')(process.argv.slice(2))

const rootDir = __dirname.split("/").slice(0, -1).join("/")
const outputFolder = 'target'; // Folder name for compiled output

// Args
const prod = argv.prod || false




// HBS => HTML  |   http://handlebarsjs.com
let buildHbs = () => {
    const files = glob.sync('views/**/*.hbs')
    console.log("⚡️  HBS compiling...")

    let buildTemplates = (file) => {
        // We'll remove this directory level in the compiled src
        // e.g /view/index.hbs => /index.html
        let rootFolder = 'views'
        let outLocation = `${outputFolder}/${file.split('.')[0].replace(rootFolder, '')}.html`

        // Register context and partials
        let hbs_context = require('./view_data.json') // The data accessible to the hbs template(s)
        let partials = glob.sync('views/partials/**/*.hbs')

        partials.forEach(partial => {
            const filename = partial.split('/')[partial.split('/').length - 1].replace('.hbs', '') // e.g view/partials/header.hbs => header
            handlebars.unregisterPartial(filename)
            handlebars.registerPartial(filename, fs.readFileSync(partial, 'utf8'))
        })

        let template = fs.readFileSync(file, 'utf8')
        let template_options = {}
        let html = handlebars.compile(template, template_options)(hbs_context)

        fs.outputFileSync(outLocation, html)
    }

    files.forEach(file => {
        buildTemplates(file)
        if (!prod) {
            chokidar.watch(file)
                .on('change', () => buildTemplates(file))
        }

    })
}



// LESS => CSS  |  http://lesscss.org
// (Also minifies and auto-prefixes)
let buildLess = () => {
    let build = () => {

        // const raw_less = fs.readFileSync('less/_entry.less', 'utf8')
        // const lessOptions = {
        //     paths: [path.resolve('less')], // So less knows where to look for files
        //     sourceMap: {
        //         sourceMapFileInline: (!prod),
        //         // sourceMapURL: '/global.css.map',
        //         // sourceMapFullFilename: 'global.css.map'
        //     }
        // }

        // less.render(raw_less, lessOptions).then(output => {
        //     // output.css = string of css
        //     // output.map = string of sourcemap
        //     // output.imports = array of string filenames of the imports referenced
        //     fs.outputFileSync(`${outputFolder}/css/global.css.map`, output.map)

        //     // Add CSS prefixes (autoprefixer) & Minfify (cssnano)
        //     // NOTE: cssnano is responsible for the moveTo depreciation message (next version should fix)
        //     postcss([ autoprefixer({browsers: ['last 3 versions']}), cssnano ])
        //         .process(output.css).then(processed_css => {
        //             processed_css.warnings().forEach(function (warn) {
        //                 console.warn(`⚠️ ${warn.toString()}`)
        //             })
        //             fs.outputFileSync(`${outputFolder}/css/global.min.css`, processed_css)
        //             console.log('✅  Less compile done.')
        //     })
        // }, error => {
        //     console.log('❗️  Less compile fail!', error)
        // });
    }

    build()
    // if (!prod)
    //     chokidar.watch(glob.sync('**/*.less')).on('change', () => build())
};



// Javascript
let buildJs = () => {

    const outputDirectory = `${__dirname}/../${outputFolder}/js/bundle.js`

    const build = () => {
        console.log("⚡️  JS compiling...")
        mkdirp(__dirname + `/../${outputFolder}/js`, (err) => {
            if (err)
                console.log(`🔥 ${err}`)

            fs.writeFile(outputDirectory, "", function(err) {
                if(err)
                    return console.log(`🔥 ${err}`)

                let bundleFs = fs.createWriteStream(outputDirectory)

                let b = browserify({
                    standalone: 'nodeModules',
                    debug: (!prod)}) // throws in sourcemaps - disable for production
                b.add("./js/entry.js")
                b.transform("babelify", {  // Transform ES6
                    presets: ["env"]
                })

                if (prod)
                    b.transform("uglifyify", { global: true }) // Minify

                b.bundle().pipe(bundleFs)

                bundleFs.on("finish", function () { // When our stream write finishes
                    console.log(`✅  JS compilation done.`)
                })
            })
        })
    }

    build();
    if (!prod)
        chokidar.watch(glob.sync(`./js/**/*.js`)).on("change", () => build())

}



// Copy public files & node modules needed in production
// (Any files in the /public directory will be copied to the 
// root of the output directory, as well as any applicable
// node modules that need to be in production
let copy = () => {
    console.log("Copying public folder...")
    fs.copySync("./public", outputFolder)

    // Node modules we care about for production (non dev-dependencies)
    console.log("Copying production node modules...")
    let prodPackages = require("../package.json")["dependencies"]
    Object.keys(prodPackages).forEach(dir => fs.copySync(`./node_modules/${dir}`, `${outputFolder}/node_modules/${dir}`))
}


// imagemin  |  https://github.com/imagemin/imagemin
let shrinkAssets = () => {
    console.log('🖼  Shrinking assets...')
    let assets = glob.sync('assets/**/*')

    assets.forEach(file => {
        let assetDirectory = file.split('/').splice(0, (file.split('/').length - 1)).join('/')

        imagemin([file], `${outputFolder}/${assetDirectory}`, {
            // options
        }).catch(err => {
            console.log('🔥 ', err);
        })

    })
}


// browserSync  |  https://www.browsersync.io
let browserSync = () => {
    bs.init({
        files: [{
            match: [`${outputFolder}/**/*`],
            fn: (event, file) => {
                if(event === 'change')
                    bs.reload();
            },
            options: {
                ignored: [
                    `${outputFolder}/node_modules`,
                    `${outputFolder}/fonts`
                ]
            }
        }],
        notify: false,
        port: 4000,
        server: `./${outputFolder}`,
        ui: false
    })
}




// Let's get this party started
console.log("🏁  Building..")
if (prod) console.log("🎁  PRODUCTION mode detected!")


buildHbs()
buildLess()
shrinkAssets()
buildJs()
copy()

if (!prod) {
    browserSync()
}


// for deploy?
//fs.removeSync(outputFolder);
