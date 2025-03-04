import SelectorSubscriber from "https://jamesaduncan.github.io/selector-subscriber/index.mjs";

const LinkInclude = 1;

async function linkLoader( element ) {
    const url = element.getAttribute('href');
    const response = await fetch(url);
    if ( response.ok ) {
        const body = await response.text();
        try {
            const parsedBody = (new DOMParser()).parseFromString( body, "text/html");
            const selector = element.getAttribute('select') || 'body > *'

            const node = parsedBody.querySelector( selector ).cloneNode( true ) // this gets the first element in the document.
            element.after( node );
            
            if (node.hasAttribute('id'))
                element.setAttribute('for', node.getAttribute('id'));

        } catch(e) {
            console.log("", e);
        }
    }
}


SelectorSubscriber.subscribe( 'link[rel=include][href]', linkLoader );

export default LinkInclude;
