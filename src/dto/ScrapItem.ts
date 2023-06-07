class ScrapItem {   // 일반적으로 인터페이스명에 I를 붙힙니다.

    url: string;

    goods: string;

    imgUrl: string;

    constructor(data: { url: string; goods: string; imgUrl: string }) {
    this.url = data.url;
    this.goods = data.goods;
    this.imgUrl = data.imgUrl;
}

}