gulp        = require 'gulp'
coffee      = require 'gulp-coffee'
rename      = require 'gulp-rename'
browserify  = require 'gulp-browserify'
concat      = require 'gulp-concat'
less        = require 'gulp-less'
uglify      = require 'gulp-uglify'

gulp.task 'coffee', ->
    gulp.src('./src/*.coffee')
    .pipe(coffee())
    .pipe gulp.dest('./lib')

gulp.task 'scripts', ['coffee'], ->
    gulp.src('./lib/init.js')
    .pipe(browserify(ignore: ['jquery-commonjs']))
    .pipe(concat('reform.js'))
    .pipe(gulp.dest('./build'))

gulp.task 'test-coffee', ->
    gulp.src('./test/*.coffee')
    .pipe(coffee())
    .pipe(gulp.dest('./lib_test'))

gulp.task 'test-scripts', ['test-coffee'], ->
    gulp.src('./lib_test/test.js')
    .pipe(browserify(ignore: ['jquery-commonjs']))
    .pipe(concat('test.js'))
    .pipe(gulp.dest('./build'))

gulp.task 'less', ->
    gulp.src('./less/all.less')
    .pipe(less())
    .pipe(concat('reform.css'))
    .pipe(gulp.dest('./build'))

    gulp.src('./less/theme-pure.less')
    .pipe(less())
    .pipe(concat('reform-pure.css'))
    .pipe(gulp.dest('./build'))

gulp.task 'copy', ->
    gulp.src(['./public/fonts/*', './public/img/*'], { base: './public' })
    .pipe(gulp.dest('./build'))

gulp.task 'default', ['copy', 'scripts', 'less', 'watch']
gulp.task 'test',    ['copy', 'scripts', 'test-scripts']
gulp.task 'build',   ['copy', 'scripts', 'less'], ->
    gulp.src('./build/reform.js')
    .pipe(rename('reform.min.js'))
    .pipe(uglify())
    .pipe(gulp.dest('./build'))

gulp.task 'watch', ->
    gulp.watch 'src/*.coffee', ['scripts']
    gulp.watch 'less/**/*.less', ['less']
