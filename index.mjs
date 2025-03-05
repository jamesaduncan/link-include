import SelectorSubscriber from "https://jamesaduncan.github.io/selector-subscriber/index.mjs";

const LinkInclude = 1;

function addElements( source, nodes ) {
    
    if ( source.hasAttribute('destination') ) {
        const destination = document.querySelector( source.getAttribute('destination') );
        nodes.forEach( (node) => destination.appendChild( node ) );
    } else {
        source.after( ...nodes );
    }

    const event    = new CustomEvent("IncludeComplete", {
        bubbles: true,
        detail: nodes,                    
    });
    source.dispatchEvent( event );
}

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
                addElements( element, clonedNodes );

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

                addElements( element, [ node ]);
            }
        } catch(e) {
            console.log("Error trying to process link element", element, e);
        }
    }
}

SelectorSubscriber.subscribe( 'link[rel=include][href]', linkLoader );

export default LinkInclude;
