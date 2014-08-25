window.$ ?= require "jquery-commonjs"

# Implements custom check boxes and radio buttons
class CheckBox

    # Generating a fake check/radio box from a real one
    constructor: (input, options) ->

        @orig = $ input

        # Don't do this twice
        return if @orig.is ".reformed"

        # Other radio buttons
        @siblings = $("[name='#{@orig.attr "name"}']").not(@orig) if @orig.is ":radio"
        
        # Fake check box: label element does all the dirty work automagically
        @fake = $ "<label/>"
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", "reformed"
        @fake.removeClass("reform-checkbox").addClass "reform-checkbox-fake"

        # todo: make it setteble
        @fake.addClass 'reform'
        @fake.addClass 'reform-checkbox-ui'        
        @fake.addClass "checked"  if @orig.is ":checked"
        @fake.addClass "disabled" if @orig.is ":disabled"
        @fake.addClass "radio"    if @orig.is ":radio"
        @orig.after(@fake).appendTo @fake
        
        # Prevent text selection
        @fake.on "mousedown", (e) -> e.preventDefault()
        
        # Replicate changes from the original check box to the fake one
        @orig.on "reform.sync change DOMSubtreeModified", => setTimeout @refresh, 0

    # Replicate the original's state to the fake one
    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"
        @fake.removeClass "checked"
        @fake.addClass "checked" if @orig.is ":checked"

        @fake.trigger 'reform-checkbox-attribute-change', @fake.hasClass 'checked'
        return unless @orig.is(':checked')
        @siblings?.each -> $(@).parent().removeClass "checked"

module.exports = CheckBox