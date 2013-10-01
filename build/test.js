var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var res = mod._cached ? mod._cached : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.extensions = [".js",".coffee"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = x + '/package.json';
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key)
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

require.define = function (filename, fn) {
    var dirname = require._core[filename]
        ? ''
        : require.modules.path().dirname(filename)
    ;
    
    var require_ = function (file) {
        return require(file, dirname)
    };
    require_.resolve = function (name) {
        return require.resolve(name, dirname);
    };
    require_.modules = require.modules;
    require_.define = require.define;
    var module_ = { exports : {} };
    
    require.modules[filename] = function () {
        require.modules[filename]._cached = module_.exports;
        fn.call(
            module_.exports,
            require_,
            module_,
            module_.exports,
            dirname,
            filename
        );
        require.modules[filename]._cached = module_.exports;
        return module_.exports;
    };
};

if (typeof process === 'undefined') process = {};

if (!process.nextTick) process.nextTick = (function () {
    var queue = [];
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;
    
    if (canPost) {
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);
    }
    
    return function (fn) {
        if (canPost) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        }
        else setTimeout(fn, 0);
    };
})();

if (!process.title) process.title = 'browser';

if (!process.binding) process.binding = function (name) {
    if (name === 'evals') return require('vm')
    else throw new Error('No such module')
};

if (!process.cwd) process.cwd = function () { return '.' };

if (!process.env) process.env = {};
if (!process.argv) process.argv = [];

require.define("path", function (require, module, exports, __dirname, __filename) {
function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

});

require.define("/lib_test/checkbox_test.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.4.0
(function() {
  var CheckBox, _ref;

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  CheckBox = require("../lib/checkbox");

  module.exports = function() {
    var $fake, $orig, setup;
    QUnit.module("CheckBox");
    $orig = null;
    $fake = null;
    setup = function(attrs) {
      if (attrs == null) {
        attrs = "";
      }
      $orig = $("<input type=\"checkbox\" class=\"reform-checkbox\" " + attrs + ">");
      $orig.appendTo("#qunit-fixture");
      new CheckBox($orig.get(0));
      return $fake = $orig.parent();
    };
    test("The fake wraps the original", 1, function() {
      setup();
      return ok($fake.is(".reform-checkbox-fake"), "Parent should be the fake");
    });
    test("Fake gets the 'disabled' class when disabled", 1, function() {
      setup("disabled");
      return ok($fake.is(".disabled"), "Fake should have class 'disabled'");
    });
    asyncTest("Fake gets the 'checked' class", 1, function() {
      setup();
      $orig.attr("checked", true).trigger("change");
      return setTimeout((function() {
        ok($fake.is(".checked"), "Fake should have class 'checked'");
        return start();
      }), 0);
    });
    return asyncTest("States must match before and after the fake is clicked", 2, function() {
      var match;
      setup();
      match = function() {
        ok($fake.is(".checked") === $orig.is(":checked"), "States should be the same");
        return start();
      };
      match();
      stop();
      $orig.attr("checked", true).trigger("change");
      return setTimeout(match, 0);
    });
  };

}).call(this);

});

require.define("/lib/checkbox.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.4.0
(function() {
  var CheckBox, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  CheckBox = (function() {

    function CheckBox(input) {
      this.refresh = __bind(this.refresh, this);

      var _this = this;
      this.orig = $(input);
      if (this.orig.is(".reformed")) {
        return;
      }
      if (this.orig.is(":radio")) {
        this.siblings = $("[name='" + (this.orig.attr("name")) + "']").not(this.orig);
      }
      this.fake = $("<label/>");
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "reformed");
      this.fake.removeClass("reform-checkbox").addClass("reform-checkbox-fake");
      if (this.orig.is(":checked")) {
        this.fake.addClass("checked");
      }
      if (this.orig.is(":disabled")) {
        this.fake.addClass("disabled");
      }
      if (this.orig.is(":radio")) {
        this.fake.addClass("radio");
      }
      this.orig.after(this.fake).appendTo(this.fake);
      this.fake.on("mousedown", function(e) {
        return e.preventDefault();
      });
      this.orig.on("reform.sync change DOMSubtreeModified", function() {
        return setTimeout(_this.refresh, 0);
      });
    }

    CheckBox.prototype.refresh = function() {
      var _ref1;
      this.fake.toggleClass("disabled", this.orig.is(":disabled"));
      this.fake.removeClass("checked");
      if (this.orig.is(":checked")) {
        this.fake.addClass("checked");
      }
      return (_ref1 = this.siblings) != null ? _ref1.each(function() {
        return $(this).parent().removeClass("checked");
      }) : void 0;
    };

    return CheckBox;

  })();

  module.exports = CheckBox;

}).call(this);

});

