const gulp = require('gulp');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const fs = require('fs');

function bundle() {
  return gulp.src('src/main.js')
    .pipe(webpackStream({
      mode: 'production',
      output: {
        filename: 'main.js',
        environment: {
          dynamicImport: false
        }
      },
      module: {
        rules: [
          {
            test: /\.css$/,
            type: 'asset/source'
          }
        ]
      },
      optimization: {
        minimize: false,
        mangleExports: false,
        moduleIds: 'named',
        chunkIds: 'named'
      },
      devtool: 'source-map'
    }))
    .pipe(gulp.dest('dist'));
}

function minify() {
  return gulp.src('dist/main.js')
    .pipe(uglify({
      output: {
        beautify: true,
        comments: 'some',
        indent_level: 2
      },
      mangle: false
    }))
    .pipe(gulp.dest('dist'));
}

function addMetadata(cb) {
  try {
    const metadata = fs.readFileSync('./src/metadata.js', 'utf8');
    const mainJs = fs.readFileSync('./dist/main.js', 'utf8');
    fs.writeFileSync('./dist/main.js', metadata + '\n' + mainJs);
    cb();
  } catch (error) {
    cb(error);
  }
}

function watchFiles() {
  gulp.watch(['src/**/*.js', 'src/**/*.css'], gulp.series(bundle, minify, addMetadata));
}

exports.build = gulp.series(bundle, minify, addMetadata);
exports.watch = gulp.series(bundle, minify, addMetadata, watchFiles);
exports.default = exports.build;
