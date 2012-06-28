(function(){var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
}

require.paths = [];
require.modules = {};
require.cache = {};
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
            x = path.normalize(x);
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
            var pkgfile = path.normalize(x + '/package.json');
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
        for (var key in obj) res.push(key);
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

(function () {
    var process = {};
    
    require.define = function (filename, fn) {
        if (require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            return require(file, dirname);
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = { exports : {} };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process
            );
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process){function filter (xs, fn) {
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

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process){var process = module.exports = {};

process.nextTick = (function () {
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

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();
});

require.define("/reform.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var CheckBox, Reform, SelectBox, _ref;

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  CheckBox = require("./checkbox");

  SelectBox = require("./selectbox");

  Reform = (function() {

    function Reform() {}

    Reform.prototype.process = function(node) {
      var cls, control, n, _ref1, _results;
      _ref1 = Reform.controls;
      _results = [];
      for (cls in _ref1) {
        control = _ref1[cls];
        _results.push((function() {
          var _i, _len, _ref2, _results1;
          _ref2 = $(node).parent().find("." + cls);
          _results1 = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            n = _ref2[_i];
            _results1.push(new control(n));
          }
          return _results1;
        })());
      }
      return _results;
    };

    Reform.prototype.observe = function() {
      var _this = this;
      $(document).on("ready", function() {
        return _this.process("body");
      });
      return $(document).on("DOMNodeInserted", function(e) {
        return _this.process(e.target);
      });
    };

    return Reform;

  })();

  Reform.controls = {
    "reform-checkbox": CheckBox,
    "reform-selectbox": SelectBox
  };

  module.exports = Reform;

}).call(this);
});

require.define("/checkbox.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
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

require.define("/selectbox.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
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

      this.orig = $(this.select);
      if (this.orig.is(".reformed")) {
        return;
      }
      this.body = $("body");
      this.fake = $("<div/>");
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "reformed");
      this.fake.removeClass("reform-selectbox").addClass("reform-selectbox-fake");
      if (this.orig.is(":disabled")) {
        this.fake.addClass("disabled");
      }
      this.refresh();
      this.orig.after(this.fake).appendTo(this.fake);
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

    SelectBox.prototype.open = function() {
      var $list, $window, pos,
        _this = this;
      this.orig.trigger("reform.open");
      this.floater = $("<div/>");
      this.floater.attr("class", "reform-selectbox-options");
      this.floater.css("min-width", this.fake.outerWidth());
      this.floater.addClass(this.orig.data("options-class"));
      this.body.append(this.floater);
      $list = $("<div/>").appendTo(this.floater);
      $list.attr("class", "reform-selectbox-list");
      this.orig.find("option").each(function(i, option) {
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
        $item.appendTo($list);
        $item.on("mousedown", function(e) {
          return e.preventDefault();
        });
        return $item.on("click", function(e) {
          var values;
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
          values = $item.parent().find(".reform-selectbox-item.selected").map(function() {
            return $(this).val();
          });
          return _this.orig.val(values).trigger("change");
        });
      });
      this.body.one("click", this.close);
      this.floater.show();
      $window = $(window);
      pos = this.fake.offset();
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
      selected = this.orig.find("option").filter(function() {
        return this.selected;
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
      this.fake.contents().filter(function() {
        return this.nodeType === Node.TEXT_NODE;
      }).remove();
      return this.fake.append(document.createTextNode(title));
    };

    return SelectBox;

  })();

  module.exports = SelectBox;

}).call(this);
});

require.define("/init.coffee",function(require,module,exports,__dirname,__filename,process){(function() {
  var Reform, reform;

  Reform = require("./reform");

  reform = new Reform;

  reform.observe();

}).call(this);
});
require("/init.coffee");
})();
