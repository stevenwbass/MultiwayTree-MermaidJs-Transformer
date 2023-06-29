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

  return [{
    Data: {
      Attribute: "Entity Type",
      Value: "Firm"
    },
    Children: []
  }, {
    Data: {
      Attribute: "Entity Type",
      Value: "Product/Strategy"
    },
    Children: [{
      Data: {
        Attribute: "Investment Focus",
        Value: "Long Only"
      },
      Children: []
    }, {
      Data: {
        Attribute: "Investment Focus",
        Value: "Two"
      },
      Children: []
    }]
  }];
}

/*
  each token consists of:
    1. a source node -- the text of the node corresponds to the `Attribute` property of the tree node
    2. an arrow (`-->`) -- ignored since it does not correspond to any part of a tree
    3. [optional] a valid value for the `Attribute` property e.g. if `Attribute` is "Investment Focus" then the value after the arrow could be "Long Only"
    4. [optional] a destination node -- the text of the node corresponds to the next tree node's `Attribute` property
    5. [optional] `Relevant` -- ignored since it is just the mermaidjs chart terminus
*/
function buildTreesFromTokens(tokens) {
  let trees = [];
  let treeNodeProto = {
    Data: {
      Identifier: "", // temporary property -- will be removed after all tokens are parsed
      Attribute: "",
      Value: ""
    },
    Children: []
  };

  tokens.forEach(token => {
    let tokenParts = getTokenParts(token);

    // skip tokens with no valid tokenParts
    if (tokenParts.length === 0)
      return;

    let sourceNode = tokenParts[0];
    let sourceNodeParts = sourceNode.split('[');
    let sourceNodeIdentifier = sourceNodeParts[0];
    // if a node has a name other than its identifier, it will be between brackets e.g. `A[Entity Type]`, otherwise the identifier is the name as well
    let sourceNodeAttributeName = sourceNodeParts.length > 1 ? sourceNodeParts[1].substr(0, sourceNodeParts[1].length) : sourceNodeParts[0];

    // if there's already a node corresponding to `sourceNodeIdentifier`, update that node, else add a new tree
    // TODO: write library that can traverse trees in JS and use that to determine if `trees` already contains a node identified as `sourceNodeIdentifier`
    
    // TODO: build tree node from tokenParts and put node in tree (or add new tree)
  });
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
  let hasUnmatchedBracket = function(str) { 
    return str.indexOf('[') > -1 && str.indexOf(']') === -1;
  }, hasOnePipe = function(str) {
    return (str.match(/\|/g) || []).length === 1;
  }

  while(tokenParts.filter(x => hasUnmatchedBracket(x) || hasOnePipe(x)).length > 0) {
    let newTokenParts = [];
    for(let i=0; i<tokenParts.length; i++) {
      if (hasUnmatchedBracket(tokenParts[i]) || hasOnePipe(tokenParts[i])) {
        newTokenParts.push(tokenParts[i] + ' ' + tokenParts[i + 1]);
        i++;
      } else {
        newTokenParts.push(tokenParts[i]);
      }
    }
    tokenParts = newTokenParts;
  }
}