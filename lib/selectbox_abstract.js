(function() {
  var SelectBoxAbstract,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  SelectBoxAbstract = (function() {
    function SelectBoxAbstract(select, options) {
      var $selectedItem, origClass;
      this.select = select;
      this.refresh = __bind(this.refresh, this);
      this.close = __bind(this.close, this);
      this.open = __bind(this.open, this);
      this.createOptions = __bind(this.createOptions, this);
      this.orig = $(this.select);
      this.options = $.extend({
        fakeClass: 'reform-selectbox-fake'
      }, options);
      if (this.orig.is(".reformed")) {
        return;
      }
      this.body = $("body");
      this.fake = $("<div/>");
      this.fake.attr("tabindex", 0);
      origClass = this.orig.attr('class');
      this.customClass = origClass.replace(this.options.reformClass, '');
      this.customClass = this.customClass.trim();
      this.fake.addClass('reform');
      this.fake.addClass(this.customClass);
      this.fake.addClass(this.options.fakeClass);
      if (this.orig.is(":disabled")) {
        this.fake.addClass("disabled");
      }
      this.fake.addClass(this.options.uiClass);
      this.orig.hide().attr("class", "reformed");
      $selectedItem = $('<div></div>');
      $selectedItem.addClass('selected-item');
      $selectedItem.appendTo(this.fake);
      this.refresh();
      this.orig.after(this.fake).appendTo(this.fake);
      this.fake.on("keyup", (function(_this) {
        return function(ev) {
          if (ev.keyCode === 27) {
            ev.preventDefault();
            return ev.stopPropagation();
          }
        };
      })(this));
      this.fake.on("keydown", (function(_this) {
        return function(ev) {
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
            if (_this.floater == null) {
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
        };
      })(this));
      this.floater = null;
      this.fake.on("click", (function(_this) {
        return function(e) {
          if (_this.orig.is(":disabled")) {
            return;
          }
          e.stopPropagation();
          if (_this.floater === null) {
            return _this.open();
          } else {
            return _this.close();
          }
        };
      })(this));
      this.fake.on("mousedown", function(e) {
        return e.preventDefault();
      });
      this.orig.on("reform.sync change DOMSubtreeModified", this.refresh);
      this.body.on("reform.open", (function(_this) {
        return function(e) {
          if (e.target !== _this.select) {
            return _this.close();
          }
        };
      })(this));
    }

    SelectBoxAbstract.prototype.hover = function($item) {
      $item.siblings().andSelf().removeClass("hover");
      return $item.addClass("hover");
    };

    SelectBoxAbstract.prototype.scrollTo = function($item) {
      var $container, newScrollTop, scrollTop;
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
      return this.to = setTimeout((function(_this) {
        return function() {
          return _this.ignoreMouse = false;
        };
      })(this), 500);
    };

    SelectBoxAbstract.prototype.createOptions = function() {
      if (this.floater == null) {
        return;
      }
      this.fake.focus();
      this.floater.empty();
      this.$list = $("<div/>").appendTo(this.floater);
      this.$list.attr("class", "reform-floater-list");
      this.$list.addClass(this.options.uiClass);
      return this.orig.find("option").each((function(_this) {
        return function(i, option) {
          var $item, $option;
          $option = $(option);
          $item = $("<div/>");
          $item.attr("class", "reform-floater-item");
          if ($option.is(":selected")) {
            $item.addClass("selected");
          }
          if ($option.is(":disabled")) {
            $item.addClass("disabled");
          }
          $item.attr("title", $option.attr("title"));
          $item.attr("value", $option.val());
          $item.append(_this.createItemContent($option));
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
        };
      })(this));
    };

    SelectBoxAbstract.prototype.value = function() {
      return this.$list.find(".reform-floater-item.selected").map(function() {
        return $(this).val();
      });
    };

    SelectBoxAbstract.prototype.open = function() {
      var $window, pos;
      this.orig.trigger("reform.open");
      this.floater = $("<div/>");
      this.floater.attr("class", "reform-floater");
      this.floater.css("min-width", this.fake.outerWidth());
      this.floater.addClass('reform');
      this.floater.addClass(this.customClass);
      this.floater.addClass(this.orig.data("floater-class"));
      this.floater.addClass(this.options.uiClass);
      this.floater.addClass('reform-floater-ui');
      this.floater.addClass('reform-' + this.options.theme);
      this.body.append(this.floater);
      this.createOptions();
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

    SelectBoxAbstract.prototype.close = function() {
      var _ref;
      if ((_ref = this.floater) != null) {
        _ref.remove();
      }
      return this.floater = null;
    };

    SelectBoxAbstract.prototype.refresh = function() {
      var $selectedItem, $title;
      this.fake.toggleClass("disabled", this.orig.is(":disabled"));
      $selectedItem = this.fake.find('.selected-item');
      $selectedItem.empty();
      if (this.orig.data('title')) {
        $selectedItem.append(this.orig.data('title'));
      } else {
        $title = this.createClosedItem();
        $selectedItem.append($title);
      }
      return this.createOptions();
    };

    return SelectBoxAbstract;

  })();

  module.exports = SelectBoxAbstract;

}).call(this);
