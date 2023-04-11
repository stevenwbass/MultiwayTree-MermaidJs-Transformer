using MultiwayTree;
using System.Text;

namespace MultiwayTreeMermaidJsTransformer
{
    public class ChartDefToTreeTransformer<T> where T : IEquatable<T>
    {
        public MultiwayTree<T> Transform(string chartDef)
        {
            var tree = new MultiwayTree<T>(default(T));

            // TODO: parse chartDef and build tree

            return tree;
        }
    }
}
