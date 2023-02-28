import type {Category} from "../../data/Category";

export interface AcqCategory {
    _glbConfig: { [key: string]: any; };
    collectSite: string;

    getCategory:(filterList : object) => Promise<Array<Category>>;
}