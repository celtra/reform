;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){
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


},{"jquery-commonjs":6}],2:[function(require,module,exports){
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


},{"jquery-commonjs":6}],3:[function(require,module,exports){
var CheckBox;

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

CheckBox = require("../src/checkbox.coffee");

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


},{"../src/checkbox.coffee":1,"jquery-commonjs":6}],4:[function(require,module,exports){
var SelectBox;

if (window.$ == null) {
  window.$ = require("jquery-commonjs");
}

SelectBox = require("../src/selectbox.coffee");

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


},{"../src/selectbox.coffee":2,"jquery-commonjs":6}],5:[function(require,module,exports){
require("./checkbox_test.coffee")();

require("./selectbox_test.coffee")();


},{"./checkbox_test.coffee":3,"./selectbox_test.coffee":4}],6:[function(require,module,exports){

},{}]},{},[5])
;