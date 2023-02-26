import type {Category} from "../site/category/Category";
import type {CategoryData} from "../data/CategoryData";

export class CategoryTask {
    private readonly _collectSite: string;
    private readonly _classPath: string;
    private readonly _config: { [key: string]: any; };

    constructor(collectSite, dirName, chromeConfig) {
        this._collectSite = collectSite;
        this._classPath = dirName;
        this._config = chromeConfig;
    }

    async execute(fliterList) : Promise<Array<CategoryData>> {

        const CateClassModule = require(this._classPath);
        const cateClass = Object.values(CateClassModule)[0] as
            new (config: { [key: string]: any; }, collectSite: string, cnt: number) => Category;
        const category = new cateClass(this._config, this._collectSite, 0);
        const item = await category.getCategory(fliterList);
        return item;
    }
}