const gulp = require('gulp');
const webpackStream = require('webpack-stream');
const uglify = require('gulp-uglify-es').default;
const fs = require('fs');
const path = require('path');
const { getUsedModuleIdsAndModules } = require('webpack/lib/ids/IdHelpers');

const projectRoot = __dirname;

// enhanced-resolve stores literal "#" in resolved paths as "\0#", which breaks
// path.relative() when the project directory itself contains a "#".
const unescapeHash = value => value.replace(/\0(.)/g, '$1');

const toProjectRelative = value => {
  const absolute = path.isAbsolute(value) ? value : path.resolve(projectRoot, value);
  const relative = path.relative(projectRoot, absolute).split(path.sep).join('/');
  return relative.startsWith('.') ? relative : `./${relative}`;
};

class PortableModuleIdsPlugin {
  apply(compiler) {
    compiler.hooks.compilation.tap('PortableModuleIdsPlugin', compilation => {
      compilation.hooks.moduleIds.tap('PortableModuleIdsPlugin', () => {
        const chunkGraph = compilation.chunkGraph;
        const [usedIds, modules] = getUsedModuleIdsAndModules(compilation);
        for (const module of modules) {
          const identifier = unescapeHash(module.identifier());
          const base = identifier
            .split(/([|!])/)
            .map(part => {
              if (part === '|' || part === '!') return part;
              return path.isAbsolute(part) ? toProjectRelative(part) : part;
            })
            .join('');
          let id = base;
          let suffix = 0;
          while (usedIds.has(id)) {
            suffix += 1;
            id = `${base}?${suffix}`;
          }
          usedIds.add(id);
          chunkGraph.setModuleId(module, id);
        }
      });
    });
  }
}

function clean(cb) {
  try {
    const dist = path.join(projectRoot, 'dist');
    if (fs.existsSync(dist)) {
      for (const file of fs.readdirSync(dist)) {
        if (file.endsWith('.js') || file.endsWith('.map')) {
          fs.rmSync(path.join(dist, file), { force: true });
        }
      }
    }
    cb();
  } catch (error) {
    cb(error);
  }
}

function bundle() {
  return gulp.src('src/main.js')
    .pipe(webpackStream({
      mode: 'production',
      context: projectRoot,
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
        moduleIds: false,
        chunkIds: 'named'
      },
      plugins: [new PortableModuleIdsPlugin()],
      devtool: false
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

const FORBIDDEN_PATTERNS = [
  { name: 'NUL byte', test: text => text.includes('\0') },
  { name: 'escaped hash', test: text => text.includes('\\0#') || text.includes('\\u0000#') },
  {
    name: 'project directory',
    test: text =>
      [
        projectRoot,
        projectRoot.replace(/\\/g, '/'),
        projectRoot.replace(/#/g, '\\0#'),
        projectRoot.replace(/\\/g, '/').replace(/#/g, '\\0#'),
        projectRoot.replace(/#/g, '\\u0000#')
      ].some(variant => text.includes(variant))
  },
  { name: 'absolute windows path', test: text => /[A-Za-z]:[\\/][^\\/]{2,}[\\/]/.test(text) }
];

function verify(cb) {
  try {
    const dist = path.join(projectRoot, 'dist');
    const problems = [];
    for (const file of fs.readdirSync(dist)) {
      if (!file.endsWith('.js') && !file.endsWith('.map')) continue;
      const text = fs.readFileSync(path.join(dist, file), 'utf8');
      for (const rule of FORBIDDEN_PATTERNS) {
        if (rule.test(text)) problems.push(`${file}: ${rule.name}`);
      }
    }
    if (problems.length > 0) {
      cb(new Error(`Generated bundle contains local paths:\n  ${problems.join('\n  ')}`));
      return;
    }
    cb();
  } catch (error) {
    cb(error);
  }
}

function watchFiles() {
  gulp.watch(['src/**/*.js', 'src/**/*.css'], gulp.series(clean, bundle, minify, addMetadata, verify));
}

exports.build = gulp.series(clean, bundle, minify, addMetadata, verify);
exports.verify = verify;
exports.watch = gulp.series(clean, bundle, minify, addMetadata, verify, watchFiles);
exports.default = exports.build;
