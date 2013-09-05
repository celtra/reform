window.$ ?= require "jquery-commonjs"

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
        @fake.attr "tabindex", 0
        @fake.attr "class", @orig.attr "class"
        @orig.hide().attr "class", "reformed"
        @fake.removeClass("reform-selectbox").addClass "reform-selectbox-fake"
        @fake.addClass "disabled" if @orig.is ":disabled"
        
        @refresh()
        @orig.after(@fake).appendTo @fake
        
        @fake.on "keyup", (ev) =>
            if ev.keyCode is 27
                ev.preventDefault()
                ev.stopPropagation()
        
        @fake.on "keydown", (ev) =>
            ev.preventDefault()
            ev.stopPropagation()
            return if @orig.is "[multiple]"
            
            @fake.focus()
            
            goUp   = ev.keyCode is 38
            goDown = ev.keyCode is 40

            if goUp or goDown
                if not @floater?
                    @open()
                else
                    $current  = if $('.hover', @floater).length is 0 then $('.selected', @floater) else $('.hover', @floater)
                    
                    if goUp
                        $nextItem = if $current.prev().length is 0 then $current.parent().children().last() else $current.prev()
                    else
                        $nextItem = if $current.next().length is 0 then $current.parent().children().first() else $current.next()
                    
                    @hover $nextItem
                    @scrollTo $nextItem
            
            else if ev.keyCode is 13
            
                $item = $(@floater).find '.hover'
                
                itemDoesNotExist = $item.length is 0
                itemIsDisabled = $item.is ".disabled"
                
                return if itemDoesNotExist or itemIsDisabled
                
                $item.siblings().andSelf().removeClass "selected"
                $item.addClass "selected"
                @orig.val(@value()).trigger "change"
                @close()
                         
            else if ev.keyCode is 27
                @close() if @floater?
            else
                done = no
                @$list.children().each (i, item) =>
                    unless done
                        if $(item).text().charAt(0).toLowerCase() is String.fromCharCode(ev.keyCode).toLowerCase()
                            done = yes
                            @hover $(item)
                            @scrollTo $(item)

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
    
    hover: ($item) ->
        $item.siblings().andSelf().removeClass "hover"
        $item.addClass "hover"
    
    scrollTo: ($item) ->
        $container   = $item.parent()
        newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop()
        
        @ignoreMouse = yes
        
        if newScrollTop > ($container.outerHeight() - $item.outerHeight())
            scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight()
            $container.scrollTop scrollTop
        else
            $container.scrollTop 0
        
        clearTimeout @to if @to
        @to = setTimeout( =>
            @ignoreMouse = no
        , 500)
    
    # Fill options
    options: =>
        return unless @floater?
        
        @fake.focus()
        
        # Empty the options container
        @floater.empty()

        # List container
        @$list = $("<div/>").appendTo @floater
        @$list.attr "class", "reform-selectbox-list"
        
        # Filling options
        @orig.find("option").each (i, option) =>
            $option = $ option
            $item = $ "<div/>"
            $item.attr "class", "reform-selectbox-item"
            $item.addClass "selected" if $option.is ":selected"
            $item.addClass "disabled" if $option.is ":disabled"
            $item.attr "title", $option.attr("title")
            $item.attr "value", $option.val()
            $item.text $option.text()
            $item.appendTo @$list
            
            # Prevent text selection
            $item.on "mousedown", (e) -> e.preventDefault()
            
            $item.hover => @hover $item unless @ignoreMouse
            
            
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
                @orig.val(@value()).trigger "change"
    
    value: ->
        @$list.find(".reform-selectbox-item.selected").map -> $(@).val()
    
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
        
        @options()
        
        # Click closes the options layer
        @body.one "click", @close
        
        # get position of fake
        pos = @fake.offset()
        
        # Show the options layer
        @floater.show()
        
        # Position the options layer
        $window = $ window
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

        # data-title overrides other automatically generated titles
        title = @orig.data('title')

        # Automatically choose a title
        unless title
            selected = @orig.find("option").filter(-> @selected and $(@).data("count-option") isnt "no")
            plural = @orig.data "plural"
            title = if plural? and selected.length > 1 then "#{selected.length} #{plural}" else selected.map(-> $(@).text()).get().join ", "
            title = @orig.attr "title" unless title
            title = "Select" unless title?

        @fake.contents().filter(-> @nodeType is Node.TEXT_NODE).remove()
        @fake.append document.createTextNode title
        
        @options()

module.exports = SelectBox