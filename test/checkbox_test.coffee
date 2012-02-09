CheckBox = require "/checkbox.coffee"

module "CheckBox"

# Preparation
$orig = null
$fake = null
setup = (attrs = "") ->
    $orig = $ "<input type=\"checkbox\" class=\"reform-checkbox\" #{attrs}>"
    $orig.appendTo "#qunit-fixture"
    new CheckBox $orig.get(0)
    $fake = $orig.parent()

test "The fake wraps the original", 1, ->
    setup()
    ok $fake.is(".reform-checkbox-fake"), "Parent should be the fake"

test "Fake gets the 'disabled' class when disabled", 1, ->
    setup "disabled"
    ok $fake.is(".disabled"), "Fake should have class 'disabled'"

asyncTest "Fake gets the 'checked' class when checked", 1, ->
    setup()
    $fake.trigger "click"
    setTimeout (->
        ok $fake.is(".checked"), "Fake should have class 'checked'"
        start()
    ), 0

asyncTest "States must match before and after the fake is clicked", 2, ->
    setup()
    match = ->
        ok $fake.is(".checked") is $orig.is(":checked"), "States should be the same"
        start()
    match()
    $fake.trigger "click"
    setTimeout match, 0

asyncTest "Clicking the fake triggers click on the original", 1, ->
    setup()
    outcome = (clicked) ->
        clearTimeout t
        ok clicked, "Original should be clicked"
        start()
    $orig.on "click", outcome
    t = setTimeout outcome, 10
    $fake.trigger "click"
