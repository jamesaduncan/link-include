import { SelectorSubscriber } from "https://jamesaduncan.github.io/selector-subscriber/index.mjs";
import { SelectorRequest } from "https://jamesaduncan.github.io/selector-request/index.mjs";

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
        console.log("about to add it after...", nodes);
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
                if ( element.getAttribute('xpath') ) {
                    const xpathExpression = element.getAttribute('xpath');
                    const xpathResult = document.evaluate(xpathExpression, parsedBody, null, 2, null);
                    const node = document.createTextNode( xpathResult.stringValue );
                    addElements( element, [ node ]);                    
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
            }
        } catch(e) {
            console.log("Error trying to process link element", element, e);
        }
    }
}

async function linkInclude( element ) {
    let response = await SelectorRequest.fetch( element.getAttribute('href') );

    if ( element.hasAttribute('start')) {
        let collecting = false;
        const startSelector = element.getAttribute('start');
        response = response.filter( (node) => {
            if ( node.matches( startSelector ) ) {
                collecting = true;
            }
            return collecting;
        })
    }

    if ( element.hasAttribute('end') ) {
        let collecting = true;
        const endSelector = element.getAttribute('end');
        response = response.filter( (node) => {
            if ( node.matches( endSelector ) ) {
                collecting = false;                
            }
            return collecting;
        });
    }
    
    if ( element.hasAttribute('match') ) {
        const matchSelector = element.getAttribute('match');
        response = response.filter( node => node.matches( matchSelector ) );
    }

    // maybe this should be a feature of SelectorRequest?
    if ( element.hasAttribute('xpath') ) {
        const xpathExpression = element.getAttribute('xpath');
        console.log(`responses before ${xpathExpression}`, response);
        response = response.map( (r) => {
            return document.createTextNode( document.evaluate(xpathExpression, r, null, 2, null).stringValue );
        });
        console.log(`responses after ${xpathExpression}`, response);
    }

    if ( element.hasAttribute('destination') ) {
        const destination = document.querySelector( element.getAttribute('destination') );
        destination.append(...response)
    } else element.after(...response)
}

SelectorSubscriber.subscribe( 'link[rel=include][href]', linkInclude );

export default LinkInclude;
