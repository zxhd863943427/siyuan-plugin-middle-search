<script lang="ts">
    import VirtualList from '@sveltejs/svelte-virtual-list';
    import SearchListItem from '@/libs/components/search-list-item.svelte';
    import {createEventDispatcher} from "svelte"
    export let searchResults
    console.log(searchResults)
    const dispatch = createEventDispatcher()

    
    function selectSearchResult({detail}) {
        console.log(detail)
        dispatch('selectSearchResult', detail);
    } 
</script>



<div class='middle-search-list-container'>
    <VirtualList 
    items={searchResults} 
    let:item
    class="middle-search-vlist"
    >
        <SearchListItem searchItem={item} on:selectSearchResult={selectSearchResult}></SearchListItem>
    </VirtualList>
</div>






<style> 

.middle-search-list-container {
    border-top: 1px solid #333;
    border-bottom: 1px solid #333;
    /* min-height: 200px; */
    /* height: 90%; */
    overflow-y: auto;
    flex-grow: 1;
}

</style>