require.define("/lib_test/selectbox_test.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.4.0
(function() {
  var SelectBox, _ref;

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  SelectBox = require("../lib/selectbox");

  module.exports = function() {
    var $fake, $orig, setup;
    QUnit.module("SelectBox");
    $orig = null;
    $fake = null;
    setup = function(options, attrs) {
      if (options == null) {
        options = [];
      }
      if (attrs == null) {
        attrs = "";
      }
      $orig = $("<select class=\"reform-selectbox\" " + attrs + ">" + (options.map(function(opt) {
        return "<option value=\"" + opt.value + "\">" + opt.text + "</option>";
      }).join("")) + "</select>");
      $orig.appendTo("#qunit-fixture");
      new SelectBox($orig.get(0));
      return $fake = $orig.parent();
    };
    test("The fake wraps the original", 1, function() {
      setup();
      return ok($fake.is(".reform-selectbox-fake"), "Parent should be the fake");
    });
    return test("Fake gets the 'disabled' class when disabled", 1, function() {
      setup([], "disabled");
      return ok($fake.is(".disabled"), "Fake should have class 'disabled'");
    });
  };

}).call(this);

});

require.define("/lib/selectbox.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.4.0
(function() {
  var SelectBox, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  SelectBox = (function() {

    function SelectBox(select) {
      var _this = this;
      this.select = select;
      this.refresh = __bind(this.refresh, this);

      this.close = __bind(this.close, this);

      this.open = __bind(this.open, this);

      this.options = __bind(this.options, this);

      this.orig = $(this.select);
      if (this.orig.is(".reformed")) {
        return;
      }
      this.body = $("body");
      this.fake = $("<div/>");
      this.fake.attr("tabindex", 0);
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "reformed");
      this.fake.removeClass("reform-selectbox").addClass("reform-selectbox-fake");
      if (this.orig.is(":disabled")) {
        this.fake.addClass("disabled");
      }
      this.refresh();
      this.orig.after(this.fake).appendTo(this.fake);
      this.fake.on("keyup", function(ev) {
        if (ev.keyCode === 27) {
          ev.preventDefault();
          return ev.stopPropagation();
        }
      });
      this.fake.on("keydown", function(ev) {
        var $current, $item, $nextItem, done, goDown, goUp, itemDoesNotExist, itemIsDisabled;
        ev.preventDefault();
        ev.stopPropagation();
        if (_this.orig.is("[multiple]")) {
          return;
        }
        _this.fake.focus();
        goUp = ev.keyCode === 38;
        goDown = ev.keyCode === 40;
        if (goUp || goDown) {
          if (!(_this.floater != null)) {
            return _this.open();
          } else {
            $current = $('.hover', _this.floater).length === 0 ? $('.selected', _this.floater) : $('.hover', _this.floater);
            if (goUp) {
              $nextItem = $current.prev().length === 0 ? $current.parent().children().last() : $current.prev();
            } else {
              $nextItem = $current.next().length === 0 ? $current.parent().children().first() : $current.next();
            }
            _this.hover($nextItem);
            return _this.scrollTo($nextItem);
          }
        } else if (ev.keyCode === 13) {
          $item = $(_this.floater).find('.hover');
          itemDoesNotExist = $item.length === 0;
          itemIsDisabled = $item.is(".disabled");
          if (itemDoesNotExist || itemIsDisabled) {
            return;
          }
          $item.siblings().andSelf().removeClass("selected");
          $item.addClass("selected");
          _this.orig.val(_this.value()).trigger("change");
          return _this.close();
        } else if (ev.keyCode === 27) {
          if (_this.floater != null) {
            return _this.close();
          }
        } else {
          done = false;
          return _this.$list.children().each(function(i, item) {
            if (!done) {
              if ($(item).text().charAt(0).toLowerCase() === String.fromCharCode(ev.keyCode).toLowerCase()) {
                done = true;
                _this.hover($(item));
                return _this.scrollTo($(item));
              }
            }
          });
        }
      });
      this.floater = null;
      this.fake.on("click", function(e) {
        if (_this.orig.is(":disabled")) {
          return;
        }
        e.stopPropagation();
        if (_this.floater === null) {
          return _this.open();
        } else {
          return _this.close();
        }
      });
      this.fake.on("mousedown", function(e) {
        return e.preventDefault();
      });
      this.orig.on("reform.sync change DOMSubtreeModified", this.refresh);
      this.body.on("reform.open", function(e) {
        if (e.target !== _this.select) {
          return _this.close();
        }
      });
      $('.reform-selectbox-options').remove();
    }

    SelectBox.prototype.hover = function($item) {
      $item.siblings().andSelf().removeClass("hover");
      return $item.addClass("hover");
    };

    SelectBox.prototype.scrollTo = function($item) {
      var $container, newScrollTop, scrollTop,
        _this = this;
      $container = $item.parent();
      newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop();
      this.ignoreMouse = true;
      if (newScrollTop > ($container.outerHeight() - $item.outerHeight())) {
        scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight();
        $container.scrollTop(scrollTop);
      } else {
        $container.scrollTop(0);
      }
      if (this.to) {
        clearTimeout(this.to);
      }
      return this.to = setTimeout(function() {
        return _this.ignoreMouse = false;
      }, 500);
    };

    SelectBox.prototype.options = function() {
      var _this = this;
      if (this.floater == null) {
        return;
      }
      this.fake.focus();
      this.floater.empty();
      this.$list = $("<div/>").appendTo(this.floater);
      this.$list.attr("class", "reform-selectbox-list");
      return this.orig.find("option").each(function(i, option) {
        var $item, $option;
        $option = $(option);
        $item = $("<div/>");
        $item.attr("class", "reform-selectbox-item");
        if ($option.is(":selected")) {
          $item.addClass("selected");
        }
        if ($option.is(":disabled")) {
          $item.addClass("disabled");
        }
        $item.attr("title", $option.attr("title"));
        $item.attr("value", $option.val());
        $item.text($option.text());
        $item.appendTo(_this.$list);
        $item.on("mousedown", function(e) {
          return e.preventDefault();
        });
        $item.hover(function() {
          if (!_this.ignoreMouse) {
            return _this.hover($item);
          }
        });
        return $item.on("click", function(e) {
          if ($item.is('.disabled')) {
            return;
          }
          if (_this.orig.is("[multiple]")) {
            $item.toggleClass("selected");
            e.stopPropagation();
          } else {
            $item.siblings().andSelf().removeClass("selected");
            $item.addClass("selected");
          }
          return _this.orig.val(_this.value()).trigger("change");
        });
      });
    };

    SelectBox.prototype.value = function() {
      return this.$list.find(".reform-selectbox-item.selected").map(function() {
        return $(this).val();
      });
    };

    SelectBox.prototype.open = function() {
      var $window, pos;
      this.orig.trigger("reform.open");
      this.floater = $("<div/>");
      this.floater.attr("class", "reform-selectbox-options");
      this.floater.css("min-width", this.fake.outerWidth());
      this.floater.addClass(this.orig.data("options-class"));
      this.body.append(this.floater);
      this.options();
      this.body.one("click", this.close);
      pos = this.fake.offset();
      this.floater.show();
      $window = $(window);
      if (pos.top + this.floater.outerHeight() > $window.height()) {
        pos.top = pos.top - this.floater.outerHeight() + this.fake.outerHeight();
      }
      if (pos.left + this.floater.outerWidth() > $window.width()) {
        pos.left = pos.left - this.floater.outerWidth() + this.fake.outerWidth();
      }
      return this.floater.css(pos);
    };

    SelectBox.prototype.close = function() {
      var _ref1;
      if ((_ref1 = this.floater) != null) {
        _ref1.remove();
      }
      return this.floater = null;
    };

    SelectBox.prototype.refresh = function() {
      var plural, selected, title;
      this.fake.toggleClass("disabled", this.orig.is(":disabled"));
      title = this.orig.data('title');
      if (!title) {
        selected = this.orig.find("option").filter(function() {
          return this.selected && $(this).data("count-option") !== "no";
        });
        plural = this.orig.data("plural");
        title = (plural != null) && selected.length > 1 ? "" + selected.length + " " + plural : selected.map(function() {
          return $(this).text();
        }).get().join(", ");
        if (!title) {
          title = this.orig.attr("title");
        }
        if (title == null) {
          title = "Select";
        }
      }
      this.fake.contents().filter(function() {
        return this.nodeType === Node.TEXT_NODE;
      }).remove();
      this.fake.append(document.createTextNode(title));
      return this.options();
    };

    return SelectBox;

  })();

  module.exports = SelectBox;

}).call(this);

});

