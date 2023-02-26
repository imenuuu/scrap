import type {CategoryData} from "../../data/CategoryData";

export interface Category {
    _glbConfig: { [key: string]: any; };
    collectSite: string;
    cnt: number;

    getCategory:(fliterList) => Promise<Array<CategoryData>>;
}