import {
    Plugin,
    showMessage,
    getFrontend,
    getBackend,
    IModel,

} from "siyuan";
import "@/index.scss";

import HelloExample from "@/hello.svelte";
import SearchDock from "@/search-dock.svelte"


import { SettingUtils } from "./libs/setting-utils";

const STORAGE_NAME = "menu-config";
const TAB_TYPE = "custom_tab";
const DOCK_TYPE = "dock_tab";

export default class PluginSample extends Plugin {

    customTab: () => IModel;
    private isMobile: boolean;

    private settingUtils: SettingUtils;

    async onload() {
        this.data[STORAGE_NAME] = { readonlyText: "Readonly" };

        console.log("loading middle search", this.i18n);

        const frontEnd = getFrontend();
        this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";
        // 图标的制作参见帮助文档

        this.addDock({
            config: {
                position: "LeftBottom",
                size: { width: 200, height: 0 },
                icon: "iconZoomIn",
                title: "Custom Dock",
                hotkey: "⌥⌘W",
            },
            data: {
                text: "This is my custom dock"
            },
            type: DOCK_TYPE,
            resize() {
                console.log(DOCK_TYPE + " resize");
            },
            update() {
                console.log(DOCK_TYPE + " update");
            },
            init: (dock) => {
                let SearchDockApp = new SearchDock({
                    target: dock.element,
                    props:{
                        currentSearchResults:testSearchResult
                    }
                })
                SearchDockApp.$on("selectSearchResult",this.selectSearchResult)
            },
            destroy() {
                console.log("destroy dock:", DOCK_TYPE);
            }
        });



        console.log(this.i18n.helloPlugin);
    }

    onLayoutReady() {
        // this.loadData(STORAGE_NAME);
        // this.settingUtils.load();
        console.log(`frontend: ${getFrontend()}; backend: ${getBackend()}`);

        console.log(
            "Official settings value calling example:\n" +
            this.settingUtils.get("InputArea") + "\n" +
            this.settingUtils.get("Slider") + "\n" +
            this.settingUtils.get("Select") + "\n"
        );

        let tabDiv = document.createElement("div");
        new HelloExample({
            target: tabDiv,
            props: {
                app: this.app,
            }
        });
        this.customTab = this.addTab({
            type: TAB_TYPE,
            init() {
                this.element.appendChild(tabDiv);
                console.log(this.element);
            },
            beforeDestroy() {
                console.log("before destroy tab:", TAB_TYPE);
            },
            destroy() {
                console.log("destroy tab:", TAB_TYPE);
            }
        });
    }

    async onunload() {
        console.log(this.i18n.byePlugin);
        showMessage("Goodbye SiYuan Plugin");
        console.log("onunload");
    }

    uninstall() {
        console.log("uninstall");
    }

    async selectSearchResult({detail}:CustomEvent<SearchSelectResult>){
        console.log("in main",detail)
        if (!cache.inCache(detail)){
            cache.setCache(detail)
            jumpToBlock(detail.id)
            CSS.highlights.clear()
            highlightManager.reset()
            highlightManager.setHightlight(detail)
        }
        else{
            highlightManager.nextHighlight()
        }
        
        
    }
}

function jumpToBlock(id:string){
    window.open(`siyuan://blocks/${id}`)
}

class HighlightManager{
    highlightDOM:HTMLElement
    resultIndex:number
    resultCount:number
    currentDetail:SearchItem
    ranges:Range[]
    setSuccess:Promise<any>
    resolver:()=>{}
    constructor(){
        this.reset()

    }
    reset(){
        this.resultIndex=0
        this.resultCount=0
    }
    async setHightlight(detail:SearchSelectResult){
        let { promise, resolve} = (Promise as any).withResolvers()
        this.setSuccess = promise
        this.resolver = resolve
        let result = document.querySelectorAll(`.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg div[data-node-id="${detail.id}"]`)
        if (result.length === 0 ){
            setTimeout(()=>{this.setHightlight(detail)},10)
            return this.setSuccess
        }
        this.resolver()
        this.highlightDOM = result[0] as HTMLElement
        // 创建高亮对象
        let ranges = highlightHitResults(this.highlightDOM,detail.searchKeywordList)
        let  searchResultsHighlight = new Highlight(...ranges.flat())
        this.resultCount = ranges.flat().length
        this.ranges = ranges.flat()
        // console.log(ranges.flat())

        // 全部都高亮
        ranges = highlightHitResults((document.querySelectorAll(`.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg`)[0] as HTMLElement),detail.searchKeywordList)
        let TotalSearchResultsHighlight = new Highlight(...ranges.flat())

        // 注册高亮
        CSS.highlights.set("search-results", searchResultsHighlight)
        CSS.highlights.set("search-results", TotalSearchResultsHighlight)

        console.log(this.ranges,ranges)

        this.scrollIntoRanges(0)
   
    }
    nextHighlight(){
        if (this.resultCount === 0){
            this.resultIndex = 0
            return
        }
        if (this.resultIndex < this.resultCount - 1){
            this.resultIndex += 1
        }
        else{
            this.resultIndex = 0
        }
        this.scrollIntoRanges(this.resultIndex)
    }

    scrollIntoRanges(index: number) {
        const range = this.ranges[index]
        // const parent = range.commonAncestorContainer.parentElement
        // parent.scrollIntoView({ behavior: 'smooth', block: "center" })
    
        
        let doc_rect=this.highlightDOM.getBoundingClientRect()
        let mid_y=doc_rect.top+doc_rect.height/2
        let range_rect = range.getBoundingClientRect();
        this.highlightDOM.scrollBy(0,range_rect.y-mid_y)
      
        CSS.highlights.set("search-focus", new Highlight(range))
    }
}

let highlightManager:HighlightManager = new HighlightManager()



