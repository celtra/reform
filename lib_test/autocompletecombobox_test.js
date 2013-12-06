// Generated by CoffeeScript 1.4.0
(function() {
  var AutocompleteCombobox, _ref;

  if ((_ref = window.$) == null) {
    window.$ = require("jquery-commonjs");
  }

  AutocompleteCombobox = require("../lib/autocompletecombobox");

  module.exports = function() {
    var $fake, $orig, setup;
    QUnit.module("AutocompleteCombobox");
    $orig = null;
    $fake = null;
    setup = function(options, attrs) {
      if (options == null) {
        options = [];
      }
      if (attrs == null) {
        attrs = "";
      }
      $orig = $("<input class=\"reform-autocompletecombobox\" " + attrs + " />");
      $orig.appendTo("#qunit-fixture");
      new AutocompleteCombobox($orig.get(0));
      return $fake = $orig.parent();
    };
    test("The fake wraps the original", 1, function() {
      setup();
      return ok($fake.is(".reform-autocompletecombobox-ui"), "Parent should be the fake");
    });
    return test("Selected title created", 1, function() {
      setup();
      return ok($fake.find('span').hasClass("reform-autocomplete-selected-label"), "Fake should have selected title");
    });
  };

}).call(this);
