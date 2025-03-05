# link-include

This script enhances an HTML document to ability for link tags with the rel 
attribute set to _include_ to get processed as client-side includes, pulling the
document linked to by the URL in href into the current document. By default, 
the include selects the first child of the body to include in the document.
Alternately, the _select_ attribute can be added to the link element to specify the
element that is included from the linked document.

When an element is added to the document, it is added as the next sibling to the
link element that includes it.

If the included element has an _id_ attribute, it is noted in the link element's
_for_ attribute when the include has completed loading.

Finally, the link element can have a _start_ attribute and a _match_ attribute. In
this case, the first element included will be one matching the _start_ attribute. Sibling
attributes will be included as long as they exist, and continue to match the selector
in the _match_ attribute.

## Alternate destinations

There are some cases where the link element is not a valid child. For example, a thead
element cannot have a link element as a child. To work around this kind of problem, a
link-include element can specify a destination for the included elements, by providing
a selector in the _destination_ attribute.

## Events

When the include is processed, a IncludeComplete event is dispatched to the
link element. The event has a list of the new elements contained in the detail property,
and will bubble to parent elements.

For example, if the following document is the main document:

      <!DOCTYPE html>
      <html lang="en">
      <head>
          <title>LinkIncluder test</title>
          <script type="module" src="./index.mjs">
          </script>
      </head>
      <body>
          <h1>LinkIncluder test</h1>
          <section>
              <h2>Include with unspecified selector</h2>
              <link rel="include" href="test-include.html">
          </section>
          <section>
              <h2>Include with specified selector</h2>        
              <link rel="include" href="test-include.html" select="p:nth-child(2)">
          </section>
          <section>
              <h2>Include with start and condition</h2>
              <link rel="include" href="test-include.html" start="p" match=":not(special)">
          </section>
      </body>
      </html>

And in the file "test-include.html" we have the following data:

      <p id="included-paragraph">An included piece of HTML</p>
      <p>A second paragraph</p>
      <p>A third paragraph</p>
      <p class="special">A fourth paragraph</p>
    
Then the main document will get transformed into:

      <html lang="en">
        <head>
            <title>LinkIncluder test</title>
            <script type="module" src="./index.mjs"></script>
        </head>
        <body>
            <h1>LinkIncluder test</h1>
            <section>
                <h2>Include with unspecified selector</h2>
                <link rel="include" href="test-include.html">
                <p>An included piece of HTML</p>
            </section>
            <section>
                <h2>Include with specified selector</h2>        
                <link rel="include" href="test-include.html" select="p:nth-child(2)">
                <p>A second paragraph</p>
            </section>
            <section>
                <h2>Include with start and condition</h2>
                <link rel="include" href="test-include.html" start="p" matches=":not(.special)">
                <p id="included-paragraph">An included piece of HTML</p>
                <p>A second paragraph</p>
                <p>A third paragraph</p>
            </section>
            <section>
                <h2>Another start &amp; match condition</h2>
                <link rel="include" href="test-include.html" start="p:nth-of-type(2)" match=":not(:nth-of-type(4))" destination="#paras">
                <div id="paras">
                  <p>A second paragraph</p>
                  <p>A third paragraph</p>
                </div>
            </section>         
        </body>
      </html>


