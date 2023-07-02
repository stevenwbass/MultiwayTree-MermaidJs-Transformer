const yaml_parser = require('yaml-front-matter');
export function transformChartToTrees(chartDef) {
    if (chartDef == null || chartDef.length === 0) return null;

    let chartDefContent = getChartDefContent(chartDef);
    let trees = parseChartDef(chartDefContent);
    return trees;
}

/*  
  mermaidjs supports chart metadata (https://github.com/mermaid-js/mermaid/pull/3706)
  via Jekyll-style YAML front matter blocks (https://jekyllrb.com/docs/front-matter/)
  e.g...
  ---
  title: `MermaidJS: The Real MVP`
  myMetadataKey: my metadata value
  myMultiLineMetadata: `my multiline
  metadata value`
  ---
*/
function getChartDefContent(chartDef) {
    let metadata = yaml_parser.loadFront(chartDef);
    // conveniently, the metadata has a property with everything that _wasn't_ metadata i.e. the chart definition
    return metadata.__content;
}

/*
  Regrettably, mermaid does not provide a parser nor does it expose its parser; it is deeply coupled with the rendering logic.
  Historically, people have hacked together solutions to use mermaid's parser, but those solutions have proven very brittle 
  and likely to break with each release of mermaid. Hence, I've begrudgingly written my own (undoubtedly imperfect) parser.
  ... But it should be good enough to get the job done.
*/
function parseChartDef(chartDef) {
    // replace multiple instances of newline character with a single newline so chartDef can be split on \n, then trim start + end
    chartDef = chartDef.replace(/\n\s*\n/g, '\n').trim();
    let tokens = chartDef.split('\n');

    let trees = buildTreesFromTokens(tokens);

    return trees;
}

function buildTreesFromTokens(tokens) {
    let trees = [];

    let tokenPartsArray = tokens.map(x => getTokenParts(x));
    // remove tokens with no valid tokenParts e.g. explicit final `Relevant` node
    tokenPartsArray = tokenPartsArray.filter(x => x.length > 0);

    let parsedTreeNodes = parseTokenPartsIntoTreeNodes(tokenPartsArray);
    trees = buildTreesFromTreeNodes(parsedTreeNodes);

    return trees;
}

function buildTreesFromTreeNodes(treeNodes) {
    let trees = [];

    let childNodeIdentifiers = treeNodes.map(x => x.NextNodeIdentifier).filter(x => x != null);
    let rootNodes = treeNodes.filter(x => !childNodeIdentifiers.find(y => y == x.Identifier));

    // add trees for each parent node
    rootNodes.forEach(x => trees.push(x));

    // Add children to the nodes until there are no more children to add.
    // Note that `nodes` contains pointers to the actual nodes in `trees`,
    // so using a method that creates copies of elements (such as `filter`)
    // and assigning the result to `nodes` would be folly since we would 
    // lose the pointers to the actual nodes in `trees`.
    let nodes = rootNodes;
    while(nodes.length > 0) {
        // there should be one node per path through the that node in the flowchart
        let parentNodeDupes = nodes.filter(x => x.Identifier == nodes[0].Identifier);
        childNodeIdentifiers = parentNodeDupes.map(x => x.NextNodeIdentifier).filter(x => x != null);
        for(var i=0; i<parentNodeDupes.length; i++) {
            if (parentNodeDupes[i].NextNodeIdentifier) {
                let parentNode = nodes.find(x => x.Identifier === parentNodeDupes[i].Identifier
                                            && x.Data.Value === parentNodeDupes[i].Data.Value
                                            && x.NextNodeIdentifier === parentNodeDupes[i].NextNodeIdentifier);

                let childNodesWithDupes = treeNodes.filter(x => childNodeIdentifiers.find(y => y === x.Identifier));
                for(var j=0; j<childNodesWithDupes.length; j++) {
                    parentNode.Children.push(childNodesWithDupes[j]);
                    if (childNodesWithDupes[j].NextNodeIdentifier) {
                        nodes.push(childNodesWithDupes[j]);
                    }
                }
            }
        }
        // remove all instances of the parent node we have added children to
        let nodeToRemoveIdentifier = nodes[0].Identifier;
        while(nodes.find(x => x.Identifier === nodeToRemoveIdentifier)){
            let index = nodes.map(x => x.Identifier).indexOf(nodeToRemoveIdentifier);
            nodes.splice(index, 1);
        }
    }

    return trees;
}

