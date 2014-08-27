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
      this.positionFloater = __bind(this.positionFloater, this);
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
      this.fake.addClass("closed");
      origClass = this.orig.attr('class');
      this.customClass = origClass.replace(this.options.reformClass, '');
      this.customClass = this.customClass.trim();
      this.fake.addClass('reform').addClass(this.customClass).addClass(this.options.fakeClass).addClass(this.options.uiClass);
      if (this.orig.is(':disabled')) {
        this.fake.addClass('disabled');
      }
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
      var $itemMultiple;
      if (this.floater == null) {
        return;
      }
      this.fake.focus();
      this.floater.empty();
      this.height = $(document).height();
      this.width = $(document).width();
      this.$list = $("<div/>").appendTo(this.floater);
      this.$list.attr("class", "reform-floater-list");
      this.$list.addClass(this.options.uiClass);
      this.textMultiple = "";
      $itemMultiple = $("<div/>");
      $itemMultiple.addClass("reform-floater-item selected");
      this.listMultiple = [];
      this.selectBoxTitle = this.orig.data('title');
      this.orig.find("option").each((function(_this) {
        return function(i, option) {
          var $item, $itemSelected, $option;
          $option = $(option);
          $item = $("<div/>");
          if ($option.is(":selected")) {
            $item.addClass("selected");
          }
          if ($option.is(":disabled")) {
            $item.addClass("disabled");
          }
          $item.addClass("reform-floater-item");
          $item.attr("title", $option.attr("title"));
          $item.attr("value", $option.val());
          $item.append(_this.createItemContent($option));
          if ($option.is(":selected")) {
            if (_this.orig.is("[multiple]")) {
              _this.listMultiple.push($option.html());
            } else {
              $item.addClass("selected");
              if (_this.selectBoxTitle) {
                $itemSelected = $item.clone();
                $itemSelected.addClass(_this.attributeType);
                $itemSelected.prependTo(_this.$list);
              }
            }
          }
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
      if (this.selectBoxTitle && this.listMultiple.length > 0) {
        $itemMultiple.html(this.listMultiple.join(", "));
        return $itemMultiple.prependTo(this.$list);
      }
    };

    SelectBoxAbstract.prototype.value = function() {
      return this.$list.find(".reform-floater-item.selected").map(function() {
        return $(this).val();
      });
    };

    SelectBoxAbstract.prototype.open = function() {
      this.orig.trigger("reform.open");
      this.floater = $("<div/>");
      this.floater.css("min-width", this.fake.outerWidth());
      this.floater.addClass('reform-floater reform reform-floater-ui').addClass(this.customClass).addClass(this.orig.data("floater-class")).addClass(this.options.uiClass).addClass('reform-' + this.options.theme);
      this.body.append(this.floater);
      this.createOptions();
      this.body.one("click", this.close);
      this.floater.show();
      this.positionFloater();
      this.fake.addClass("opened");
      return this.fake.removeClass("closed");
    };

    SelectBoxAbstract.prototype.close = function() {
      var _ref;
      if ((_ref = this.floater) != null) {
        _ref.remove();
      }
      this.floater = null;
      this.fake.removeClass("opened");
      this.fake.addClass("closed");
      if (!this.orig.is(":disabled")) {
        return this.fake.removeClass("disabled");
      }
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

    SelectBoxAbstract.prototype.positionFloater = function() {
      var pos, posTopAfterAnimation;
      if (this.floater != null) {
        pos = this.fake.offset();
        if (pos.top + this.floater.outerHeight() > this.height) {
          pos.top = pos.top - this.floater.outerHeight();
          if (this.orig.data('shift')) {
            posTopAfterAnimation = pos.top - parseInt(this.orig.data('shift'));
            pos.top -= 1;
          }
        } else {
          pos.top = pos.top + this.fake.outerHeight();
          if (this.orig.data('shift')) {
            posTopAfterAnimation = pos.top + parseInt(this.orig.data('shift'));
            pos.top += 1;
          }
        }
        if (pos.left + this.floater.outerWidth() > this.width) {
          pos.left = pos.left - this.floater.outerWidth() + this.fake.outerWidth();
        }
        this.floater.css(pos);
        if (this.orig.data('shift')) {
          return this.floater.animate({
            top: posTopAfterAnimation
          }, 200);
        }
      }
    };

    return SelectBoxAbstract;

  })();

  module.exports = SelectBoxAbstract;

}).call(this);
