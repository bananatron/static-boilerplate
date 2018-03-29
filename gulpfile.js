const gulp = require('gulp')
const fs = require('fs-extra')
const sass = require('gulp-sass')
const concat = require('gulp-concat')
const autoprefixer = require('gulp-autoprefixer') //https://github.com/postcss/autoprefixer#options
const minify = require('gulp-clean-css')
const sourcemaps = require('gulp-sourcemaps')

const browserify = require('gulp-browserify')
const babelify = require('babelify')
const rename = require('gulp-rename')
const hb = require('gulp-hb')
const bs = require('browser-sync').create()


// Folder name for compiled output
const outputFolder = 'target';


// Server start
gulp.task('default', function () {

    gulp.start('js');
    gulp.watch(['js/**/*'], ['js']);

    gulp.start('styles');
    gulp.watch(['styles/*', 'styles/**/*'], ['styles']);

    gulp.start('markup');
    gulp.watch(['views/*', 'views/partials/*'], ['markup']);

    copy();

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

})


// HBS > HTML
gulp.task('markup', function () {
    return gulp
        .src('views/*.hbs')
        .pipe(hb({
            partials: 'views/partials/*.hbs',
            // helpers: './src/assets/helpers/*.js',
            data: 'bin/view_data.json'
        }))
        .pipe(rename({ extname: '.html' }))
        .pipe(gulp.dest(outputFolder));
});

// SCSS > CSS
gulp.task('styles', function() {
    return gulp.src([
        'styles/entry.scss'
    ])
    .pipe(sourcemaps.init()) // Init sourcemaps
    .pipe(sass().on('error', sass.logError)) // Parse Sass
    .pipe(concat('styles.min.css')) // Combine all Sass files into one
    .pipe(autoprefixer({ // Add necessary vendor prefixes
        browsers: ['last 2 versions', '> 10%'],
        remove: false // Don't strip old prefixes
    }))
    .pipe(minify({compatibility: 'ie9'})) // Minify
    .pipe(rename('global.min.css'))
    .pipe(sourcemaps.write('./')) // Output sourcemaps
    .pipe(gulp.dest('target/css/')); // Output file
});

// ES6 > JS
gulp.task('js', function() {
    return gulp.src('js/entry.js')
    .pipe(browserify({
        insertGlobals : true,
        transform: ['babelify'],
        debug: false,
    }))
    .pipe(rename('bundle.js'))
    .pipe(gulp.dest('target/js'))
});



let copy = () => {
    console.log("Copying public folder...")
    fs.copySync("public", outputFolder)

    console.log("Copying assets folder...")
    fs.copySync("assets", `${outputFolder}/assets`)

    // Node modules we care about for production (non dev-dependencies)
    console.log("Copying production node modules...")
    // let prodPackages = require("package.json")["dependencies"]
    let prodPackages = JSON.parse(fs.readFileSync('package.json'))["dependencies"];
    Object.keys(prodPackages).forEach(dir => fs.copySync(`node_modules/${dir}`, `${outputFolder}/node_modules/${dir}`))
}
