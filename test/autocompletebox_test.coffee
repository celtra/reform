window.$ ?= require "jquery-commonjs"
AutocompleteBox = require "../lib/autocompletebox"

module.exports = ->
    
    QUnit.module "AutocompleteBox"

    # Preparation
    $orig = null
    $fake = null
    setup = (options = [], attrs = "") ->
        $orig = $ "<select class=\"reform-autocompletebox\" #{attrs}>#{options.map((opt) -> "<option value=\"#{opt.value}\">#{opt.text}</option>").join("")}</select>"
        $orig.appendTo "#qunit-fixture"
        
        new AutocompleteBox $orig.get(0)
        $fake = $orig.parent()

    test "The fake wraps the original", 1, ->
        setup()
        ok $fake.is(".reform-autocompletebox-fake"), "Parent should be the fake"

    test "Title input created", 1, ->
        setup()
        ok $fake.find(':first-child').hasClass("reform-autocompletebox-input"), "Fake should have title input"
