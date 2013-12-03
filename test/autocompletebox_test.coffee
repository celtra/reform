window.$        ?= require "jquery-commonjs"
AutocompleteBox  = require "../lib/autocompletebox"

module.exports = ->
    
    QUnit.module "AutocompleteBox"

    # Preparation
    $orig = null
    $fake = null
    setup = (options = [], attrs = "") ->
        $orig = $ "<input class=\"reform-autocompletebox\" #{attrs} />"
        $orig.appendTo "#qunit-fixture"
        
        new AutocompleteBox $orig.get(0)
        $fake = $orig.parent()

    test "The fake wraps the original", 1, ->
        setup()
        ok $fake.is(".reform-autocomplete-fake"), "Parent should be the fake"

    test "Filter input created", 1, ->
        setup()
        ok $fake.find('input:visible').hasClass("reform-autocomplete-filter"), "Fake should have filter input"
