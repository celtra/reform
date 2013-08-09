;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var AutocompleteBox, Cache,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

AutocompleteBox = (function() {
  var cache;

  AutocompleteBox.prototype.options = {
    data: [],
    url: 'http://localhost:1111/demo/locations.json',
    dataType: 'json',
    max: 1000,
    selected: 0,
    minType: 2,
    delayType: 300,
    matchCase: true,
    colorTitle: true,
    matchAll: false
  };

  AutocompleteBox.prototype.KEY = {
    UP: 38,
    DOWN: 40,
    DEL: 46,
    RETURN: 13,
    ESC: 27,
    PAGEUP: 33,
    PAGEDOWN: 34
  };

  cache = null;

  function AutocompleteBox(select, options) {
    var delay,
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
    this.cache = new Cache(options);
    this["default"] = $.extend(this["default"], options);
    this.orig = $(this.select);
    if (this.orig.is(".reformed")) {
      return;
    }
    this.body = $("body");
    this.fake = $("<div/>");
    this.fake.attr("class", this.orig.attr("class"));
    this.orig.hide().attr("class", "reformed");
    this.fake.removeClass("reform-autocompletebox").addClass("reform-autocompletebox-fake");
    if (this.orig.is(":disabled")) {
      this.fake.addClass("disabled");
    }
    this.input = $("<input/>");
    this.input.addClass("reform-autocompletebox-input");
    this.fake.append(this.input);
    this.refresh();
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
    this.input.on("keyup.autocomplete", function(e) {
      if (_this.orig.is(":disabled")) {
        return;
      }
      e.stopPropagation();
      if (e.keyCode === _this.KEY.UP) {
        e.preventDefault();
      }
      switch (e.keyCode) {
        case _this.KEY.DOWN:
          if (_this.floater === null) {
            _this.onChange(function() {
              _this.open();
              return _this.refresh();
            });
          } else {
            _this.setHover(_this.options.selected + 1);
          }
          return;
        case _this.KEY.UP:
          _this.setHover(_this.options.selected - 1);
          return;
        case _this.KEY.ESC:
          _this.close();
          return;
      }
      return delay(function() {
        _this.currentSelection = _this.input.val();
        switch (e.keyCode) {
          case _this.KEY.RETURN:
            return _this.onChange(function() {
              return _this.selectCurrent();
            });
          default:
            _this.options.selected = 0;
            return _this.onChange(function() {
              if (_this.floater === null) {
                _this.open();
                return _this.refresh();
              } else {
                return _this.refresh();
              }
            });
        }
      }, _this.options.delayType);
    });
    this.input.on("blur", function(e) {
      return _this.close();
    });
    this.body.on("reform.open", function(e) {
      if (e.target !== _this.select) {
        return _this.close();
      }
    });
  }

  AutocompleteBox.prototype.fillOptions = function() {
    var $list, isAny, num,
      _this = this;
    if (this.floater == null) {
      return;
    }
    this.floater.empty();
    $list = $("<div/>").appendTo(this.floater);
    $list.attr("class", "reform-autocompletebox-list");
    isAny = false;
    num = 0;
    $.each(this.options.data, function(i, item) {
      var $item;
      if (_this.options.max <= num) {
        return false;
      }
      if (_this.options.matchAll || item.title.indexOf(_this.currentSelection) !== -1) {
        isAny = true;
        $item = $("<div/>");
        $item.attr("class", "reform-autocompletebox-item");
        $item.attr("title", item.title);
        $item.attr("value", item.value);
        $item.html(item.title);
        $item.appendTo($list);
        $item.on("mousedown", function(e) {
          return e.preventDefault();
        });
        $item.on("click", function(e) {
          if ($item.is('.disabled')) {
            return;
          }
          return _this.selectCurrent();
        });
        $item.on("mouseenter", function(e) {
          var elem;
          if ($item.is('.disabled')) {
            return;
          }
          elem = e.target;
          return _this.setHover($(elem).index() + 1);
        });
        return num++;
      }
    });
    if (!isAny) {
      return this.close();
    }
  };

  AutocompleteBox.prototype.setHover = function(newSelected) {
    var $list;
    if (this.floater == null) {
      return;
    }
    $list = this.floater.find('.reform-autocompletebox-list');
    if (newSelected < 1) {
      return;
    }
    if (newSelected > $list.children().length) {
      return;
    }
    this.options.selected = newSelected;
    $list.children().removeClass("reform-autocompletebox-hover");
    return $list.find(':nth-child(' + this.options.selected + ')').addClass("reform-autocompletebox-hover");
  };

  AutocompleteBox.prototype.selectCurrent = function() {
    var $selected, title, value;
    if ((this.floater == null) || this.options.selected === 0) {
      return;
    }
    $selected = this.floater.find('.reform-autocompletebox-list').find(':nth-child(' + this.options.selected + ')');
    $selected.addClass('selected');
    value = $selected.attr("value");
    title = $selected.attr("title");
    this.orig.val(value);
    this.input.val(title);
    this.orig.trigger("change");
    return this.close();
  };

  AutocompleteBox.prototype.open = function() {
    var $window, pos,
      _this = this;
    this.orig.trigger("reform.open");
    this.floater = $("<div/>");
    this.floater.attr("class", "reform-autocompletebox-options");
    this.floater.css("min-width", this.fake.outerWidth() - 10 - 2);
    this.floater.addClass(this.orig.data("options-class"));
    this.body.append(this.floater);
    this.body.on("click.autocomplete", function(e) {
      if (!$(e.target).hasClass('reform-autocompletebox-input')) {
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
    var _ref;
    if ((_ref = this.floater) != null) {
      _ref.remove();
    }
    return this.floater = null;
  };

  AutocompleteBox.prototype.refresh = function() {
    this.fake.toggleClass("disabled", this.orig.is(":disabled"));
    this.fillOptions();
    if ((this.floater != null) && this.options.colorTitle) {
      return this.colorTitles();
    }
  };

  AutocompleteBox.prototype.colorTitles = function() {
    var colorTitle,
      _this = this;
    colorTitle = function(title) {
      var coloredTitle, pos;
      coloredTitle = "";
      if (_this.options.matchCase) {
        pos = title.indexOf(_this.currentSelection);
      } else {
        pos = title.toLowerCase().indexOf(_this.currentSelection.toLowerCase());
      }
      if (pos !== -1) {
        coloredTitle += title.substr(0, pos);
        coloredTitle += "<strong>";
        coloredTitle += title.substr(pos, _this.currentSelection.length);
        coloredTitle += "</strong>";
        coloredTitle += title.substr(pos + _this.currentSelection.length, title.length);
      } else {
        coloredTitle = title;
      }
      return coloredTitle;
    };
    return this.floater.find(".reform-autocompletebox-item").each(function(num, item) {
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
    if (!this.options.matchCase) {
      term = term.toLowerCase();
    }
    data = this.cache.load(term);
    if (data) {
      if (data.length) {
        return success(data, term);
      }
    } else if (this.options.url != null) {
      extraParams = {
        timestamp: new Date()
      };
      if (this.options.extraParams != null) {
        $.each(this.options.extraParams, function(key, param) {
          return extraParams[key] = (typeof param === "function" ? param() : param);
        });
      }
      return $.ajax({
        dataType: this.options.dataType,
        url: this.options.url,
        data: $.extend({
          q: term,
          limit: this.options.max
        }, extraParams),
        success: function(data) {
          var parsed, _base;
          parsed = (typeof (_base = _this.options).parse === "function" ? _base.parse(data, term) : void 0) || _this.parse(data, term);
          _this.options.data = parsed;
          _this.cache.add(term, parsed);
          return success(parsed, term);
        },
        error: function(data) {
          return failure(data, term);
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
    if (this.options.minType >= this.input.val().length) {
      this.close();
      return;
    }
    successCallback = function(data) {
      _this.refresh();
      return callback();
    };
    failureCallback = function(data) {};
    if (this.options.url != null) {
      return this.request(this.currentSelection, successCallback, failureCallback);
    } else {
      this.refresh();
      return callback();
    }
  };

  return AutocompleteBox;

})();

Cache = (function() {
  Cache.prototype.data = {};

  Cache.prototype.length = 0;

  Cache.prototype.options = {
    cacheLength: 100,
    matchCase: true,
    matchContains: false
  };

  function Cache(options) {
    this.options = $.extend(this.options, options);
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
    var c, csub, i, k;
    if (!this.options.cacheLength || !this.length) {
      return null;
    }
    if (!this.options.url && this.options.matchContains) {
      csub = [];
      for (k in this.data) {
        if (k.length > 0) {
          c = data[k];
          $.each(c, function(i, x) {
            if (matchSubset(x.value, q)) {
              return csub.push(x);
            }
          });
        }
      }
      return csub;
    } else if (this.data[q]) {
      return this.data[q];
    } else if (this.options.matchSubset) {
      i = q.length - 1;
      while (i >= this.options.minChars) {
        c = this.data[q.substr(0, i)];
        if (c) {
          csub = [];
          $.each(c, function(i, x) {
            if (matchSubset(x.value, q)) {
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


},{"jquery-commonjs":7}],2:[function(require,module,exports){
var CheckBox,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

if (window.$ == null) {
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
    var _ref;
    this.fake.toggleClass("disabled", this.orig.is(":disabled"));
    this.fake.removeClass("checked");
    if (this.orig.is(":checked")) {
      this.fake.addClass("checked");
    }
    return (_ref = this.siblings) != null ? _ref.each(function() {
      return $(this).parent().removeClass("checked");
    }) : void 0;
  };

  return CheckBox;

})();

module.exports = CheckBox;


},{"jquery-commonjs":7}],3:[function(require,module,exports){
var AutocompleteBox, GeoAutocompleteBox,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

AutocompleteBox = require("./autocompletebox.coffee");

GeoAutocompleteBox = (function(_super) {
  __extends(GeoAutocompleteBox, _super);

  function GeoAutocompleteBox(selector, options) {
    this.parse = __bind(this.parse, this);
    this.request = __bind(this.request, this);
    this.options.matchAll = true;
    GeoAutocompleteBox.__super__.constructor.call(this, selector, options);
  }

  GeoAutocompleteBox.prototype.request = function(term, success, failure) {
    var data, geocoder, options, parsed,
      _this = this;
    if (!this.options.matchCase) {
      term = term.toLowerCase();
    }
    data = this.cache.load(term);
    if (data) {
      parsed = this.options.parse && this.options.parse(options.data) || this.parse(options.data);
      return success(term, parsed);
    } else if (this.options.url != null) {
      geocoder = new google.maps.Geocoder();
      options = {
        'address': term
      };
      return geocoder.geocode(options, function(results, status) {
        var _base;
        if (status === google.maps.GeocoderStatus.OK) {
          parsed = (typeof (_base = _this.options).parse === "function" ? _base.parse(results, term) : void 0) || _this.parse(results, term);
          _this.options.data = parsed;
          return success(parsed, term);
        } else {
          return failure(status, results);
        }
      });
    } else {
      return failure('Set options.url', term);
    }
  };

  GeoAutocompleteBox.prototype.parse = function(data, term) {
    var parsed,
      _this = this;
    parsed = [];
    $.each(data, function(num, item) {
      return parsed.push({
        value: item.geometry.location.lat() + "|" + item.geometry.location.lng(),
        title: item.formatted_address
      });
    });
    return parsed;
  };

  return GeoAutocompleteBox;

})(AutocompleteBox);

module.exports = GeoAutocompleteBox;


},{"./autocompletebox.coffee":1,"jquery-commonjs":7}],4:[function(require,module,exports){
var Reform, reform;

Reform = require("./reform.coffee");

reform = new Reform;

reform.observe();

window.Reform = reform;


},{"./reform.coffee":5}],5:[function(require,module,exports){
(function(){var AutocompleteBox, CheckBox, GeoAutocompleteBox, Reform, SelectBox;

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

CheckBox = require("./checkbox.coffee");

SelectBox = require("./selectbox.coffee");

AutocompleteBox = require("./autocompletebox.coffee");

GeoAutocompleteBox = require("./geoautocompletebox.coffee");

Reform = (function() {
  function Reform() {}

  Reform.prototype.process = function(node) {
    var cls, control, n, _ref, _results;
    _ref = Reform.controls;
    _results = [];
    for (cls in _ref) {
      control = _ref[cls];
      _results.push((function() {
        var _i, _len, _ref1, _results1;
        _ref1 = $(node).parent().find("." + cls);
        _results1 = [];
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          n = _ref1[_i];
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

  Reform.prototype.AutocompleteBox = AutocompleteBox;

  Reform.prototype.GeoAutocompleteBox = GeoAutocompleteBox;

  return Reform;

})();

Reform.controls = {
  "reform-checkbox": CheckBox,
  "reform-selectbox": SelectBox
};

module.exports = Reform;


})()
},{"./autocompletebox.coffee":1,"./checkbox.coffee":2,"./geoautocompletebox.coffee":3,"./selectbox.coffee":6,"jquery-commonjs":7}],6:[function(require,module,exports){
var SelectBox,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

if (window.$ == null) {
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

  SelectBox.prototype.options = function() {
    var $list,
      _this = this;
    if (this.floater == null) {
      return;
    }
    this.floater.empty();
    $list = $("<div/>").appendTo(this.floater);
    $list.attr("class", "reform-selectbox-list");
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
    var _ref;
    if ((_ref = this.floater) != null) {
      _ref.remove();
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


},{"jquery-commonjs":7}],7:[function(require,module,exports){

},{}]},{},[4])
;