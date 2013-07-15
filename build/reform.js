;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
var AutocompleteBox,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

AutocompleteBox = (function() {
  function AutocompleteBox(select, options) {
    var _this = this;
    this.select = select;
    this.options = options;
    this.refresh = __bind(this.refresh, this);
    this.close = __bind(this.close, this);
    this.open = __bind(this.open, this);
    this.selectCurrent = __bind(this.selectCurrent, this);
    this.setHover = __bind(this.setHover, this);
    this.fillOptions = __bind(this.fillOptions, this);
    this.orig = $(this.select);
    this.options = {
      data: [
        {
          title: "one",
          value: "1"
        }, {
          title: "two",
          value: "2"
        }, {
          title: "three",
          value: "3"
        }, {
          title: "four",
          value: "4"
        }
      ],
      selected: 0,
      minType: 2,
      formatter: null,
      callback: null,
      cache: null
    };
    this.KEY = {
      UP: 38,
      DOWN: 40,
      DEL: 46,
      RETURN: 13,
      ESC: 27,
      PAGEUP: 33,
      PAGEDOWN: 34
    };
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
    this.input.on("keydown", function(e) {
      if (_this.orig.is(":disabled")) {
        return;
      }
      e.stopPropagation();
      return setTimeout(function() {
        if (_this.options.minType >= _this.input.val().length) {
          _this.close();
          return;
        }
        _this.currentSelection = _this.input.val();
        switch (e.keyCode) {
          case _this.KEY.DOWN:
            return _this.setHover(_this.options.selected + 1);
          case _this.KEY.UP:
            return _this.setHover(_this.options.selected - 1);
          case _this.KEY.RETURN:
            return _this.selectCurrent();
          case _this.KEY.ESC:
            return _this.close();
          default:
            _this.options.selected = 0;
            if (_this.floater === null) {
              _this.open();
              return _this.refresh();
            } else {
              return _this.refresh();
            }
        }
      }, 0);
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
    var $list, isAny,
      _this = this;
    if (this.floater == null) {
      return;
    }
    this.floater.empty();
    $list = $("<div/>").appendTo(this.floater);
    $list.attr("class", "reform-autocompletebox-list");
    isAny = false;
    $.each(this.options.data, function(i, item) {
      var $item;
      if (item.title.indexOf(_this.currentSelection) !== -1) {
        isAny = true;
        $item = $("<div/>");
        $item.attr("class", "reform-autocompletebox-item");
        $item.attr("title", item.title);
        $item.attr("value", item.value);
        $item.text(item.title);
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
        return $item.on("mouseenter", function(e) {
          var elem;
          if ($item.is('.disabled')) {
            return;
          }
          elem = e.target;
          return _this.setHover($(elem).index() + 1);
        });
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
    var $window, pos;
    this.orig.trigger("reform.open");
    this.floater = $("<div/>");
    this.floater.attr("class", "reform-autocompletebox-options");
    this.floater.css("min-width", this.fake.outerWidth() - 10 - 2);
    this.floater.addClass(this.orig.data("options-class"));
    this.body.append(this.floater);
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
    return this.fillOptions();
  };

  return AutocompleteBox;

})();

module.exports = AutocompleteBox;


},{"jquery-commonjs":6}],2:[function(require,module,exports){
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


},{"jquery-commonjs":6}],3:[function(require,module,exports){
var Reform, reform;

Reform = require("./reform.coffee");

reform = new Reform;

reform.observe();


},{"./reform.coffee":4}],4:[function(require,module,exports){
(function(){var AutocompleteBox, CheckBox, Reform, SelectBox;

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

CheckBox = require("./checkbox.coffee");

SelectBox = require("./selectbox.coffee");

AutocompleteBox = require("./autocompletebox.coffee");

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

  return Reform;

})();

Reform.controls = {
  "reform-checkbox": CheckBox,
  "reform-selectbox": SelectBox,
  "reform-autocompletebox": AutocompleteBox
};

module.exports = Reform;


})()
},{"./autocompletebox.coffee":1,"./checkbox.coffee":2,"./selectbox.coffee":5,"jquery-commonjs":6}],5:[function(require,module,exports){
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


},{"jquery-commonjs":6}],6:[function(require,module,exports){

},{}]},{},[3])
;