require.define("/lib_test/autocompletebox_test.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.4.0
(function() {
  var AutocompleteBox, _ref;

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  AutocompleteBox = require("../lib/autocompletebox");

  module.exports = function() {
    var $fake, $orig, setup;
    QUnit.module("AutocompleteBox");
    $orig = null;
    $fake = null;
    setup = function(options, attrs) {
      if (options == null) {
        options = [];
      }
      if (attrs == null) {
        attrs = "";
      }
      $orig = $("<select class=\"reform-autocompletebox\" " + attrs + ">" + (options.map(function(opt) {
        return "<option value=\"" + opt.value + "\">" + opt.text + "</option>";
      }).join("")) + "</select>");
      $orig.appendTo("#qunit-fixture");
      new AutocompleteBox($orig.get(0));
      return $fake = $orig.parent();
    };
    test("The fake wraps the original", 1, function() {
      setup();
      return ok($fake.is(".reform-autocompletebox-fake"), "Parent should be the fake");
    });
    return test("Title input created", 1, function() {
      setup();
      return ok($fake.find(':first-child').hasClass("reform-autocompletebox-input"), "Fake should have title input");
    });
  };

}).call(this);

});

require.define("/lib/autocompletebox.js", function (require, module, exports, __dirname, __filename) {
// Generated by CoffeeScript 1.4.0
(function() {
  var AutocompleteBox, Cache, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  AutocompleteBox = (function() {

    AutocompleteBox.prototype.KEY = {
      UP: 38,
      DOWN: 40,
      DEL: 46,
      RETURN: 13,
      ESC: 27,
      PAGEUP: 33,
      PAGEDOWN: 34
    };

    AutocompleteBox.cache = null;

    function AutocompleteBox(select, options) {
      var delay, inlineOptions,
        _this = this;
      this.select = select;
      this.onChange = __bind(this.onChange, this);

      this.parse = __bind(this.parse, this);

      this.request = __bind(this.request, this);

      this.colorTitles = __bind(this.colorTitles, this);

      this.refresh = __bind(this.refresh, this);

      this.close = __bind(this.close, this);

      this.open = __bind(this.open, this);

      this.selectCurrent = __bind(this.selectCurrent, this);

      this.setHover = __bind(this.setHover, this);

      this.fillOptions = __bind(this.fillOptions, this);

      this.options = {
        data: [],
        url: null,
        dataType: 'json',
        max: 1000,
        selected: 0,
        minChars: 2,
        delay: 300,
        matchCase: false,
        colorTitle: true,
        matchAll: false,
        placeholder: "Input search string...",
        title: null,
        autocompleteClass: 'reform-autocompletebox',
        itemClass: 'reform-autocompletebox-item',
        hoverClass: 'reform-autocompletebox-hover',
        listClass: 'reform-autocompletebox-list',
        optionsClass: 'reform-autocompletebox-options',
        fakeClass: 'reform-autocompletebox-fake',
        inputClass: 'reform-autocompletebox-input'
      };
      this.currentList = [];
      this.orig = $(this.select);
      if (this.orig.is(".reformed")) {
        return;
      }
      inlineOptions = this.orig.data();
      $.extend(this.options, options);
      $.extend(this.options, inlineOptions);
      this.cache = new Cache(this.options);
      this.body = $("body");
      if (!(this.options.url != null)) {
        this.options.delay = 0;
      }
      this.fake = $("<div/>");
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "reformed");
      this.fake.removeClass(this.options.autocompleteClass).addClass(this.options.fakeClass);
      if (this.orig.is(":disabled")) {
        this.fake.addClass("disabled");
      }
      this.input = $("<input/>");
      this.input.addClass(this.options.inputClass + " placeholder");
      if (this.options.placeholder != null) {
        this.input.val(this.options.placeholder);
      }
      if (this.options.title != null) {
        this.input.val(this.options.title);
        this.currentSelection = this.options.title;
        this.input.removeClass("placeholder");
      }
      if (this.options.arrow != null) {
        this.fake.addClass('arrow');
      }
      this.fake.on("click", function(e) {
        if (_this.orig.is(":disabled")) {
          return;
        }
        e.stopPropagation();
        if (_this.floater === null) {
          _this.open();
          return _this.fillOptions();
        } else {
          return _this.close();
        }
      });
      this.fake.append(this.input);
      this.orig.after(this.fake).appendTo(this.fake);
      this.floater = null;
      delay = (function() {
        var timer;
        timer = 0;
        return function(callback, ms) {
          clearTimeout(timer);
          return timer = setTimeout(callback, ms);
        };
      })();
      this.input.on("click", function(e) {
        if (_this.input.val() === _this.options.placeholder) {
          _this.input.val('');
          return _this.input.removeClass('placeholder');
        }
      });
      this.input.on("keydown.autocomplete", function(e) {
        e.stopPropagation();
        if (_this.orig.is(":disabled")) {
          return;
        }
        if (e.keyCode === _this.KEY.UP) {
          e.preventDefault();
        }
        switch (e.keyCode) {
          case _this.KEY.DOWN:
            if (_this.floater === null) {
              _this.onChange(function() {
                return _this.options.selected = 0;
              });
            } else {
              _this.setHover(_this.options.selected + 1);
              _this.scrollTo();
            }
            return;
          case _this.KEY.UP:
            _this.setHover(_this.options.selected - 1);
            _this.scrollTo();
            return;
          case _this.KEY.ESC:
            _this.close();
            return;
        }
        return delay(function() {
          _this.currentSelection = _this.input.val();
          _this.orig.val(null);
          _this.orig.data('title', _this.currentSelection);
          switch (e.keyCode) {
            case _this.KEY.RETURN:
              return _this.selectCurrent();
            default:
              _this.options.selected = 0;
              return _this.onChange(function() {});
          }
        }, _this.options.delay);
      });
      this.input.on("blur", function(e) {
        return _this.close();
      });
      this.refresh();
      this.body.on("reform.open", function(e) {
        if (e.target !== _this.select) {
          return _this.close();
        }
      });
      this.orig.on("reform.sync change DOMSubtreeModified", function() {
        return setTimeout(_this.refresh, 0);
      });
      this.orig.on("reform.close", function(e) {
        return _this.close();
      });
      this.orig.on("reform.fill", function(e, data) {
        return _this.options.data = _this.parse(data, _this.currentSelection);
      });
      $('.' + this.options.optionsClass).remove();
    }

    AutocompleteBox.prototype.scrollTo = function() {
      var $container, $item, newScrollTop, scrollTop;
      $item = this.floater.find('.' + this.options.listClass).find(':nth-child(' + this.options.selected + ')');
      $container = $item.parent();
      newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop();
      if (newScrollTop > ($container.outerHeight() - $item.outerHeight())) {
        scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight();
        return $container.scrollTop(scrollTop);
      } else {
        return $container.scrollTop(0);
      }
    };

    AutocompleteBox.prototype.fillOptions = function() {
      var $list, isAny, num,
        _this = this;
      if (this.floater == null) {
        return;
      }
      this.floater.empty();
      this.currentList = [];
      $list = $("<div/>").appendTo(this.floater);
      $list.attr("class", this.options.listClass);
      isAny = false;
      num = 0;
      $.each(this.options.data, function(i, item) {
        var $item, currentSelection, title;
        if (_this.options.max <= num) {
          return false;
        }
        if (!_this.options.matchAll && (_this.currentSelection != null)) {
          title = item.title;
          currentSelection = _this.currentSelection;
          if (!_this.options.matchCase) {
            title = title.toLowerCase();
            currentSelection = currentSelection.toLowerCase();
          }
          if (title.indexOf(currentSelection) === -1) {
            return;
          }
        }
        _this.currentList.push(item);
        isAny = true;
        $item = $("<div/>");
        $item.attr("class", _this.options.itemClass);
        $item.attr("title", item.title);
        $item.attr("value", item.value);
        $item.html(item.title);
        $item.appendTo($list);
        $item.on("mousedown", function(e) {
          return e.preventDefault();
        });
        $item.on("click", function(e) {
          return _this.selectCurrent();
        });
        $item.on("mouseenter", function(e) {
          return _this.setHover($(e.target).index() + 1);
        });
        return num++;
      });
      if (!isAny) {
        return this.close();
      } else if ((this.floater != null) && this.options.colorTitle) {
        return this.colorTitles();
      }
    };

    AutocompleteBox.prototype.setHover = function(newSelected) {
      var $list;
      if (!(this.floater != null)) {
        return;
      }
      $list = this.floater.find('.' + this.options.listClass);
      if (newSelected < 1) {
        newSelected = $list.children().length;
      }
      if (newSelected > $list.children().length) {
        newSelected = 1;
      }
      this.options.selected = newSelected;
      $list.children().removeClass(this.options.hoverClass);
      return $list.find(':nth-child(' + this.options.selected + ')').addClass(this.options.hoverClass);
    };

    AutocompleteBox.prototype.selectCurrent = function() {
      var $selected, title, value;
      if (!(this.floater != null) || this.options.selected === 0) {
        return;
      }
      $selected = this.floater.find('.' + this.options.listClass).find(':nth-child(' + this.options.selected + ')');
      $selected.addClass('selected');
      value = $selected.attr("value");
      title = $selected.attr("title");
      this.setContent(value, title);
      return this.close();
    };

    AutocompleteBox.prototype.setContent = function(value, title) {
      this.orig.val(value);
      this.orig.data('title', title);
      this.input.val(title);
      return this.orig.trigger("change");
    };

    AutocompleteBox.prototype.open = function() {
      var $window, pos,
        _this = this;
      this.orig.trigger("reform.open");
      this.floater = $("<div/>");
      this.floater.attr("class", this.options.optionsClass);
      this.floater.css("min-width", this.fake.outerWidth() - 2);
      this.floater.addClass(this.orig.data("options-class"));
      this.body.append(this.floater);
      this.body.on("click.autocomplete", function(e) {
        if (!$(e.target).hasClass(_this.options.inputClass)) {
          _this.body.off("click.autocomplete");
          return _this.close();
        }
      });
      pos = this.fake.offset();
      this.floater.show();
      $window = $(window);
      pos.top += this.fake.outerHeight();
      return this.floater.css(pos);
    };

    AutocompleteBox.prototype.close = function() {
      var isSameCaseInsensitive, isSameCaseSensitive, _ref1;
      if ((_ref1 = this.floater) != null) {
        _ref1.remove();
      }
      this.floater = null;
      if (this.currentList.length === 1) {
        isSameCaseSensitive = this.input.val() === this.currentList[0].title;
        isSameCaseInsensitive = this.input.val().toLowerCase() === this.currentList[0].title.toLowerCase();
        if ((this.options.matchCase && isSameCaseSensitive) || (!this.options.matchCase && isSameCaseInsensitive)) {
          return this.setContent(this.currentList[0].value, this.currentList[0].title);
        }
      }
    };

    AutocompleteBox.prototype.refresh = function() {
      this.fake.toggleClass("disabled", this.orig.is(":disabled"));
      this.input.removeAttr('disabled');
      if (this.orig.is(":disabled")) {
        return this.input.attr("disabled", "disabled");
      }
    };

    AutocompleteBox.prototype.colorTitles = function() {
      var colorTitle,
        _this = this;
      colorTitle = function(title) {
        var coloredTitle, pos;
        coloredTitle = title;
        if (_this.currentSelection != null) {
          pos = title.toLowerCase().indexOf(_this.currentSelection.toLowerCase());
          if (pos !== -1) {
            coloredTitle = title.substr(0, pos);
            coloredTitle += "<strong>";
            coloredTitle += title.substr(pos, _this.currentSelection.length);
            coloredTitle += "</strong>";
            coloredTitle += title.substr(pos + _this.currentSelection.length, title.length);
          }
        }
        return coloredTitle;
      };
      return this.floater.find("." + this.options.itemClass).each(function(num, item) {
        var $item, title;
        $item = $(item);
        title = $item.html();
        title = colorTitle(title);
        return $item.html(title);
      });
    };

    AutocompleteBox.prototype.request = function(term, success, failure) {
      var data, extraParams,
        _this = this;
      data = this.cache.load(term);
      if (data) {
        return success();
      } else if (this.options.url != null) {
        extraParams = {
          timestamp: new Date()
        };
        if (this.options.extraParams != null) {
          $.each(this.options.extraParams, function(key, param) {
            return extraParams[key] = (typeof param === "function" ? param() : param);
          });
        }
        if (this.ajaxInProgress) {
          this.lastXHR.abort();
        }
        this.ajaxInProgress = true;
        return this.lastXHR = $.ajax({
          dataType: this.options.dataType,
          url: this.options.url,
          data: $.extend({
            q: term,
            matchCase: this.options.matchCase,
            limit: this.options.max
          }, extraParams),
          success: function(data) {
            var parsed, _base;
            _this.ajaxInProgress = false;
            parsed = (typeof (_base = _this.options).parse === "function" ? _base.parse(data, term) : void 0) || _this.parse(data, term);
            _this.options.data = parsed;
            _this.cache.add(term, parsed);
            return success();
          },
          error: function(data) {
            this.ajaxInProgress = false;
            return failure();
          }
        });
      } else {
        return failure('Set options.url', term);
      }
    };

    AutocompleteBox.prototype.parse = function(data, term) {
      var parsed,
        _this = this;
      parsed = [];
      $.each(data, function(num, item) {
        return parsed.push({
          value: item.value,
          title: _this.options.formatResult && _this.options.formatResult(item) || item.title
        });
      });
      return parsed;
    };

    AutocompleteBox.prototype.onChange = function(callback) {
      var failureCallback, successCallback,
        _this = this;
      if (this.options.minChars >= this.currentSelection.length) {
        this.close();
        return;
      }
      successCallback = function() {
        if (_this.floater === null) {
          _this.open();
          _this.fillOptions();
        } else {
          _this.fillOptions();
        }
        _this.orig.trigger('ajaxRequestFinished');
        return callback();
      };
      failureCallback = function() {
        return _this.orig.trigger('ajaxRequestFinished');
      };
      if (this.options.url != null) {
        this.orig.trigger('ajaxRequestStarted');
        return this.request(this.currentSelection, successCallback, failureCallback);
      } else {
        return successCallback();
      }
    };

    return AutocompleteBox;

  })();

  Cache = (function() {

    Cache.prototype.data = {};

    Cache.prototype.length = 0;

    Cache.prototype.options = {
      cacheLength: 100,
      matchContains: false,
      matchSubset: true
    };

    function Cache(options) {
      this.load = __bind(this.load, this);
      $.extend(this.options, options);
    }

    Cache.prototype.matchSubset = function(s, sub) {
      var i;
      if (!this.options.matchCase) {
        s = s.toLowerCase();
      }
      i = s.indexOf(sub);
      if (this.options.matchContains === "word") {
        i = s.toLowerCase().search("\\b" + sub.toLowerCase());
      }
      if (i === -1) {
        return false;
      }
      return i === 0 || this.options.matchContains;
    };

    Cache.prototype.add = function(q, value) {
      if (this.length > this.options.cacheLength) {
        flush();
      }
      if (!this.data[q]) {
        this.length++;
      }
      return this.data[q] = value;
    };

    Cache.prototype.flush = function() {
      this.data = {};
      return this.length = 0;
    };

    Cache.prototype.load = function(q) {
      var c, csub, i, self;
      if (!this.options.cacheLength || !this.length) {
        return null;
      }
      if (this.data[q]) {
        return this.data[q];
      } else if (this.options.matchSubset) {
        i = q.length - 1;
        while (i >= this.options.minChars) {
          c = this.data[q.substr(0, i)];
          if (c) {
            csub = [];
            self = this;
            $.each(c, function(i, x) {
              if (self.matchSubset(x.title, q)) {
                return csub[csub.length] = x;
              }
            });
            return csub;
          }
          i--;
        }
      }
      return null;
    };

    return Cache;

  })();

  module.exports = AutocompleteBox;

}).call(this);

});

require.define("/lib_test/test.js", function (require, module, exports, __dirname, __filename) {
    // Generated by CoffeeScript 1.4.0
(function() {

  require("./checkbox_test")();

  require("./selectbox_test")();

  require("./autocompletebox_test")();

}).call(this);

});
require("/lib_test/test.js");
