import SelectorSubscriber from "https://jamesaduncan.github.io/selector-subscriber/index.mjs";

const LinkInclude = 1;

async function linkLoader( element ) {
    const url = element.getAttribute('href');
    const response = await fetch(url);
    if ( response.ok ) {
        const body = await response.text();
        try {
            const parsedBody = (new DOMParser()).parseFromString( body, "text/html");
            if ( element.hasAttribute('start') && element.hasAttribute('match') ) {
                const startingSelector = element.getAttribute('start');
                const testSelector     = element.getAttribute('match');
                const nodes = [];

                const first = parsedBody.querySelector( startingSelector );
                let nextElement = first;
                while( nextElement ) {
                    if ( nextElement.matches( testSelector ) ) {
                        nodes.push( nextElement );
                        nextElement = nextElement.nextElementSibling;
                    } else nextElement = null;
                }

                const clonedNodes = nodes.map( (node) => node.cloneNode( true ) );
                clonedNodes.forEach( (node) => {
                    const nodeId = node.getAttribute('id')
                    if ( nodeId && document.getElementById( nodeId ) ) {
                        node.removeAttribute('id')
                    }
                })
                element.after( ...clonedNodes );

                const event    = new CustomEvent("IncludeComplete", {
                    bubbles: true,
                    detail: clonedNodes,                    
                });
                element.dispatchEvent( event );

            } else {
                const selector = element.getAttribute('select') || 'body > *'

                const node = parsedBody.querySelector( selector ).cloneNode( true ) // this gets the first element in the document.

                if (node.hasAttribute('id')) {
                    const nodeId = node.getAttribute('id')
                    if ( nodeId && document.getElementById( nodeId ) ) {
                        node.removeAttribute('id')
                    } else {
                        element.setAttribute('for', node.getAttribute('id'));
                    }
                }
                element.after( node );

                const event    = new CustomEvent("IncludeComplete", {
                    bubbles: true,
                    detail: [ node ],                    
                });
                element.dispatchEvent( event );

            }
        } catch(e) {
            console.log("", e);
        }
    }
}

SelectorSubscriber.subscribe( 'link[rel=include][href]', linkLoader );

export default LinkInclude;
