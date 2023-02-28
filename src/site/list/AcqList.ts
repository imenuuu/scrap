import type {ColtBaseUrlItem} from "../../dto/ColtBaseUrlItem";

export interface AcqList {
    _glbConfig: { [key: string]: any; };
    collectSite: string;


    getItemUrls: (url: string) => Promise<Array<ColtBaseUrlItem>>;
}