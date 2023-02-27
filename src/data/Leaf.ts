import type {LeafTraverse} from "./LeafTraverse";

class Leaf{

    constructor() {
    }

    name: string = '';
    url: string = '';
    depth: number = 0;
    bestItem :boolean = false;
    specialExhibition: boolean = false;
    parentLeaf :Leaf;
    parentLeafNameList :Array<string> = [];
    childLeafList :Array<Leaf> = [];

    //  Leaf make(String name,String url) 
	// {
	// 	return make(name,url,false,false);
	// }
	
	static make(name:string, url:string, bestItem:boolean, specialExhibition:boolean) :Leaf
	{
        if(bestItem == null && specialExhibition == null) {
            bestItem = false;
            specialExhibition = false;
        }

		let leaf:Leaf = new Leaf();
		
		leaf.name = name;
		leaf.url = url;
		leaf.bestItem = bestItem;
		leaf.specialExhibition = specialExhibition;
		
		return leaf;
		
	}

    getLeafNames() :Array<string>
	{
        let ppList:Array<string> = this.parentLeafNameList.slice();
		ppList.push(this.name);
		
		return ppList;
	}

    addParentLeafName(parentName :string)
	{	
		this.parentLeafNameList.push(parentName);
	}

    isLastLeaf():boolean
	{
		if(this.childLeafList ==null || this.childLeafList.length == 0)
		{
			return true;
		}
		
		return false;
	}

    getLeaf(leafName:string, direct:boolean):Leaf
	{
        let m:Leaf;
		if(this.childLeafList != null)
		{
            let children:Array<Leaf> = this.childLeafList;
			
			if(children !=null && children.length != 0)
			{
				for(let ff of children)
				{
					if(ff.name === leafName)
					{
						return ff;
					}else {
						if(!direct)
						{
							m=this.getChildLeaf(ff, leafName);
							if(m!=null)
							{
								return m;
							}
						}						
					}
				}
			}			
		}		
		return null;
	}

    getChildLeaf(sourceLeaf:Leaf, leaf:string):Leaf
	{
		let children:Array<Leaf>  = sourceLeaf.childLeafList;
		let m:Leaf;
		if(children !=null && children.length != 0)
		{
			for(let ff of children)
			{
				if(ff.name === leaf)
				{
					return ff;
					
				}else {
					m = this.getChildLeaf(ff, leaf);
					
					if(m!=null)
					{
						return m;
					}
				}
			}
		}
		
		return null;
	}

	addChildLeaf(f:Leaf, lft:LeafTraverse)
	{
		if(f != null)
		{
			// if(this.childrenLeaf == null)
			// {
			// 	this.childrenLeaf = new ArrayList<>();
			// }
			
			if(f.depth == 0)
			{
				//depth를 보정한다.
				f.depth = this.depth + 1;
			}
			
			if(this.parentLeafNameList != null && this.parentLeafNameList.length != 0)
			{
				for(let s of this.parentLeafNameList)
				{
					f.addParentLeafName(s);
				}
				
			}
			
			f.addParentLeafName(this.name);
			this.childLeafList.push(f);
			f.parentLeaf = this;
			
			if(lft != null)
			{
				if(lft.target(f))
				{
					// throw PException.buildException(WSErrorCode.GOODS_TARGET_CATEGORY, "Target Category");
				}
			}
			
		}
	}
}
export {Leaf}
