class TargetLeaf{

    filter : string;

    constructor() {
    }   
	
	match(filter:string):boolean
	{
		if(this.filter.localeCompare(filter)) return true;
		return false;
	}
	
	setFilterString(filter:string) {
		this.filter = filter;
	}
}
export {TargetLeaf}