const yaml_parser = require('yaml-front-matter');

export function transformChartToTrees(chartDef) {
    
    if (chartDef == null || chartDef.length === 0)
        return null;


    /*  mermaidjs supports chart metadata (https://github.com/mermaid-js/mermaid/pull/3706)
        via Jekyll-style YAML front matter blocks (https://jekyllrb.com/docs/front-matter/) e.g.

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
function parseChartDef(chartDef) {
  /*
    `---
title: My awesome chart
---

flowchart LR
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
    // TODO: parse tokens into token parts, build tree nodes, and put nodes in trees
  });

  return [
    {
      Data: {
          Attribute: "Entity Type",
          Value: "Firm"
      },
      Children: []
    },
    {
      Data: {
        Attribute: "Entity Type",
        Value: "Product/Strategy"
      },
      Children: [
        {
          Data: {
            Attribute: "Investment Focus",
            Value: "Long Only"
          },
          Children: []
        },
        {
          Data: {
            Attribute: "Investment Focus",
            Value: "Two"
          },
          Children: []
        }
      ]
    }
  ];
}