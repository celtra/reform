(function() {
  var CheckBox,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.$ == null) window.$ = require("jquery-commonjs");

  CheckBox = (function() {

    function CheckBox(input) {
      this.refresh = __bind(this.refresh, this);
      var _this = this;
      this.orig = $(input);
      if (this.orig.is(".reformed")) return;
      if (this.orig.is(":radio")) {
        this.siblings = $("[name='" + (this.orig.attr("name")) + "']").not(this.orig);
      }
      this.fake = $("<label/>");
      this.fake.attr("class", this.orig.attr("class"));
      this.orig.hide().attr("class", "reformed");
      this.fake.removeClass("reform-checkbox").addClass("reform-checkbox-fake");
      if (this.orig.is(":checked")) this.fake.addClass("checked");
      if (this.orig.is(":disabled")) this.fake.addClass("disabled");
      if (this.orig.is(":radio")) this.fake.addClass("radio");
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
      if (this.orig.is(":checked")) this.fake.addClass("checked");
      return (_ref = this.siblings) != null ? _ref.each(function() {
        return $(this).parent().removeClass("checked");
      }) : void 0;
    };

    return CheckBox;

  })();

  module.exports = CheckBox;

}).call(this);
