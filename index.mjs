import SelectorSubscriber from "https://jamesaduncan.github.io/selector-subscriber/index.mjs";

const LinkInclude = 1;

const RangeCache = {};

class SelectorRange {

    start = "";
    match = "";

    constructor( start, match ) {
        this.start = start;
        this.match = match;

        if (!(start && match)) throw new Error("Invalid SelectorRange constructor.");
    }

    toString() {
        return `selector=${this.start}; ${this.match}`
    }
}

function addElements( source, nodes ) {
    
    if ( source.hasAttribute('destination') ) {
        let destination = document.querySelector( source.getAttribute('destination') );
        if ( destination.nodeName === "TEMPLATE" ) destination = destination.content;
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

    let ranged = false;
    const options = {};    
    if ( element.hasAttribute('start') && element.hasAttribute('match') ) {
        ranged = new SelectorRange( element.getAttribute('start'), element.getAttribute('match') );
    }

    if (ranged) {
        console.log(`going to test if server for ${url} is DOM aware`);
        if ( !Reflect.has(RangeCache, url) ) { 
            const test = await fetch(url, { method: 'HEAD' });
            if ( test.ok ) {
                if ( test.headers.get('accept-range') ) {
                    RangeCache[ url ] = true;
                    options.headers = {
                        Range: `${ranged}`,
                    }
                } else {
                    console.log("Server is not DOM-aware");
                }
            }
        } else {
            if ( RangeCache[ url ] ) {
                options.headers = { Range: `${ranged}` };
            }
        }
    }

    const response = await fetch(url, options);
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
