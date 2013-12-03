window.$             ?= require "jquery-commonjs"
AutocompleteCombobox  = require "../lib/autocompletecombobox"

module.exports = ->
    
    QUnit.module "AutocompleteCombobox"

    # Preparation
    $orig = null
    $fake = null
    setup = (options = [], attrs = "") ->
        $orig = $ "<input class=\"reform-autocompletecombobox\" #{attrs} />"
        $orig.appendTo "#qunit-fixture"
        
        new AutocompleteCombobox $orig.get(0)
        $fake = $orig.parent()

    test "The fake wraps the original", 1, ->
        setup()
        ok $fake.is(".reform-autocompletecombobox-fake"), "Parent should be the fake"

    test "Selected title created", 1, ->
        setup()
        ok $fake.find('span').hasClass("reform-autocompletecombobox-selected"), "Fake should have selected title"
