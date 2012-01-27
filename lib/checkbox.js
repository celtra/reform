(function() {
  var CheckBox,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (typeof $ === "undefined" || $ === null) $ = require("jquery-commonjs");

  CheckBox = (function() {

    function CheckBox(input) {
      this.refresh = __bind(this.refresh, this);
      var _this = this;
      this.orig = $(input);
      if (this.orig.is(":radio")) {
        this.siblings = $("[name='" + (this.orig.attr("name")) + "']").not(this.orig);
      }
      this.fake = $("<div/>");
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "");
      this.fake.removeClass("reform-checkbox").addClass("reform-checkbox-fake");
      if (this.orig.is(":checked")) this.fake.addClass("checked");
      if (this.orig.is(":disabled")) this.fake.addClass("disabled");
      if (this.orig.is(":radio")) this.fake.addClass("radio");
      this.orig.after(this.fake).appendTo(this.fake);
      this.fake.on("click", function() {
        return _this.orig.trigger("click");
      });
      this.orig.on("click", function(e) {
        var _ref;
        e.stopPropagation();
        if (_this.orig.is(":disabled")) return;
        return (_ref = _this.siblings) != null ? _ref.each(function(i, el) {
          return $(el).parent().removeClass("checked");
        }) : void 0;
      });
      this.fake.on("mousedown", function(e) {
        return e.preventDefault();
      });
      this.orig.on("change", this.refresh);
    }

    CheckBox.prototype.refresh = function() {
      this.fake.removeClass("checked");
      if (this.orig.is(":checked")) return this.fake.addClass("checked");
    };

    return CheckBox;

  })();

  module.exports = CheckBox;

}).call(this);
