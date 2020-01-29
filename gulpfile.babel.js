import autoprefixer from 'autoprefixer';
import browserSync from 'browser-sync';
import cssnano from 'cssnano';
import del from 'del';
import webpack from 'webpack-stream';
import webp from 'imagemin-webp';
import gulp, { watch, series } from 'gulp';
import changed from 'gulp-changed';
import eslint from 'gulp-eslint';
import extReplace from 'gulp-ext-replace';
import imagemin from 'gulp-imagemin';
import notify from 'gulp-notify';
import plumber from 'gulp-plumber';
import postcss from 'gulp-postcss';
import rename from 'gulp-rename';
import sass from 'gulp-sass';
import sourcemaps from 'gulp-sourcemaps';

browserSync.create();

const APP_DIR = './src/FrontEndBundle/Resources/public';
const DIST_DIR = './web';

const paths = {
  styles: {
    src: `${APP_DIR}/scss/`,
    dist: `${DIST_DIR}/css/`,
  },
  scripts: {
    src: `${APP_DIR}/js/`,
    dist: `${DIST_DIR}/js/`,
  },
  images: {
    src: `${APP_DIR}/images/`,
    dist: `${DIST_DIR}/images/`,
  },
  fonts: {
    src: `${APP_DIR}/fonts/`,
    dist: `${DIST_DIR}/fonts/`,
  },
  html: {
    src: `${APP_DIR}/*.html`,
    dist: `${DIST_DIR}/`,
  },
};


// -------------------------------------------------------------------------
// [Browser]
// - Static server
// -------------------------------------------------------------------------
const browser = () => {
  browserSync.init({
    server: {
      baseDir: './web',
    },
  });
};

// -------------------------------------------------------------------------
// [Clean]
// - Delete all the files in the dist folder
// -------------------------------------------------------------------------
const clean = () => del(DIST_DIR).then((allPaths) => {
  console.log('Deleted files and folders:\n', allPaths.join('\n'));
});

// ------------------------------------------------------------------------
// [Html]
// - Update html page
// ------------------------------------------------------------------------
const html = () => gulp.src(paths.html.src)
  .pipe(changed(paths.html.dist))
  .pipe(plumber({
    errorHandler: (err) => {
      notify.onError({
        title: 'Style Task error',
        message: '<%= error.message %>',
        sound: 'Sosumi',
        onLast: true,
      })(err);
      this.emit('end');
    },
  }))
  .pipe(gulp.dest(paths.html.dist))
  .pipe(notify({
    message: 'Html task complete',
    onLast: true,
  }));

// ------------------------------------------------------------------------
// [Styles]
// - Compile sass
// - Add prefixes
// - Create minified/uglified version
// - Combine media queries
// - Generate sourcemaps
// ------------------------------------------------------------------------
const styles = () => {
  const postCssOpts = [
    autoprefixer,
    cssnano,
  ];

  return gulp.src(`${paths.styles.src}main.scss`)
    .pipe(changed(paths.styles.dist))
    .pipe(plumber({
      errorHandler: (err) => {
        notify.onError({
          title: 'Style Task error',
          message: '<%= error.message %>',
          sound: 'Sosumi',
          onLast: true,
        })(err);
        this.emit('end');
      },
    }))
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compact',
      sourceMap: true,
    }))
    .pipe(postcss(postCssOpts))
    .pipe(rename('main.min.css'))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(`${APP_DIR}/css/`))
    .pipe(gulp.dest(paths.styles.dist))
    .pipe(notify({
      message: 'Styles task complete',
      onLast: true,
    }));
};

// ------------------------------------------------------------------------
// [Eslint]
// - Run eslint on on all javascript files
// ------------------------------------------------------------------------
const lint = () => gulp.src([`${paths.scripts.src}**/*.js`, '!node_modules/**'])
  .pipe(plumber({
    errorHandler: function plumberScripts(err) {
      notify.onError({
        title: 'ESLint',
        message: '<%= error.message %> In <%= error.fileName %> - Line <%= error.lineNumber %>',
        sound: 'Sosumi',
      })(err);
      this.emit('end');
    },
  }))
  .pipe(eslint())
  .pipe(eslint.format())
  .pipe(eslint.failOnError())
  .pipe(notify({
    message: 'ESLint task complete',
    onLast: true,
  }));

