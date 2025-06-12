const gulp = require('gulp');
const babel = require('gulp-babel');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const watch = require('gulp-watch');
const fs = require('fs');
const concat = require('gulp-concat');
const cleanCSS = require('gulp-clean-css');

// 监控文件变化
function watchFiles() {
  gulp.watch('src/**/*.js', gulp.series('compile', bundle, minify, addMetadata));
}

// 编译ES6代码
gulp.task('compile', function() {
    return gulp.src('src/main.js')
        .pipe(babel({
            presets: ['@babel/preset-env']
        }))
        .pipe(gulp.dest('dist'));
});

// 打包模块
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
      mangle: false // 禁止变量名简化
    }))
    .pipe(gulp.dest('dist'));
}

// 添加元数据
function addMetadata(cb) {
  try {
    const metadata = fs.readFileSync('./src/metadata.js', 'utf8');
    const mainJs = fs.readFileSync('./dist/main.js', 'utf8');
    fs.writeFileSync('./dist/main.js', metadata + '\n' + mainJs);
    cb(); // 调用回调函数表示任务完成
  } catch (error) {
    cb(error); // 如果发生错误，传递错误给回调函数
  }
}

// 添加 CSS 处理任务
function processCSS() {
    return gulp.src('src/styles/**/*.css')
        .pipe(concat('styles.css'))
        .pipe(cleanCSS())
        .pipe(gulp.dest('dist'));
}

// 修改导出任务
exports.default = gulp.series('compile', bundle, minify, processCSS, addMetadata, watchFiles);

// 修改监控任务
function watchFiles() {
    gulp.watch('src/**/*.js', gulp.series('compile', bundle, minify, addMetadata));
    gulp.watch('src/styles/**/*.css', processCSS);
}
