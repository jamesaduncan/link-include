# link-include

This script enhances an HTML document to ability for link tags with the rel 
attribute "include" to get processed as client-side includes, pulling the
document linked to by the URL in href into the current document. By default, 
the include selects the first child of the body to include in the document.
Alternately, the select attribute can be added to the link to alter the
element that is included.

When an element is added to the document, it is added as the next sibling to the
link element that includes it.

If the included element has an "id" attribute, it is noted in the link element's
"for" attribute.

For example, if the following document is the main document:

    <!DOCTYPE html>
    <html lang="en">
    <head>
        <title>LinkIncluder test</title>
        <script type="module" src="./index.mjs"></script>
    </head>
    <body>
        <h1>LinkIncluder test</h1>
        <link rel="include" href="test-include.html">
        <link rel="include" href="test-include.html" select="p:nth-child(2)">
    </body>
    </html>

And in the file "test-include.html" we have the following data:

    <p id="included-paragraph">An included piece of HTML</p>
    <p>A second paragraph</p>
    

Then the main document will get transformed into:

    <html lang="en">
      <head>
        <title>LinkIncluder test</title>
        <script type="module" src="./index.mjs">
      </script>
    </head>
      <body>
        <h1>LinkIncluder test</h1>
        <link rel="include" href="test-include.html" for="included-paragraph">
        <p id="included-paragraph">An included piece of HTML</p>
        <link rel="include" href="test-include.html" select="p:nth-child(2)">
        <p>A second paragraph</p>
      </body>
    </html>


