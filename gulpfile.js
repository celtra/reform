var gulp        = require('gulp');
var browserify  = require('gulp-browserify');
var concat      = require('gulp-concat');
var less        = require('gulp-less');

// browserify -e lib/init.js -o build/reform.js -i "jquery-commonjs"
gulp.task('scripts', function() {
    gulp.src('./src/init.coffee', { read: false })
        .pipe(browserify({
            transform: ['coffeeify'],
            extensions: ['.coffee']
        }))
        .pipe(concat('reform.js'))
        .pipe(gulp.dest('./build'));
});

// lessc less/all.less > build/reform.css
gulp.task('less', function() {
    gulp.src('./less/all.less')
        .pipe(less())
        .pipe(concat('reform.css'))
        .pipe(gulp.dest('./build'));
});

// lessc less/theme-pure.less > build/reform-pure.css
gulp.task('less-pure', function() {
    gulp.src('./less/theme-pure.less')
        .pipe(less())
        .pipe(concat('reform-pure.css'))
        .pipe(gulp.dest('./build'));
});

gulp.task('default', function () {
    gulp.start('scripts', 'less', 'less-pure');
});