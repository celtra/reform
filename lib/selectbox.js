(function() {
  var SelectBox,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof $ === "undefined" || $ === null) $ = require("jquery-commonjs");

  SelectBox = (function() {

    function SelectBox(select) {
      var _this = this;
      this.select = select;
      this.refresh = __bind(this.refresh, this);
      this.close = __bind(this.close, this);
      this.open = __bind(this.open, this);
      this.orig = $(this.select);
      if (this.orig.is(".reformed")) return;
      this.body = $("body");
      this.fake = $("<div/>");
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "reformed");
      this.fake.removeClass("reform-selectbox").addClass("reform-selectbox-fake");
      if (this.orig.is(":disabled")) this.fake.addClass("disabled");
      this.refresh();
      this.orig.after(this.fake).appendTo(this.fake);
      this.floater = $("<div/>");
      this.floater.attr("class", "reform-selectbox-options");
      this.floater.addClass(this.orig.attr("options-class"));
      this.body.append(this.floater);
      this.fake.on("click", function(e) {
        if (_this.orig.is(":disabled")) return;
        e.stopPropagation();
        if (_this.floater.is(":empty")) {
          return _this.open();
        } else {
          return _this.close();
        }
      });
      this.fake.on("mousedown", function(e) {
        return e.preventDefault();
      });
      this.orig.on("change", this.refresh);
      this.body.on("selectbox.open", function(e) {
        if (e.target !== _this.select) return _this.close();
      });
    }

    SelectBox.prototype.open = function() {
      var $list, $window, pos,
        _this = this;
      this.orig.trigger("selectbox.open");
      $list = $("<div/>").appendTo(this.floater);
      $list.attr("class", "reform-selectbox-list");
      this.orig.find("option").each(function(i, option) {
        var $item, $option;
        $option = $(option);
        $item = $("<div/>");
        $item.attr("class", "reform-selectbox-item");
        if ($option.is(":selected")) $item.addClass("selected");
        $item.attr("value", $option.val());
        $item.text($option.text());
        $item.appendTo($list);
        $item.on("mousedown", function(e) {
          return e.preventDefault();
        });
        return $item.on("click", function(e) {
          var values;
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
          _this.orig.val(values).trigger("change");
          return _this.refresh();
        });
      });
      $(document).one("click", this.close);
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
      return this.floater.hide().empty();
    };

    SelectBox.prototype.refresh = function() {
      var title;
      title = this.orig.find("option:selected").map(function() {
        return $(this).text();
      }).get().join(", ");
      if (!title) title = this.orig.attr("title");
      if (!title) title = "Select";
      this.fake.contents().filter(function() {
        return this.nodeType === Node.TEXT_NODE;
      }).remove();
      return this.fake.append(document.createTextNode(title));
    };

    return SelectBox;

  })();

  module.exports = SelectBox;

}).call(this);
