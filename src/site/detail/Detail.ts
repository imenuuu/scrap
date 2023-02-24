import type {ColtItem} from "../../dto/ColtItem";

export interface Detail {
    _glbConfig: { [key: string]: any; };
    collectSite: string;
    cnt: number;


    // extractFromItemList(url) :Promise<ColtItem>
    extractItemDetail: (url: string) => Promise<ColtItem>;
}