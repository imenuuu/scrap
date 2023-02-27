import type {Category} from "../../data/Category";

export interface AcqCategory {
    _glbConfig: { [key: string]: any; };
    collectSite: string;

    getCategory:(url :string ,filterList : string) => Promise<Array<Category>>;
}