class SearchCache{
    cacheText:string
    cacheID:string
    constructor(){
        this.cacheText = ""
        this.cacheID = ""
    }
    setCache(detail:SearchSelectResult){
        this.cacheText = detail.searchKeywordList.join(" ")
        this.cacheID = detail.id
    }
    inCache(detail:SearchSelectResult){
        return this.cacheText === detail.searchKeywordList.join(" ") && this.cacheID === detail.id
    }
}

let cache = new SearchCache()

function highlightHitResult(highlightDOM:HTMLElement,value: string) { // 搜索并高亮结果


    // 首先，选取所有符合条件的元素
    // const elements = document.querySelectorAll('.layout-tab-container > div:not(.fn__none) .protyle-wysiwyg [data-node-id]');
    // 获取文档根,后续直接对全文档文本进行搜索,
    const docRoot = highlightDOM;
    //console.log("docRoot:")
    //console.log(docRoot)
    const docText=docRoot.textContent.toLowerCase();
    const docLen=docText.length;

    // 准备一个数组来保存所有文本节点
    const allTextNodes = [];
    let incr_lens = [];
    let cur_len0=0;

    const treeWalker = document.createTreeWalker(docRoot, NodeFilter.SHOW_TEXT);
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        allTextNodes.push(currentNode);
        cur_len0+=currentNode.textContent.length
        incr_lens.push(cur_len0);
        currentNode = treeWalker.nextNode();
    }


    // 为空判断
    const str = value.trim().toLowerCase()
    if (!str) return
    let textNodeCnt=allTextNodes.length
    let cur_nodeIdx=0;
    let txtNode
    // 查找所有文本节点是否包含搜索词，并创建对应的 Range 对象
    // 把全局匹配索引转换为文本节点的索引和offset,使得range可以跨多个文本节点
    let ranges = [];
    let startIndex = 0;
    let endIndex=0;
    while ((startIndex = docText.indexOf(str, startIndex)) !== -1) {
        const range = document.createRange();
        endIndex=startIndex + str.length
        // console.log(`开始结束索引:${startIndex}-${endIndex}`)
        try {
            while (cur_nodeIdx<textNodeCnt-1 && incr_lens[cur_nodeIdx]<=startIndex){
              cur_nodeIdx++
            }
            txtNode= allTextNodes[cur_nodeIdx]
            let startOffset=startIndex-incr_lens[cur_nodeIdx]+txtNode.textContent.length;
            // console.log(`cur_nodeIdx:${cur_nodeIdx}|offset:${startOffset}|txtNode:${txtNode.textContent}`)
            range.setStart(txtNode, startOffset);

            while (cur_nodeIdx<textNodeCnt-1 && incr_lens[cur_nodeIdx]<endIndex){
              cur_nodeIdx++
            }
            txtNode= allTextNodes[cur_nodeIdx]
            let endOffset=endIndex-incr_lens[cur_nodeIdx]+txtNode.textContent.length;
            range.setEnd(txtNode,endOffset);
            ranges.push(range);
        } catch (error) {
            console.error("Error setting range in node:", error);
        }
        startIndex = endIndex;
    }

    return ranges
    // 滚动页面
    // scroollIntoRanges(resultIndex.value)
}

function highlightHitResults(highlightDOM: HTMLElement, values: string[]) {
    // 获取文档根,后续直接对全文档文本进行搜索
    const docRoot = highlightDOM;
    const docText = docRoot.textContent.toLowerCase();

    // 准备一个数组来保存所有文本节点
    const allTextNodes = [];
    let incr_lens = [];
    let cur_len0 = 0;

    const treeWalker = document.createTreeWalker(docRoot, NodeFilter.SHOW_TEXT);
    let currentNode = treeWalker.nextNode();
    while (currentNode) {
        allTextNodes.push(currentNode);
        cur_len0 += currentNode.textContent.length;
        incr_lens.push(cur_len0);
        currentNode = treeWalker.nextNode();
    }

    // 为空判断
    const trimmedValues = values.map(value => value.trim().toLowerCase()).filter(value => value);
    if (trimmedValues.length === 0) return;

    let textNodeCnt = allTextNodes.length;

    let txtNode;
    let ranges = [];

    trimmedValues.forEach(str => {
        let startIndex = 0;
        let endIndex = 0;
        let cur_nodeIdx = 0;
        while ((startIndex = docText.indexOf(str, startIndex)) !== -1) {
            const range = document.createRange();
            endIndex = startIndex + str.length;
            try {
                while (cur_nodeIdx < textNodeCnt - 1 && incr_lens[cur_nodeIdx] <= startIndex) {
                    cur_nodeIdx++;
                }
                txtNode = allTextNodes[cur_nodeIdx];
                let startOffset = startIndex - incr_lens[cur_nodeIdx] + txtNode.textContent.length;
                range.setStart(txtNode, startOffset);

                while (cur_nodeIdx < textNodeCnt - 1 && incr_lens[cur_nodeIdx] < endIndex) {
                    cur_nodeIdx++;
                }
                txtNode = allTextNodes[cur_nodeIdx];
                let endOffset = endIndex - incr_lens[cur_nodeIdx] + txtNode.textContent.length;
                range.setEnd(txtNode, endOffset);
                ranges.push(range);
            } catch (error) {
                console.error("Error setting range in node:", error);
            }
            startIndex = endIndex;
        }
    });

    // 按起始位置对ranges进行排序
    ranges.sort((a, b) => {
        const compare = a.startContainer.compareDocumentPosition(b.startContainer);
        if (compare & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1;
        } else if (compare & Node.DOCUMENT_POSITION_PRECEDING) {
            return 1;
        } else {
            return a.startOffset - b.startOffset;
        }
    });

    return ranges;
}




const testSearchResult = []