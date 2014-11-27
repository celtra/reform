window.$             ?= require "jquery-commonjs"
AutocompleteCombobox  = require "./autocompletecombobox"

class MultilineAutocompleteCombobox extends AutocompleteCombobox
    constructor: (@select, options) ->
        @options = $.extend {
            reformClass       : 'reform-multilineautocompletecombobox'
            descClass         : 'multiline-description'
            filterDescription : yes
        }, options

        super @select, @options

    createItem: (item) ->
        $item = super item

        description = if typeof(item.description) is 'object' then item.description.label else item.description
        $descItem = $ "<span>#{description}</span>"
        $descItem.addClass @options.descClass
        $descItem.addClass @options.disabledClass if item.disabled

        # prevent highlighting the wrong substring
        positionOffset = 0
        if typeof(item.description) is 'object'
            positionOffset = description.toLowerCase().indexOf item.description.value

        position = description.toLowerCase().indexOf @filterValue.toLowerCase(), positionOffset
        if @options.highlightTitles and @filterValue.length and position isnt -1 and positionOffset isnt -1
            text           = description.substring position, position + @filterValue.length # extract text with original casing
            leadingString  = description.substring 0, position
            trailingString = description.substring position + @filterValue.length, description.length

            highlightedText = "<strong>#{@hyphenate( text )}</strong>"
            $descItem.html @hyphenate(leadingString) + highlightedText + @hyphenate(trailingString)

        $descItem.appendTo $item

        $item

    filterData: ->
        if @options.filterDescription
            filteredData = []

            # filter local collection
            for item in @data
                # can match all, usefull for custom requests
                if not @options.exactMatch and @filterValue?
                    title       = item.title
                    description = if typeof(item.description) is 'object' then item.description.value else item.description
                    filterValue = @filterValue

                    if not @options.caseSensitive
                        title       = title.toLowerCase()
                        description = description.toLowerCase()
                        filterValue = filterValue.toLowerCase()

                    if title.indexOf(filterValue) isnt -1 or description.indexOf(filterValue) isnt -1
                        filteredData.push item

                else
                    filteredData.push item

            filteredData
        else
            super

module.exports = MultilineAutocompleteCombobox