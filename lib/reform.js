(function() {
  var CheckBox, Reform, SelectBox;

  require("./element");

  if (typeof $ === "undefined" || $ === null) $ = require("jquery-commonjs");

  CheckBox = require("./checkbox");

  SelectBox = require("./selectbox");

  Reform = (function() {

    function Reform() {}

    Reform.prototype.process = function(node) {
      var cls, control, n, _ref, _results;
      _ref = Reform.controls;
      _results = [];
      for (cls in _ref) {
        control = _ref[cls];
        _results.push((function() {
          var _i, _len, _ref2, _results2;
          _ref2 = $(node).parent().find("." + cls);
          _results2 = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            n = _ref2[_i];
            _results2.push(new control(n));
          }
          return _results2;
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
