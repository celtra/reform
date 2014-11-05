(function() {
  var AutocompleteBox, AutocompleteCombobox, CheckBox, MultilineSelectBox, Reform, SelectBox;

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  CheckBox = require("./checkbox");

  SelectBox = require("./selectbox");

  MultilineSelectBox = require("./multilineselectbox");

  AutocompleteBox = require("./autocompletebox");

  AutocompleteCombobox = require("./autocompletecombobox");

  Reform = (function() {
    var selectboxList;

    function Reform() {}

    selectboxList = [];

    Reform.prototype.process = function(node) {
      var cls, control, n, select, _ref, _results;
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
            if (cls === 'reform-selectbox' || cls === 'reform-multilineselectbox') {
              select = new control(n);
              _results1.push(selectboxList.push(select));
            } else {
              _results1.push(new control(n));
            }
          }
          return _results1;
        })());
      }
      return _results;
    };

    Reform.prototype.observe = function() {
      $(document).on('ready', (function(_this) {
        return function() {
          return _this.process('body');
        };
      })(this));
      $(document).on('DOMNodeInserted', (function(_this) {
        return function(e) {
          return _this.process(e.target);
        };
      })(this));
      return $(window).resize((function(_this) {
        return function() {
          return _this.refresh();
        };
      })(this));
    };

    Reform.prototype.register = function(controlName, controlObj) {
      return Reform.controls[controlName] = controlObj;
    };

    Reform.prototype.refresh = function() {
      var n, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = selectboxList.length; _i < _len; _i++) {
        n = selectboxList[_i];
        _results.push(n.positionFloater());
      }
      return _results;
    };

    return Reform;

  })();

  Reform.controls = {
    'reform-checkbox': CheckBox,
    'reform-selectbox': SelectBox,
    'reform-multilineselectbox': MultilineSelectBox,
    'reform-autocompletebox': AutocompleteBox,
    'reform-autocompletecombobox': AutocompleteCombobox
  };

  module.exports = Reform;

}).call(this);
