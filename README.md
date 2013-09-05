Reform - HTML forms the way you want them
=========================================

Have you spent the last 15 years wishing browsers wouldn't force their style on your HTML elements? How many times did you want to style a check box or a select box as if they were divs? I thought so.

Instructions
------------

All the files you need are in the `build` folder.

 1. Download `reform.js` (or `reform.min.js`) and include it in your HTML file.
 2. Optionally, download and include `reform.css` for default style (recommended).
 3. Whenever you want custom form elements, do this:
   - Add `reform-checkbox` class to `input[type=checkbox]` elements
   - Add `reform-selectbox` class to `select` elements
 4. Define your own CSS for "reformed" form elements or override the defaults in `reform.css`

Dependencies
------------

  - jQuery 1.7+

How it works
------------

Reform will hide original elements and wrap them in "fake" elements, which are just plain divs. It will copy all your classes from the original to the fake element and replicate the behavior of the original element by setting special classes on the fake element (e.g. `checked`, `selected`, `disabled`). The state is automatically synchronized between the fake and the original, so you can trigger events and set values on the original elements without worrying about the fake element.

Check box
---------

Original:

    <input type="checkbox" class="reform-checkbox my-class">

will become:

    <div class="reform-checkbox-fake my-class">
      <input type="checkbox" style="display: none">
    </div>

For disabled original elements, fake elements will get the `disabled` class. For checked original elements, they will get the `checked` class.

Select box
----------

Original:

    <select class="reform-selectbox my-class" title="Pick a number" data-options-class="my-options">
      <option value="1">One</option>
      <option value="2">Two</option>
    </select>
  
will become:

    <div class="reform-selectbox-fake my-class">
      <select style="display: none" title="Pick a number" data-options-class="my-options">
        <option value="1">One</option>
        <option value="2">Two</option>
      </select>
      Pick a number
    </div>

Again, for disabled original elements, fake elements will get the `disabled` class.

Another div -- options container -- is attached to the `body` element and initially hidden.

    <div class="reform-options my-options"></div>
  
Once the fake element is clicked, the options container is populated and shown:

    <div class="reform-options my-options">
      <div class="reform-list">
        <div class="reform-item" value="1">One</div>
        <div class="reform-item" value="2">Two</div>
      </div>
    </div>

The options container div is automatically positioned. When an item is selected, it gets the `selected` class. You may have also noticed that, if you specify the attribute `data-options-class` on the original element, the value of that attribute will be set as a class on the options container div.

Autocompletebox
----------

Original:

      <input class="reform-autocompletebox" type="text" />

Will become:

      <div class="reform-autocompletebox-fake">
        <input class="reform-autocompletebox-input">
        <input class="reformed" type="text" style="display: none;">
      </div>

Optional input field parameters:

* data-url
* data-placeholder
* data-matchCase
* data-colorTitle
* data-minChars

Default json format is:

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

For performance reasons results are cached. Also keyup delay is used if dooing ajax requests.

      <div class="reform-autocompletebox-options">
        <div class="reform-autocompletebox-list">
          <div class="reform-autocompletebox-item" title="example1" value="4">
            <strong>exam</strong>ple1
          </div>
          <div class="reform-autocompletebox-item" title="example2" value="40">
            <strong>exam</strong>ple2
          </div>
          ...
        </div>
      </div>

NPM package
----------

To use Reform as a CommonJS module (e.g. to use some Node.js tool, such as Browserify, to package your app), you should install the NPM module:

    npm install reform

You can then require Reform:

    Reform = require("reform");

To use it in your application, you should instantiate a Reform object:

    reform = new Reform;

You can then either process nodes individually:

    reform.process(document.body);

The easy way is just to "observe" the DOM for any custom controls being inserted:

    reform.observe();

You can register new extended component before observing:

    reform.register('reform-geoautocompletebox', GeoAutocompleteBox);

Development
-----------

  - You need Node.js 0.4.12 or up and NPM 1.0.106 or up.
  - Run `npm install -dev` in root to install dev dependencies:
    - CoffeeScript 1.2.0 or up
    - Browserify 1.9.2 or up
    - Uglify.js 1.2.5 or up
  - Source files are located in `src` and `css` for CoffeeScript and CSS, respectively.
  - Tests are located in `test`. You can run them by opening `test/index.html` in the browser.
  - Run `bin/build` to build `reform.js`, `reform.min.js` and `reform.css`