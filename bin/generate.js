// Generator which creates hbs pages with the appropriate directory/naming
// convention for associated JS and LESS files

// SCRIPT OPTIONS
//           --pagename=mypagename (REQUIRED)
//           --skipless            Skips generating .less file
//           --skipjs              Skips generating .js file (alias --skipJavascript)

// example:
// npm run generate -- --pagename=lol --skipLess

const path = require('path')
const mkdirp = require('mkdirp')
const fs = require('fs-extra')
const glob = require('glob')
const argv = require('minimist')(process.argv.slice(2))

const markupDirectory = `${__dirname}/../views`
const lessDirectory = `${__dirname}/../less`
const jsDirectory = `${__dirname}/../js`


if (!argv.pagename) {
    console.log("\n\n😭  Oops, no 'pagename' was provided...")
    console.log("   Try something like --pagename=mycoolpage as an argument.")
    return console.log("   Refer to bin/generate.js for a full list of options!\n")
}
const new_page_title = argv.pagename

// Generate markup
fs.readFile(`${__dirname}/templates/template.hbs`, "utf8", (err,data) => {
    if (err) return console.log(`🔥 ${err}`)

    const filename = `${new_page_title}.hbs`
    const outputPath = `${markupDirectory}/${filename}`

    // Replace title in template file
    let result = data.replace(/NEW_PAGE_TITLE/g, new_page_title)

    // Write out our new file
    fs.writeFile(outputPath, result, 'utf8', function (err) {
        if (err) {
            console.log(err)
        } else {
            console.log(`✅  Successfully built views/${filename}!`)
        }
    });
});


// Generate LESS
fs.readFile(`${__dirname}/templates/template.less`, "utf8", (err,data) => {
    if (argv.skipless || argv.skipLess) {
        console.log("⏩  Skipping generating less file.")
        return
    }
    if (err) return console.log(`🔥 ${err}`)

    const filename = `view_${new_page_title}.less`
    const outputPath = `${lessDirectory}/${filename}`
    const entryPath = `${lessDirectory}/_entry.less`

    let result = data.replace(/NEW_PAGE_TITLE/g, new_page_title)

    fs.writeFile(outputPath, result, 'utf8', function (err) {
        if (err) {
            console.log(`🔥 ${err}`)
        } else {
            console.log(`✅  Successfully built less/${filename}!`)

            // Add to entry
            fs.appendFileSync(entryPath, `\n@import "${filename}";`)
            console.log(`➕  Successfully added ${filename} to _entry.less.`)
        }
    });
});


// Generate Javascript
fs.readFile(`${__dirname}/templates/template.js`, "utf8", (err,data) => {
    if (argv.skipjs || argv.skipJs || argv.skipjavascript) {
        console.log("⏩  Skipping generating JS file.")
        return
    }
    if (err) return console.log(`🔥 ${err}`)

    const filename = `view_${new_page_title}.js`
    const outputPath = `${jsDirectory}/${filename}`
    const entryPath = `${jsDirectory}/entry.js`

    let result = data.replace(/NEW_PAGE_TITLE/g, new_page_title)

    fs.writeFile(outputPath, result, 'utf8', function (err) {
        if (err) {
            console.log(`🔥 ${err}`)
        } else {
            console.log(`✅  Successfully built js/${filename}!`)

            // Add to entry
            fs.appendFileSync(entryPath, `\nrequire('./${filename}');`)
            console.log(`➕  Successfully added ${filename} to entry.js.`)
        }
    });
});