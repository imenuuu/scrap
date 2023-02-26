class CategoryData {

    constructor() {
    }
    categoryNames: Array<string> ;
    categoryUrl: string;

    addCategoryName(categoryName:string) :CategoryData{
		this.categoryNames.push(categoryName);
		return this;
	}
	
	getCategoryString():string {
		return this.categoryNames.join(" > ");
	}

    hasName(categoryName:string) :boolean{
		return this.categoryNames.includes(categoryName);
	}

	copy() :CategoryData{
		let category:CategoryData = new CategoryData();

		category.categoryNames = this.categoryNames.slice();
		category.categoryUrl = this.categoryUrl;

		return category;
	}
}
export {CategoryData}