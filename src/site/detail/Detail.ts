import type {ColtItem} from "../../dto/ColtItem";

export interface Detail {
    // _glbConfig: { [key: string]: any; };
    collectSite: string;
    luminati_zone: string;
    // OXYLABS: boolean;
    // LUMINATI: boolean;
    cnt: number;

    // extractFromItemList(url) :Promise<ColtItem>
    extractItemDetail: (url: string) => Promise<ColtItem>;
}