/*
  each token consists of:
    1. a source node -- the text of the node corresponds to the `Attribute` property of the tree node
    2. an arrow (`-->`) -- ignored since it does not correspond to any part of a tree
    and
    3. both of:
        a. a valid value for the `Attribute` property pre- and post-fixed with pipes e.g. if `Attribute` is "Investment Focus" then the value after the arrow could be "|Long Only|"
        b. a destination node -- the text of the node corresponds to the next tree node's `Attribute` property
    or
    3. `Relevant` -- ignored since it is just the mermaidjs chart terminus
*/
function parseTokenPartsIntoTreeNodes(tokenPartsArray) {
    let chartNodes = [];
    let chartNodeIdentifierToAttributeMap = {};
    let cacheIdentifierToAttributeMapping = function (nodeProperties) {
        // Each path through a node in the flowchart will translate to a node in the tree.
        // Only one reference to a node in the flowchart needs to have a data attribute for
        // all instances of the node in the tree to inherit that data attribute.
        // As such, we make a map of identifier->attribute and update all the nodes'
        // attributes at the end.
        if (nodeProperties.attribute !== nodeProperties.identifier) {
            chartNodeIdentifierToAttributeMap[nodeProperties.identifier] = nodeProperties.attribute;
        }
    }

    tokenPartsArray.forEach(tokenParts => {
        let srcNodeProperties = parseNodeFromTokenPart(tokenParts[0], chartNodeIdentifierToAttributeMap);
        // tokenParts[1] is `-->` so no need to parse it
        srcNodeProperties.value = tokenParts[2].substr(1, tokenParts[2].length - 2);
        cacheIdentifierToAttributeMapping(srcNodeProperties);
        // if the last tokenPart is not `Relevant`, it means this node is not a terminus
        if (tokenParts[tokenParts.length - 1] !== 'Relevant') {
            let nextNodeAttributes = parseNodeFromTokenPart(tokenParts[3], chartNodeIdentifierToAttributeMap);
            cacheIdentifierToAttributeMapping(nextNodeAttributes);
            srcNodeProperties.nextNodeIdentifier = nextNodeAttributes.identifier;
        }
        chartNodes.push({
            Identifier: srcNodeProperties.identifier,
            NextNodeIdentifier: srcNodeProperties.nextNodeIdentifier,
            Data: {
                Attribute: srcNodeProperties.attribute,
                Value: srcNodeProperties.value
            },
            Children: []
        });        
    });

    resolveNodeAttributes(chartNodes, chartNodeIdentifierToAttributeMap);

    return chartNodes;
}

function resolveNodeAttributes(nodes, chartNodeIdentifierToAttributeMap) {
    nodes.forEach(x => { 
        x.Data.Attribute = chartNodeIdentifierToAttributeMap[x.Identifier] || x.Data.Attribute;
    });
    return nodes;
}

/*
    finds a tree node according to criteria in the callbackFn 
    and returns the parent of the found node 
*/
function findTreeNodeParent(trees, callbackFn) {
    var nodes = trees;
    while(nodes.length > 0) {
        var parentNode = nodes[0];
        // if parentNode's children contain the node we're looking for, return parentNode
        if (parentNode.Children.find(callbackFn))
            return parentNode;
        else {
            // add parentNode's children (if any) to the list of candidate nodes
            // and remove parentNode as a candidate
            parentNode.Children.forEach(x => nodes.push(x));
            nodes.slice(1);
        }
    }
    return null;
}

/*
    finds and returns a tree node according to criteria indicated in the callbackFn
*/
function findTreeNode(trees, callbackFn) {
    var nodes = trees;
    while(nodes.length > 0) {
        let targetNode = nodes.find(callbackFn);
        if (targetNode)
            return targetNode;
        
        nodes = nodes.flatMap(x => x.Children);
    }
    return null;
}

function parseNodeFromTokenPart(tokenPart, chartNodeIdentifierToAttributeMap) {
    let nodeParts = tokenPart.split('[');
    let nodeAttributes = {
        identifier : nodeParts[0],
        // if a node has an name other than its identifier, it will be between brackets e.g. `A[Entity Type]`, 
        // otherwise the identifier is the name of the attribute as well
        attribute : nodeParts.length > 1 ? nodeParts[1].substr(0, nodeParts[1].length - 1) : nodeParts[0]
    }

    if (nodeAttributes.identifier !== nodeAttributes.attribute) {
        // if this is a new id -> attribute mapping we haven't seen, save it
        // so we can populate `attribute` on nodes that don't have the `attribute`
        if (!chartNodeIdentifierToAttributeMap[nodeAttributes.identifier])
            chartNodeIdentifierToAttributeMap[nodeAttributes.identifier] = nodeAttributes.attribute;
    }

    return nodeAttributes;
}

function addNode(nodeAttributes, parent) {
    let node = {
        Identifier: nodeAttributes.identifier,
        Data: {
            Attribute: nodeAttributes.attribute,
            Value: ""
        },
        Children: []
    };

    if (Array.isArray(parent)) {
        parent.push(node);
    } else {
        parent.Children.push(node);
    }

    return node;
}

function getTokenParts(token) {
    token = token.trim();
    // replace any number of whitespace characters with a single space character so splitting is predictable
    token = token.replace(/\s\s+/g, ' ');
    let tokenParts = token.split(' ');
    // skip the chart type token since it does not correspond to a tree node
    if (tokenParts[0] === 'flowchart'
        // also skip the "Relevant" chart node since it's just there to function as a mermaidjs chart terminus
        || tokenParts[0] === 'Relevant')
        return [];

    tokenParts = reconstituteTokenPartsContainingSpaces(tokenParts);
    return tokenParts;
}

// reconstitute token parts that contain valid spaces e.g. `A[Entity Type]` or `|Long Only|`
function reconstituteTokenPartsContainingSpaces(tokenParts) {
    let hasUnmatchedBracket = function (str) {
        return str.indexOf('[') > -1 && str.indexOf(']') === -1;
    }, hasOnePipe = function (str) {
        return (str.match(/\|/g) || []).length === 1;
    }

    while (tokenParts.filter(x => hasUnmatchedBracket(x) || hasOnePipe(x)).length > 0) {
        let newTokenParts = [];
        for (let i = 0; i < tokenParts.length; i++) {
            if (hasUnmatchedBracket(tokenParts[i]) || hasOnePipe(tokenParts[i])) {
                newTokenParts.push(tokenParts[i] + ' ' + tokenParts[i + 1]);
                i++;
            } else {
                newTokenParts.push(tokenParts[i]);
            }
        }
        tokenParts = newTokenParts;
    }
    return tokenParts;
}