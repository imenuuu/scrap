import {Leaf} from "./Leaf";
import type {TargetLeaf} from "./TargetLeaf";
import {Category} from "./Category";
import {log} from "winston";
import {logger} from "../config/logger/Logger";

const Logger = require("../config/logger/Logger");

class LeafTraverse {

    constructor() {
    }

    rootLeaf: Leaf;
    tLeaf: TargetLeaf;

    makeRootLeaf(name: string) {
        let leaf = new Leaf()
        leaf.name = name;
        leaf.url = ''
        leaf.depth = 0
        this.rootLeaf = leaf;
    }

    addChildLeaf(childLeaf: Leaf): LeafTraverse {
        this.rootLeaf.addChildLeaf(childLeaf, this);

        return this;
    }

    make(name: string): LeafTraverse {
        let lt = new LeafTraverse();
        lt.makeRootLeaf(name);

        return lt;
    }

    getFirstDepthChildLeaves(): Array<Leaf> {
        let children: Array<Leaf> = this.rootLeaf.childLeafList;

        return children;
    }

    target(l: Leaf): boolean {
        let query: string = l.name;
        let a: boolean = false;


        if (this.tLeaf != null && this.tLeaf.match(query)) a = true;


        if (!a && l != null) {
            return this.hierarchyFilter(query, l);

        } else {
            return a;
        }
    }

    hierarchyFilter(query: string, f: Leaf) {
        let pNameList: Array<string> = f.parentLeafNameList;

        if (pNameList != null) {
            let sb: string[] = []
            let str: string

            // StringBuffer sb = new StringBuffer();
            // String str;
            //root node 제외
            for (let i = 1; i < pNameList.length; i++) {
                str = pNameList[i];
                sb.push(str);
                sb.push(">");
            }
            sb.push(f.name);

            let tt: string = sb.join('');
            tt = tt.replaceAll(' ', '');
            let a: boolean = false;

            if (this.tLeaf != null && this.tLeaf.match(tt)) a = true;
            return a;

        }

        return false;
    }

    /**
     * 현재 입력할 leaf와 같은 이름과 url이 같은 것이 존재하는지 검사한다
     * 단,url이 없는 경우는 검사에서 제외한다.
     * @param
     * @return
     */
    // findSameLeaf(l:Leaf):boolean
    // {
    //     if(!StringUtils.isNullOrEmpty(l.getUrl()))
    //     {
    //         return findSameLeaf(rootLeaf, l);
    //     }

    //     return false;
    // }

    findSameLeaf(leaf: Leaf, targetLeaf: Leaf): boolean {
        if (leaf == null) {
            leaf = this.rootLeaf
        }

        let children: Array<Leaf> = leaf.childLeafList;
        // List<Leaf> children = leaf.getChildLeaf();

        if (children != null && children.length != 0) {
            for (let l of children) {
                if (l === targetLeaf) {
                    return true;
                }

            }
        }
        return false;
    }

    toCategoryList(): Array<Category> {
        let oneDepth: Array<Leaf> = this.rootLeaf.childLeafList;
        let cateList: Array<Category> = [];

        if (oneDepth != null && oneDepth.length > 0) {
            for (let l1 of oneDepth) {
                let cate: Category = new Category();
                cate.categoryNameList = l1.getLeafNames();
                cate.categoryUrl = l1.url;
                cateList.push(cate);
                if (l1.isLastLeaf() && (l1.url != null || l1.url != undefined)) {
                    let cate: Category = new Category();
                    cate.categoryNameList = l1.getLeafNames();
                    cate.categoryUrl = l1.url;
                    cateList.push(cate);
                } else if (l1.isLastLeaf()) {
                    let t: Leaf = this.getLastLeafWithUrl(l1.parentLeaf);
                    if (t != null) {
                        let cate: Category = new Category();
                        cate.categoryNameList = t.getLeafNames();
                        cate.categoryUrl = t.url;
                        if (!cateList.includes(cate)) {
                            cateList.push(cate);
                        }
                    }

                }
                this.traverse(l1, cateList);
            }

            if (this.tLeaf != null) {
                let cateListCopy: Array<Category> = [];
                for (let cate of cateList) {
                    if (cate.getCategoryString().replaceAll(" ", "").includes(this.tLeaf.filter))
                        cateListCopy.push(cate)
                }
                cateList = cateListCopy;
            }
        }

        console.log(cateList)
        return cateList;
    }

    getLastLeafWithUrl(f: Leaf): Leaf {
        if (f.url != null || f.url != undefined || f.url != "") {
            return f;
        } else {
            f = f.parentLeaf;
            if (f != null) {
                return this.getLastLeafWithUrl(f);
            }
        }

        return null;
    }

    traverse(leaf: Leaf, cateList: Array<Category>) {
        let children: Array<Leaf> = leaf.childLeafList;

        if (children != null && children.length > 0) {
            for (let l of children) {
                if (!l.isLastLeaf()) {
                    let cate: Category = new Category();
                    cate.categoryNameList = l.getLeafNames();
                    cate.categoryUrl = l.url;
                    cateList.push(cate);
                    this.traverse(l, cateList);
                } else {
                    if (l.url != null || l.url != undefined || l.url != "") {
                        let cate: Category = new Category();
                        cate.categoryNameList = l.getLeafNames();
                        cate.categoryUrl = l.url;
                        cateList.push(cate);

                    } else {

                        let t: Leaf = this.getLastLeafWithUrl(l.parentLeaf);

                        if (t != null) {
                            let cate: Category = new Category();
                            cate.categoryNameList = t.getLeafNames();
                            cate.categoryUrl = t.url;
                            if (!cateList.includes(cate)) {
                                cateList.push(cate);
                            }
                        }
                    }

                }

            }
        }
    }
}

export {LeafTraverse}

