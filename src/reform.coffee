# Posible custom controls
controls =
    "reform-checkbox"  : require "./checkbox"
    "reform-selectbox" : require "./selectbox"

$(document).on "ready", ->
    (new control node for node in $ ".#{cls}") for cls, control of controls

$(document).on "DOMNodeInserted", (e) ->
    node = e.target
    $node = $ node
    (new control node if $node.hasClass cls unless $node.parent().hasClass "#{cls}-fake") for cls, control of controls
