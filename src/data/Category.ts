class Category {

    constructor() {
    }

    categoryNameList: Array<string>;
    categoryUrl: string;

    addCategoryName(categoryName: string): Category {
        this.categoryNameList.push(categoryName);
        return this;
    }

    getCategoryString(): string {
        return this.categoryNameList.join(" > ");
    }

    hasName(categoryName: string): boolean {
        return this.categoryNameList.includes(categoryName);
    }

    copy(): Category {
        let category: Category = new Category();

        category.categoryNameList = this.categoryNameList.slice();
        category.categoryUrl = this.categoryUrl;

        return category;
    }
}

export {Category}