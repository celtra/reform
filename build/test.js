(function() {
  var $fake, $orig, CheckBox, prepare;

  CheckBox = require("/checkbox.coffee");

  module("checkbox");

  $orig = null;

  $fake = null;

  prepare = function(attrs) {
    if (attrs == null) attrs = "";
    $orig = $("<input type=\"checkbox\" class=\"reform-checkbox\" " + attrs + ">");
    $orig.appendTo("body");
    new CheckBox($orig.get(0));
    return $fake = $orig.parent();
  };

  test("The fake wraps the original", 1, function() {
    prepare();
    return ok($fake.is(".reform-checkbox-fake"), "Parent should be the fake");
  });

  test("Fake gets the 'disabled' class when disabled", 1, function() {
    prepare("disabled");
    return ok($fake.is(".disabled"), "Fake should have class 'disabled'");
  });

  asyncTest("Fake gets the 'checked' class when checked", 1, function() {
    prepare();
    $fake.trigger("click");
    return setTimeout((function() {
      ok($fake.is(".checked"), "Fake should have class 'checked'");
      return start();
    }), 0);
  });

  asyncTest("States must match before and after the fake is clicked", 2, function() {
    var match;
    prepare();
    match = function() {
      ok($fake.is(".checked") === $orig.is(":checked"), "States should be the same");
      return start();
    };
    match();
    $fake.trigger("click");
    return setTimeout(match, 0);
  });

  asyncTest("Clicking the fake triggers click on the original", 1, function() {
    var outcome, t;
    prepare();
    outcome = function(clicked) {
      clearTimeout(t);
      ok(clicked, "Original should be clicked");
      return start();
    };
    $orig.on("click", outcome);
    t = setTimeout(outcome, 10);
    return $fake.trigger("click");
  });

}).call(this);
