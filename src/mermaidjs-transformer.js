const yaml_parser = require('yaml-front-matter');
export function transformChartToTrees(chartDef) {
  if (chartDef == null || chartDef.length === 0) return null;

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
  let metadata = yaml_parser.loadFront(chartDef);

  // conveniently, the metadata has a property with everything that _wasn't_ metadata i.e. the chart definition
  let trees = parseChartDef(metadata.__content);
  return trees;
}

// Regrettably, mermaid does not provide a parser nor does it expose its parser; it is deeply coupled with the rendering logic.
// Historically, people have hacked together solutions to use mermaid's parser, but those solutions have proven very brittle 
// and likely to break with each release of mermaid. Hence, I've begrudgingly written my own (undoubtedly imperfect) parser.
// ... But it should be good enough to get the job done.
function parseChartDef(chartDef) {
  /*
    `flowchart LR
  A[Entity Type] --> |Firm| Relevant
  A --> |Product/Strategy| C[Investment Focus]
  C --> |Long Only| Relevant
  C --> |Two| Relevant
  Relevant`
  */

  // replace multiple instances of newline character with a single newline so chartDef can be split on \n, then trim start + end
  chartDef = chartDef.replace(/\n\s*\n/g, '\n').trim();
  let tokens = chartDef.split('\n');
  let trees = [];
  tokens.forEach(token => {
    token = token.trim();
    // replace any number of whitespace characters with a single space character so splitting is predictable
    token = token.replace(/\s\s+/g, ' ');
    let tokenParts = token.split(' ');
    // skip the chart type token since it does not correspond to a tree node
    if (tokenParts[0] === 'flowchart')
      return;

    // reconstitute token parts that contain valid spaces e.g. `A[Entity Type]`
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

    // TODO: build tree node from tokenParts and put node in tree (or add new tree)
  });

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