// ------------------------------------------------------------------------
// [Scripts]
// - Compile js with webpack
// - Create minified/uglified version
// - Generate sourcemaps
// ------------------------------------------------------------------------
const scripts = () => gulp.src(`${paths.scripts.src}main.js`)
  .pipe(changed(paths.scripts.dist))
  .pipe(webpack({
    mode: 'production',
    output: {
      filename: 'main.min.js',
    },
    devtool: 'source-map',
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'babel-loader',
          },
        },
      ],
    },
  }))
  .pipe(gulp.dest(paths.scripts.dist))
  .pipe(notify({
    message: 'Scripts task complete',
    onLast: true,
  }));

// ------------------------------------------------------------------------
// [Images]
// - Minify Images
// ------------------------------------------------------------------------
const images = () => gulp.src(`${paths.images.src}**/*`)
  .pipe(changed(paths.images.dist))
  .pipe(plumber({
    errorHandler: (err) => {
      notify.onError({
        title: 'Image Task error',
        message: '<%= error.message %>',
        sound: 'Sosumi',
        onLast: true,
      })(err);
      this.emit('end');
    },
  }))
  .pipe(imagemin({ progressive: true }))
  .pipe(gulp.dest(paths.images.dist))
  .pipe(notify({
    message: 'Images task complete',
    onLast: true,
  }));

// ------------------------------------------------------------------------
// [Webp]
// - Convert Images to Webp NOT SVGs
// ------------------------------------------------------------------------
const exportWebp = () => gulp.src(`${paths.images.src}**/*.{png,jpg,jpeg}`)
  .pipe(plumber({
    errorHandler: (err) => {
      notify.onError({
        title: 'Webp Task error',
        message: '<%= error.message %>',
        sound: 'Sosumi',
        onLast: true,
      })(err);
      this.emit('end');
    },
  }))
  .pipe(imagemin([
    webp({
      quality: 75,
    }),
  ]))
  .pipe(extReplace('.webp'))
  .pipe(gulp.dest(paths.images.dist))
  .pipe(notify({
    message: 'Webp task complete',
    onLast: true,
  }));

// ------------------------------------------------------------------------
// [Fonts]
// - Copy contents of fonts path
// ------------------------------------------------------------------------
const fonts = () => gulp.src(`${paths.fonts.src}**/*`)
  .pipe(changed(paths.fonts.dist))
  .pipe(plumber({
    errorHandler: (err) => {
      notify.onError({
        title: 'Font Task error',
        message: '<%= error.message %>',
        sound: 'Sosumi',
        onLast: true,
      })(err);
    },
  }))
  .pipe(gulp.dest(paths.fonts.dist))
  .pipe(notify({
    message: 'Fonts task complete',
    onLast: true,
  }));

// ------------------------------------------------------------------------
// [Watch]
// - Watch files change
// ------------------------------------------------------------------------
const watchFiles = (done) => {
  // Sass changes
  watch(`${paths.styles.src}**/*`).on('change', series(styles, browserSync.reload));

  // JS changes
  watch(`${paths.scripts.src}**/*`).on('change', series(scripts, browserSync.reload));

  // Image changes
  watch(`${paths.images.src}**/*`).on('change', series(images, browserSync.reload));

  // Font changes
  watch(`${paths.fonts.src}**/*`).on('change', series(fonts, browserSync.reload));

  // Html changes
  watch(`${paths.html.src}`).on('change', series(html, browserSync.reload));

  done();
};

module.exports = {
  clean,
  html,
  styles,
  lint,
  scripts,
  images,
  exportWebp,
  fonts,
  watchFiles,
  browser,
};

// Default Task
gulp.task('default', gulp.series(clean, html, styles, lint, scripts, images, exportWebp, fonts, watchFiles, browser));

// Production/Deployment task
gulp.task('deploy-prod', gulp.series(clean, styles, scripts, images, exportWebp, fonts));
