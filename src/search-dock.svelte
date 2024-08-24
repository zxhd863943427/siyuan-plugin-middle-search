<script lang="ts">
    import SearchList from "@/libs/components/search-list.svelte";
    import { fetchSyncPost } from "siyuan";
    import {createEventDispatcher} from "svelte"
    
    export let currentSearchResults:SearchItem[]
    const once_search_num = 20
    let searchText = ""
    let searchKeywordList:string[] = []
    let total_num = 0
    let max_search_num = 5000
    let typingTimer: number | undefined;

    const dispatch = createEventDispatcher()

    function selectSearchResult({detail}:CustomEvent<SearchItem>) {
        console.log(detail)
        let result:SearchSelectResult = {...detail,searchKeywordList:searchKeywordList}
        dispatch('selectSearchResult', result);
    } 


    async function handleInput(){
        clearTimeout(typingTimer)
        typingTimer = setTimeout(InputHelper,500) as unknown as number
    }
    async function InputHelper() {
        searchKeywordList = searchText.trim().split(" ")
        let searchQueryInput = `"` + searchKeywordList.join(`" AND "`) + `"`
        let {data} = await fetchSyncPost("/api/query/sql",{stmt:`SELECT count(*) as total_num FROM blocks_fts WHERE blocks_fts MATCH 'content:${searchQueryInput}'  and blocks_fts.type in ('d','h','c','m','t','p')`})
        currentSearchResults = []
        //结果为空或错误
        if (!data || (data as number[]).length === 0){
            total_num = 0
            return
        }

        total_num = data[0].total_num
        for(let index = 0;index < total_num && index < max_search_num;index+=once_search_num){
            let result = await fetchSyncPost("/api/query/sql",{stmt:`SELECT blocks_fts.id as id, blocks_fts.content as content, blocks.content as doc  FROM blocks_fts join blocks WHERE blocks_fts.root_id = blocks.id and blocks_fts MATCH 'content:${searchQueryInput}'  and blocks_fts.type in ('d','h','c','m','t','p') order by blocks_fts.root_id limit ${once_search_num} offset ${index}`})
            let onceSearchResult:SearchItem[] = result.data
            onceSearchResult = onceSearchResult.map((item:SearchItem)=>{
                item.content = addMark(item.content,searchKeywordList)
       
                return item
            })
            currentSearchResults = [...currentSearchResults,...onceSearchResult]
        }
        currentSearchResults = currentSearchResults
        console.log(currentSearchResults)
    }


    function addMark(content:string,searchValues:string[]){
        let indexList = []
        searchValues.forEach((searchValue)=>{
            let index = content.indexOf(searchValue)
            if (index === -1){
                return
            }
            indexList.push(content.indexOf(searchValue))
   
            
        })

        let firstIndex = Math.min(...indexList)
        
        const startIndex = Math.max(0, firstIndex - 5);
        
        // 构建新的字符串
        let resultString = '...' + content.substring(startIndex);

        searchValues.forEach((searchValue)=>{
            resultString = resultString.replace(searchValue,`<mark>${searchValue}</mark>`)
        })

        return resultString
    }
    
    
    
</script>

<div class="middle-search-dock">
    <input
        type="text"
        class="b3-text-field fn__size200 middle-search-input"
        spellcheck="false"
        bind:value={searchText}
        on:input={handleInput}
    />
    <SearchList searchResults = {currentSearchResults} on:selectSearchResult={selectSearchResult}></SearchList>
    <div class="botton">搜索到的条目：{total_num}</div>
</div>

<style>
.middle-search-dock{
    overflow: hidden;
    height: 100%;
    flex-direction: column;
    display: flex;
}
.middle-search-input{
    height: 2em;
   
}
.botton{
    height: 2em;
}
</style>