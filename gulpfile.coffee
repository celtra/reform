gulp        = require 'gulp'
coffee      = require 'gulp-coffee'
rename      = require 'gulp-rename'
browserify  = require 'gulp-browserify'
concat      = require 'gulp-concat'
less        = require 'gulp-less'
uglify      = require 'gulp-uglify'
clean       = require 'gulp-clean'

# coffee -o lib src
gulp.task 'coffee', ->
    gulp.src('./src/*.coffee')
    .pipe(coffee())
    .pipe gulp.dest('./lib')

# browserify -e lib/init.js -o build/reform.js -i 'jquery-commonjs'
gulp.task 'scripts', ['coffee'], ->
    gulp.src('./lib/init.js')
    .pipe(browserify(ignore: ['jquery-commonjs']))
    .pipe(concat('reform.js'))
    .pipe(gulp.dest('./build'))

# coffee -o lib_test test
gulp.task 'test-coffee', ->
    gulp.src('./test/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('./lib_test'))

# browserify -e lib_test/test.js -o build/test.js -i 'jquery-commonjs'
gulp.task 'test-scripts', ['test-coffee'], ->
    gulp.src('./lib_test/test.js')
    .pipe(browserify(ignore: ['jquery-commonjs']))
    .pipe(concat('test.js'))
    .pipe(gulp.dest('./build'))

# non dependent tasks can be in one task
# lessc less/all.less > build/reform.css
# lessc less/theme-pure.less > build/reform-pure.css
# lessc less/theme-ac4.less > build/reform-ac4.css
# lessc less/theme-ac3.less > build/reform-ac3.css
# lessc less/theme-ac3-dark.less > build/reform-ac3-dark.css
gulp.task 'less', ->
    gulp.src('./less/all.less')
    .pipe(less())
    .pipe(concat('reform.css'))
    .pipe(gulp.dest('./build'))

    gulp.src('./less/theme-pure.less')
    .pipe(less())
    .pipe(concat('reform-pure.css'))
    .pipe(gulp.dest('./build'))

    gulp.src('./less/theme-ac4.less')
    .pipe(less())
    .pipe(concat('reform-ac4.css'))
    .pipe(gulp.dest('./build'))

    gulp.src('./less/theme-ac3.less')
    .pipe(less())
    .pipe(concat('reform-ac3.css'))
    .pipe(gulp.dest('./build'))

    gulp.src('./less/theme-ac3-dark.less')
    .pipe(less())
    .pipe(concat('reform-ac3-dark.css'))
    .pipe(gulp.dest('./build'))

# cp -r public/fonts build
# cp -r public/img build
gulp.task 'copy', ->
    gulp.src(['./public/fonts/*', './public/img/*'], { base: './public' })
    .pipe gulp.dest('./build')

gulp.task 'clean', ->
    gulp.src(['./build', './lib', './lib_test'], read: false)
    .pipe clean()

gulp.task 'default', ['clean', 'copy', 'scripts' , 'less']
gulp.task 'test',    ['default', 'test-scripts']
gulp.task 'build',   ['default', 'test'], ->
    # uglifyjs -o build/reform.min.js build/reform.js
    gulp.src('./build/reform.js')
    .pipe(rename('reform.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./build'))

gulp.task 'watch', ->
    gulp.watch 'src/*.coffee', ['scripts']
    gulp.watch 'less/**/*.less', ['less']