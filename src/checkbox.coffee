# Implements custom check boxes and radio buttons
class CheckBox
    
    # Generating a fake check/radio box from a real one
    constructor: (input) ->
        @orig = $ input
        @siblings = $("[name='#{@orig.attr "name"}']").not(@orig) if @orig.is ":radio"
        
        # Fake check box
        @fake = $ "<div/>"
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", ""
        @fake.removeClass("reform-checkbox").addClass("reform-checkbox-fake")
        @fake.addClass "checked"  if @orig.is ":checked"
        @fake.addClass "disabled" if @orig.is ":disabled"
        @fake.addClass "radio"    if @orig.is ":radio"
        @orig.after(@fake).appendTo(@fake)
        
        # When the fake check box is clicked, just pass it to the original
        @fake.on "click", => @orig.trigger "click"
        
        # Original is clicked
        @orig.on "click", (e) =>
            e.stopPropagation()
            return if @orig.is ":disabled"
            @siblings?.each (i, el) -> $(el).parent().removeClass "checked"
        
        # Prevent text selection
        @fake.on "mousedown", (e) -> e.preventDefault()
        
        # Replicate changes from the original check box to the fake one
        @orig.on "change", @refresh
    
    # Replicate the original's state to the fake one
    refresh: =>
        @fake.removeClass "checked"
        @fake.addClass "checked" if @orig.is ":checked"

module.exports = CheckBox