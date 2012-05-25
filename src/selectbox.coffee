$ ?= require "jquery-commonjs"

# Implements custom select boxes
class SelectBox
    
    # Generating a fake select box from a real one
    constructor: (@select) ->
        @orig = $ @select
        
        # Don't do this twice
        return if @orig.is ".reformed"
        
        @body = $ "body"
        
        # Fake select box
        @fake = $ "<div/>"
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", "reformed"
        @fake.removeClass("reform-selectbox").addClass "reform-selectbox-fake"
        @fake.addClass "disabled" if @orig.is ":disabled"
        @refresh()
        @orig.after(@fake).appendTo @fake

        # This is where options container will be
        @floater = null
        
        # Click opens the options container
        @fake.on "click", (e) =>
            return if @orig.is ":disabled"
            e.stopPropagation()
            if @floater is null then @open() else @close()
        
        # Prevent text selection
        @fake.on "mousedown", (e) -> e.preventDefault()
        
        # Replicate changes from the original select box to the fake one
        @orig.on "reform.sync change DOMSubtreeModified", @refresh
        
        # Close any other open options containers
        @body.on "reform.open", (e) => @close() unless e.target is @select

        # Clean up orphaned options containers
        $('.reform-selectbox-options').remove()
    
    # Generates and opens the options container
    open: =>
        # Let everyone know we're open
        @orig.trigger "reform.open"

        # Options container
        @floater = $ "<div/>"
        @floater.attr "class", "reform-selectbox-options"
        @floater.css "min-width", @fake.outerWidth()
        @floater.addClass @orig.data "options-class"
        @body.append @floater
        
        # List container
        $list = $("<div/>").appendTo @floater
        $list.attr "class", "reform-selectbox-list"
        
        # Filling options
        @orig.find("option").each (i, option) =>
            $option = $ option
            $item = $ "<div/>"
            $item.attr "class", "reform-selectbox-item"
            $item.addClass "selected" if $option.is ":selected"
            $item.addClass "disabled" if $option.is ":disabled"
            $item.attr "value", $option.val()
            $item.text $option.text()
            $item.appendTo $list
            
            # Prevent text selection
            $item.on "mousedown", (e) -> e.preventDefault()
            
            # Option selection
            $item.on "click", (e) =>
                return if $item.is '.disabled'
                
                if @orig.is "[multiple]"
                    $item.toggleClass "selected"
                    e.stopPropagation()
                else
                    $item.siblings().andSelf().removeClass "selected"
                    $item.addClass "selected"
                
                # Update values
                values = $item.parent().find(".reform-selectbox-item.selected").map -> $(@).val()
                @orig.val(values).trigger "change"
        
        # Click closes the options layer
        @body.one "click", @close
        
        # Show the options layer
        @floater.show()
        
        # Position the options layer
        $window = $ window
        pos = @fake.offset()
        if pos.top + @floater.outerHeight() > $window.height()
            pos.top = pos.top - @floater.outerHeight() + @fake.outerHeight()
        if pos.left + @floater.outerWidth() > $window.width()
            pos.left = pos.left - @floater.outerWidth() + @fake.outerWidth()
        @floater.css pos
    
    # Closes the options container
    close: =>
        @floater?.remove()
        @floater = null
    
    # Set the title of the fake select box
    refresh: =>
        @fake.toggleClass "disabled", @orig.is ":disabled"
        selected = @orig.find("option").filter(-> @selected)
        plural = @orig.data "plural"
        title = if plural? and selected.length > 1 then "#{selected.length} #{plural}" else selected.map(-> $(@).text()).get().join ", "
        title = @orig.attr "title" unless title
        title = "Select" unless title
        @fake.contents().filter(-> @nodeType is Node.TEXT_NODE).remove()
        @fake.append document.createTextNode title

module.exports = SelectBox