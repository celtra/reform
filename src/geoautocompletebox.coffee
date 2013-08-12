
window.$ ?= require "jquery-commonjs"
AutocompleteBox = require "./autocompletebox.coffee"

# Implements custom select boxes
class GeoAutocompleteBox extends AutocompleteBox

    constructor: (selector, options) ->
        # some overrides
        @overrides = {
            matchAll: true
            matchContains: false
            matchSubset: false
            url: '/custom'
        }

        extOptions = {}
        $.extend extOptions, @overrides

        super selector, extOptions

    # query the server
    request: (term, success, failure) =>
       	
        if not @options.matchCase
            term = term.toLowerCase()

        data = @cache.load(term);

        if data
            parsed = @options.parse && @options.parse(options.data) || @parse(options.data)
            success term, parsed
        else if @options.url?
            geocoder = new google.maps.Geocoder();

            options = {
            	'address': term
            }

            geocoder.geocode options, (results, status) =>
                if status == google.maps.GeocoderStatus.OK
                    parsed = @options.parse?(results, term) || @parse(results, term)

                    # fill data
                    @options.data = parsed
                    success parsed, term
                else
                	failure status, results
        else
            failure 'Set options.url', term

    parse: (data, term) =>
        parsed = []

        $.each data, (num, item) =>
            parsed.push({
                # value is just lat|lng
                value: item.geometry.location.lat() + "|" + item.geometry.location.lng()
                title: item.formatted_address
            })

        parsed

module.exports = GeoAutocompleteBox