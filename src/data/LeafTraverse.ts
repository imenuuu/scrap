import type {Leaf} from "./Leaf";
import type {TargetLeaf} from "./TargetLeaf";

class LeafTraverse{

    constructor() {
    }
    rootLeaf :Leaf;
    tLeaf :TargetLeaf;

    makeRootLeaf(name:string)
    {
        let root:Leaf;
        root.name = name;
        root.depth = 0;
        root.url = "";
        
        this.rootLeaf = root;
    }

    addChildLeaf(childLeaf:Leaf) :LeafTraverse
    {
        this.rootLeaf.addChildLeaf(childLeaf,this);
        
        return this;
    }

    make(siteName:string) :LeafTraverse
    {
        let lt = new LeafTraverse();
        lt.makeRootLeaf(siteName);
        
        return lt;
    }

    getFirstDepthChildLeaves() :Array<Leaf>
    {
        let children:Array<Leaf> = this.rootLeaf.childrenLeaf;
        
        return children;
    }

    target(l:Leaf) :boolean
    {
        let query:string = l.name;
        let a:boolean = false;
        
        
        if(this.tLeaf!=null && this.tLeaf.match(query)) a =  true;
        
        
        if(!a && l!=null)
        {
            return this.hierarchyFilter(query,l);
            
        }else {
            return a;
        }
    }

    hierarchyFilter(query:string, f:Leaf)
    {
        let pNameList:Array<string> = f.parentLeafName;
        
        if(pNameList!=null)
        {
            let sb:string[]
            let str:string

            // StringBuffer sb = new StringBuffer();
            // String str;
            //root node 제외
            for(let i=1; i< pNameList.length; i++)
            {
                str = pNameList[i];
                sb.push(str);
                sb.push(">");
            }
            sb.push(f.name);
            
            let tt:string = sb.join('');
            tt = tt.replaceAll(' ', '');
            let a:boolean = false;            
            
            if(this.tLeaf!=null && this.tLeaf.match(tt)) a = true;
            return a;
            
        }
        
        return false;
    }

    /**
     * 현재 입력할 leaf와 같은 이름과 url이 같은 것이 존재하는지 검사한다
     * 단,url이 없는 경우는 검사에서 제외한다.
     * @param 
     * @return
     */
    // findSameLeaf(l:Leaf):boolean
    // {
    //     if(!StringUtils.isNullOrEmpty(l.getUrl()))
    //     {
    //         return findSameLeaf(rootLeaf, l);
    //     }
        
    //     return false;
    // }

    findSameLeaf(leaf:Leaf ,targetLeaf:Leaf):boolean
    {
        if(leaf == null) {
            leaf = this.rootLeaf
        }

        let children:Array<Leaf> = leaf.childrenLeaf;
        // List<Leaf> children = leaf.getChildLeaf();
        
        if(children != null && children.length != 0)
        {
            for(let l of children)
            {
                if(l === targetLeaf)
                {
                    return true;
                }
                
            }
        }        
        return false;
    }

}
export {LeafTraverse}

