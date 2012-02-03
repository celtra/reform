$ ?= require "jquery-commonjs"

# Implements custom check boxes and radio buttons
class CheckBox
    
    # Generating a fake check/radio box from a real one
    constructor: (input) ->
        @orig = $ input
        
        # Don't do this twice
        return if @orig.is ".reformed"
        
        @siblings = $("[name='#{@orig.attr "name"}']").not(@orig) if @orig.is ":radio"
        
        # Fake check box
        @fake = $ "<div/>"
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", "reformed"
        @fake.removeClass("reform-checkbox").addClass "reform-checkbox-fake"
        @fake.addClass "checked"  if @orig.is ":checked"
        @fake.addClass "disabled" if @orig.is ":disabled"
        @fake.addClass "radio"    if @orig.is ":radio"
        @orig.after(@fake).appendTo @fake
        
        # When the fake check box is clicked, fake a click on the original
        
        @fake.on "click", (e, skip) =>
            return if skip
            e.stopPropagation()
            # Trigger a click on the original (this one won't bubble)
            @orig.trigger "click"
            # Bubble a fake event
            fe = $.Event "click"
            fe.target = @orig.get 0
            fe.currentTarget = @fake.get 0
            @fake.trigger fe, yes
        
        # Original is clicked
        @orig.on "click", (e) =>
            e.stopPropagation()
            return if @orig.is ":disabled"
            @siblings?.each (i, el) -> $(el).parent().removeClass "checked"
        
        # Prevent text selection
        @fake.on "mousedown", (e) -> e.preventDefault()
        
        # Replicate changes from the original check box to the fake one
        @orig.on "change DOMSubtreeModified", => setTimeout @refresh, 0
    
    # Replicate the original's state to the fake one
    refresh: =>
        @fake.removeClass "checked"
        @fake.addClass "checked" if @orig.is ":checked"

module.exports = CheckBox