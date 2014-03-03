# Reform - HTML forms the way you want them

Have you spent the last 15 years wishing browsers wouldn't force their style on your HTML elements? How many times did you want to style a check box or a select box as if they were divs? I thought so.

## Instructions

All the files you need are in the `build` folder.

 1. Download `reform.js` (or `reform.min.js`) and include it in your HTML file.
 2. Optionally, download and include `reform.css` for default style (recommended).
 3. Whenever you want custom form elements, do this:
   - Add `reform-checkbox` class to `input[type=checkbox]` elements
   - Add `reform-selectbox` class to `select` elements
   - Add `reform-multilineselectbox` class to `select` elements
   - Add `reform-autocompletebox` class to `input[type=text]` elements
   - Add `reform-autocompletecombobox` class to `input[type=text]` elements
 4. Define your own CSS for "reformed" form elements or override the defaults in `reform.css`

# Dependencies

  - jQuery 1.7+

# How it works

Reform will hide original elements and wrap them in "fake" elements, which are just plain divs. It will copy all your classes from the original to the fake element and replicate the behavior of the original element by setting special classes on the fake element (e.g. `checked`, `selected`, `disabled`). The state is automatically synchronized between the fake and the original, so you can trigger events and set values on the original elements without worrying about the fake element.

# Check box

Original:

```html
<input type="checkbox" class="reform-checkbox my-class">
```

will become:

```html
<div class="reform-checkbox-fake my-class">
  <input type="checkbox" style="display: none">
</div>
```

For disabled original elements, fake elements will get the `disabled` class. For checked original elements, they will get the `checked` class.

## Select box

Original:

```html
<select class="reform-selectbox my-class" title="Pick a number" data-options-class="my-options">
  <option value="1">One</option>
  <option value="2">Two</option>
</select>
```
  
will become:

```html
<div class="reform-selectbox-fake my-class">
  <select style="display: none" title="Pick a number" data-options-class="my-options">
    <option value="1">One</option>
    <option value="2">Two</option>
  </select>
  Pick a number
</div>
```

Again, for disabled original elements, fake elements will get the `disabled` class.

Another div -- options container -- is attached to the `body` element and initially hidden.

```html
<div class="reform-options my-options"></div>
```
  
Once the fake element is clicked, the options container is populated and shown:

```html
<div class="reform-options my-options">
  <div class="reform-list">
    <div class="reform-item" value="1">One</div>
    <div class="reform-item" value="2">Two</div>
  </div>
</div>
```

The options container div is automatically positioned. When an item is selected, it gets the `selected` class. You may have also noticed that, if you specify the attribute `data-options-class` on the original element, the value of that attribute will be set as a class on the options container div.

## Multiline select box

The multiline select box is basically a select box with support for a description line in the list of options. Simply add a data-desc attribute to the option tag.

## Autocomplete box

Original:

```html
<input class="reform-autocompletebox" type="text" />
```

Will become:

```html
<div class="reform-autocompletebox-ui reform-autocomplete-fake">
    <input class="reformed" type="text" style="display: none;">
    <input class="reform-autocomplete-filter" placeholder="Type to search...">
</div>
```

Optional input field parameters:

* data-url
* data-placeholder-text
* data-case-sensitive
* data-highlight-titles
* data-highlight-selection
* data-min-chars
* data-delay
* data-show-arrows

Default json format is:

```json
[{
  "title": 'example1',
  "value": '1'
},
{
  "title": 'example2',
  "value": '2'
},
...
]
```

For performance reasons results retrieved from a server are cached. Also delay is used if dooing ajax requests.

Once autocomplete detects results the options container is shown:

```html
<div class="reform-autocompletebox-ui reform-autocomplete-floater">
    <div class="reform-autocomplete-list">
        <div class="reform-autocomplete-item" value="4">
            <strong>exam</strong>ple1
        </div>
        <div class="reform-autocomplete-item" value="40">
            <strong>exam</strong>ple2
        </div>
        ...
    </div>
</div>
```

## Autocomplete combobox

Original:

```html
    <input class="reform-autocompletecombobox" type="text" />
```

Will become:

```html
<div class="reform-autocompletecombobox-ui reform-autocomplete-fake reform-autocomplete-arrow-down">
    <input class="reformed" style="display: none;">
    <span class="reform-autocomplete-selected-label placeholder">Select an item...</span>
</div>
```

Optional input field parameters:

* data-url
* data-placeholder-text
* data-case-sensitive
* data-highlight-titles
* data-highlight-selection
* data-min-chars
* data-delay
* data-show-arrows
* data-empty-selection-text
* data-empty-text

Default json format is:

```json
[{
  "title": 'example1',
  "value": '1'
},
{
  "title": 'example2',
  "value": '2'
},
...
]
```

Once autocomplete detects results the options container is shown:

```html
<div class="reform-autocompletecombobox-ui reform-autocomplete-floater">
  <span class="reform-autocomplete-floater-label reform-autocomplete-arrow-up">Select an item...</span>
  <input class="reform-autocomplete-filter" placeholder="Type to search...">
  <div class="reform-autocomplete-list">
    <div class="reform-autocomplete-item" value="1">
      <strong>ex</strong>ample1
    </div>
    <div class="reform-autocomplete-item" value="2">
      <strong>ex</strong>ample2
    </div>
    ...
  </div>
</div>
```

The Autocomplete combobox acts like a regular combobox with an addition to filter options. Just like with comboboxes only availbale options can be selected while custom inputs are not possible. If you need custom inputs you should use the Autocomplete box instead.

## NPM package

To use Reform as a CommonJS module (e.g. to use some Node.js tool, such as Browserify, to package your app), you should install the NPM module:

```bash
npm install reform
```

You can then require Reform:

```javascript
Reform = require("reform");
```

To use it in your application, you should instantiate a Reform object:

```javascript
reform = new Reform;
```

You can then either process nodes individually:

```javascript
reform.process(document.body);
```

The easy way is just to "observe" the DOM for any custom controls being inserted:

```javascript
reform.observe();
```

You can register new extended component before observing:

```javascript
reform.register('reform-geoautocompletebox', GeoAutocompleteBox);
```

## Development

- You need [Node.js](http://nodejs.org/)
- Install `gulp` with `npm install -g gulp`
- Run `npm install` to install all the dependencies
- Source files are located in `src` and `less` for CoffeeScript and LESS, respectively.
- Tests are located in `test`. You can run them by opening `test/index.html` in the browser.
- Run `gulp watch` to build `reform.js` and `reform.css` and watch for changes

### Static Ruby server

You can add this alias to your [dotfiles](http://dotfiles.github.io/).

```
alias server='ruby -run -e httpd . -p5000'
```

And from here you can run `server` from this directory and open
[http://localhost:5000/demo/index.html](http://localhost:5000/demo/index.html) for Reform demo.